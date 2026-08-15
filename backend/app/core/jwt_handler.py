from datetime import datetime, timedelta

from jose import JWTError, jwt


from app.core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)


def create_access_token(data: dict):
    """
    Creates a JWT access token.
    """
    payload = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update({"exp": int(expire.timestamp())})

    secret = SECRET_KEY or "8e7d2f1c5a9b4f6e8d3c7a1b5f9e2d6c4a8b7e1d3f5c9a2b6e8d1f4a7c5b9e2"
    algo = ALGORITHM or "HS256"

    return jwt.encode(
        payload,
        secret,
        algorithm=algo
    )


def verify_access_token(token: str):
    """
    Verifies a JWT access token.
    """

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None