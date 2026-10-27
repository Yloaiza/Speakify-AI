
from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config

security = HTTPBearer(auto_error=False)


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

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": config.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": f"Bearer {credentials.credentials}",
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

        return AuthenticatedUser(id=user_id)

    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        print(f"[auth] error validando sesión: {exc}")
        raise HTTPException(
            status_code=503,
            detail="No se pudo verificar la sesión con Supabase",
        ) from exc
