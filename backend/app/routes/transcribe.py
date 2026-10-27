from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..prompts import LANGUAGES
from ..providers import get_provider

router = APIRouter()

MAX_BYTES = 5 * 1024 * 1024  # 5 MB (un WAV de 30 s a 16 kHz pesa ~1 MB)


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form(...)):
    if language not in LANGUAGES:
        raise HTTPException(400, "Idioma no soportado")

    data = await audio.read()
    if not data:
        raise HTTPException(400, "Audio vacio")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "El audio es demasiado largo")

    try:
        provider = get_provider()
        # El frontend siempre envia WAV (PCM 16 kHz mono).
        text = await provider.transcribe(data, "audio/wav", LANGUAGES[language]["name"])
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
    except Exception as exc:
        print(f"[gemini] error al transcribir: {exc}")
        raise HTTPException(502, "No pude transcribir el audio, intenta de nuevo")

    return {"text": text.strip()}
