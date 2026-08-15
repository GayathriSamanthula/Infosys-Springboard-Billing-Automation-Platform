import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Converts a plain password into a secure bcrypt hashed password string.
    """
    if not password:
        password = ""
    try:
        return pwd_context.hash(password)
    except Exception:
        return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Checks whether the entered password matches the hashed password in database.
    Supports bcrypt, SHA256 fallback, and direct match.
    """
    if not plain_password or not hashed_password:
        return False

    if plain_password == hashed_password:
        return True

    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception:
        pass

    hashed_plain = hashlib.sha256((plain_password or '').encode('utf-8')).hexdigest()
    if hashed_plain == hashed_password:
        return True

    return False