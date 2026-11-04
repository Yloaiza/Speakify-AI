
import time
from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config

security = HTTPBearer(auto_error=False)

# Cliente HTTP reutilizado (evita un handshake TLS nuevo en cada peticion)
# y cache corto de tokens ya validados (evita llamar a Supabase en cada mensaje).
_http = httpx.AsyncClient(timeout=10.0)
_TOKEN_TTL = 60  # segundos
_token_cache: dict[str, tuple[float, str]] = {}


@dataclass
class AuthenticatedUser:
    id: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión para continuar",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not config.SUPABASE_URL or not config.SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="La autenticación no está configurada en el servidor",
        )

    token = credentials.credentials
    cached = _token_cache.get(token)
    if cached and cached[0] > time.monotonic():
        return AuthenticatedUser(id=cached[1])

    try:
        response = await _http.get(
            f"{config.SUPABASE_URL.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": config.SUPABASE_PUBLISHABLE_KEY,
                "Authorization": f"Bearer {token}",
            },
        )

        if response.status_code == 401 or response.status_code == 403:
            raise HTTPException(
                status_code=401,
                detail="Tu sesión no es válida o ha expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )

        response.raise_for_status()
        user_data = response.json()
        user_id = user_data.get("id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="No se pudo verificar tu usuario",
            )

        if len(_token_cache) > 500:
            _token_cache.clear()
        _token_cache[token] = (time.monotonic() + _TOKEN_TTL, user_id)
        return AuthenticatedUser(id=user_id)

    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        print(f"[auth] error validando sesión: {exc}")
        raise HTTPException(
            status_code=503,
            detail="No se pudo verificar la sesión con Supabase",
        ) from exc
