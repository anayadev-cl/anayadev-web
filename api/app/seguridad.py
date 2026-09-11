import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .bd import get_sesion
from .config import ajustes
from .modelos import Usuario


def encriptar_clave(clave: str) -> str:
    sal = secrets.token_hex(16)
    digesto = hashlib.pbkdf2_hmac("sha256", clave.encode(), sal.encode(), 260_000).hex()
    return f"{sal}${digesto}"


def verificar_clave(clave: str, guardado: str) -> bool:
    try:
        sal, digesto = guardado.split("$", 1)
    except ValueError:
        return False
    candidato = hashlib.pbkdf2_hmac(
        "sha256", clave.encode(), sal.encode(), 260_000
    ).hex()
    return secrets.compare_digest(candidato, digesto)


def crear_token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, ajustes.secreto_jwt, algorithm="HS256")


esquema_bearer = HTTPBearer(auto_error=False)


def admin_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(esquema_bearer),
    sesion: Session = Depends(get_sesion),
) -> Usuario:
    if credenciales is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido"
        )
    try:
        payload = jwt.decode(
            credenciales.credentials, ajustes.secreto_jwt, algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado"
        )
    usuario = (
        sesion.query(Usuario).filter(Usuario.usuario == payload.get("sub")).first()
    )
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inexistente"
        )
    return usuario
