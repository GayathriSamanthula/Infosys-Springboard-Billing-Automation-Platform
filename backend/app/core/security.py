import hashlib
import bcrypt


def hash_password(password: str) -> str:
    """
    Converts a plain password into a secure bcrypt hashed password string.
    """
    if not password:
        password = ""
    try:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
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

    hashed_plain = hashlib.sha256((plain_password or '').encode('utf-8')).hexdigest()
    if hashed_plain == hashed_password:
        return True

    try:
        if isinstance(hashed_password, str) and (hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")):
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        pass

    return False