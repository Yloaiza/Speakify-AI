
import asyncio

from . import config

_client = None


def _get_client():
    """Cliente de Supabase usando la clave secreta solo en el backend."""
    global _client

    if _client is not None:
        return _client

    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        return None

    from supabase import create_client

    _client = create_client(
        config.SUPABASE_URL,
        config.SUPABASE_SERVICE_KEY,
    )
    return _client


def _insert_message(
    user_id: str,
    session_id: str,
    language: str,
    role: str,
    content: str,
) -> None:
    client = _get_client()

    if client is None:
        raise RuntimeError("Supabase no está configurado")

    client.table("messages").insert({
        "user_id": user_id,
        "session_id": session_id,
        "language": language,
        "role": role,
        "content": content,
    }).execute()


async def save_message(
    user_id: str,
    session_id: str | None,
    language: str,
    role: str,
    content: str,
) -> None:
    if not session_id or not content.strip():
        return

    await asyncio.to_thread(
        _insert_message,
        user_id,
        session_id,
        language,
        role,
        content,
    )


def _insert_activity(
    user_id: str,
    session_id: str,
    language: str,
    activity_type: str,
    reference_id: str | None = None,
) -> None:
    client = _get_client()

    if client is None:
        raise RuntimeError("Supabase no está configurado")

    client.table("learning_activity").insert({
        "user_id": user_id,
        "session_id": session_id,
        "language": language,
        "activity_type": activity_type,
        "reference_id": reference_id,
    }).execute()


async def save_activity(
    user_id: str,
    session_id: str,
    language: str,
    activity_type: str,
    reference_id: str | None = None,
) -> None:
    await asyncio.to_thread(
        _insert_activity,
        user_id,
        session_id,
        language,
        activity_type,
        reference_id,
    )


def _get_activity_rows(
    user_id: str,
    session_id: str,
    language: str,
) -> list[dict]:
    client = _get_client()

    if client is None:
        raise RuntimeError("Supabase no está configurado")

    response = (
        client.table("learning_activity")
        .select("activity_type, reference_id, created_at")
        .eq("user_id", user_id)
        .eq("session_id", session_id)
        .eq("language", language)
        .order("created_at", desc=True)
        .limit(1000)
        .execute()
    )

    return response.data or []


async def get_activity_rows(
    user_id: str,
    session_id: str,
    language: str,
) -> list[dict]:
    return await asyncio.to_thread(
        _get_activity_rows,
        user_id,
        session_id,
        language,
    )
