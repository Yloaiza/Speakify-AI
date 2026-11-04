
from typing import Literal

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .. import db
from ..auth import AuthenticatedUser, get_current_user
from ..prompts import LANGUAGES, LEVELS, build_system_prompt
from ..providers import get_provider

router = APIRouter()

MAX_HISTORY = 20
_background: set[asyncio.Task] = set()  # evita que el GC cancele las tareas


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    language: str
    level: str = "A1"
    mode: Literal["text", "voice"] = "text"
    session_id: str | None = None
    messages: list[Message] = Field(min_length=1)


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if req.language not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")

    if req.level not in LEVELS:
        raise HTTPException(400, "Nivel no valido")

    if req.messages[-1].role != "user":
        raise HTTPException(400, "El ultimo mensaje debe ser del usuario")

    try:
        provider = get_provider()
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))

    system = build_system_prompt(req.language, req.level, req.mode)
    history = [m.model_dump() for m in req.messages[-MAX_HISTORY:]]
    last_user = history[-1]["content"]

    async def event_stream():
        parts: list[str] = []

        try:
            async for piece in provider.stream(system, history):
                parts.append(piece)
                yield piece
        except Exception as exc:
            print(f"[gemini] error: {exc}")
            yield (
                "\n\n[Error: no pude contactar a la IA. "
                "Revisa tu API key o intenta de nuevo.]"
            )
            return

        # En segundo plano: la respuesta (y la voz) no esperan a Supabase.
        async def persist():
            try:
                await db.save_message(
                    current_user.id, req.session_id, req.language, "user", last_user
                )
                await db.save_message(
                    current_user.id, req.session_id, req.language, "assistant", "".join(parts)
                )
            except Exception as exc:
                print(f"[supabase] no se pudieron guardar los mensajes: {exc}")

        task = asyncio.create_task(persist())
        _background.add(task)
        task.add_done_callback(_background.discard)

    return StreamingResponse(
        event_stream(),
        media_type="text/plain; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
