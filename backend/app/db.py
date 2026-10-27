import asyncio

from . import config

_client = None


def _get_client():
    """Cliente de Supabase (opcional). Devuelve None si no esta configurado."""
    global _client
    if _client is not None:
        return _client
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        return None
    from supabase import create_client

    _client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    return _client


def _insert_message(session_id: str, language: str, role: str, content: str) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        client.table("messages").insert(
            {
                "session_id": session_id,
                "language": language,
                "role": role,
                "content": content,
            }
        ).execute()
    except Exception as exc:  # no queremos romper el chat si falla la BD
        print(f"[supabase] no se pudo guardar el mensaje: {exc}")


async def save_message(session_id: str | None, language: str, role: str, content: str):
    if not session_id or not content.strip():
        return
    await asyncio.to_thread(_insert_message, session_id, language, role, content)
