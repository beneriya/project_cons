"""JWT token creation and validation."""

from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings
from app.domain.entities import User

# bcrypt has 72 byte limit; ensure we use valid encoding
def _ensure_bytes(s: str) -> bytes:
    return s.encode("utf-8") if isinstance(s, str) else s


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_ensure_bytes(plain), _ensure_bytes(hashed))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_ensure_bytes(password), bcrypt.gensalt()).decode("utf-8")


def create_access_token(user: User) -> str:
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict | None:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
