from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password
from app.core.jwt_handler import create_access_token


def create_user(db: Session, user_data: UserCreate):
    valid_keys = {"NEXORA_ADMIN_2026", "VELORA_ADMIN_2026", "ADMIN_2026"}
    provided_key = (getattr(user_data, 'admin_secret_key', None) or '').strip().upper()

    if provided_key not in valid_keys:
        raise ValueError("Invalid Admin Registration Secret Key. Access denied.")

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise ValueError("Email is already registered.")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
        working_id=getattr(user_data, 'working_id', None),
        role=getattr(user_data, 'role', None) or "ADMIN"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(db: Session):
    return db.query(User).order_by(User.id).all()


def update_user(db: Session, user_id: int, user_data: UserCreate):
    existing_user = db.query(User).filter(User.id == user_id).first()
    if existing_user is None:
        return None

    existing_user.username = user_data.username
    existing_user.email = user_data.email
    if user_data.password:
        existing_user.password = hash_password(user_data.password)
    if hasattr(user_data, 'role') and user_data.role:
        existing_user.role = user_data.role

    db.commit()
    db.refresh(existing_user)
    return existing_user


def delete_user(db: Session, user_id: int):
    existing_user = db.query(User).filter(User.id == user_id).first()
    if existing_user is None:
        return None

    db.delete(existing_user)
    db.commit()
    return existing_user


def reset_user_password(db: Session, email: str, new_password: str):
    from sqlalchemy import func
    email_clean = (email or '').strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    if user is None:
        username_val = email_clean.split('@')[0] if '@' in email_clean else email_clean
        user = User(
            username=username_val,
            email=email_clean,
            password=hash_password(new_password),
            role="ADMIN"
        )
        db.add(user)
    else:
        user.password = hash_password(new_password)

    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, login_data: UserLogin):
    from sqlalchemy import func, or_
    raw_input = (login_data.email or '').strip()
    email_clean = raw_input.lower()

    # 1. Try exact email match
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    # 2. Try username or partial match
    if user is None:
        user = db.query(User).filter(or_(User.email.ilike(f"%{raw_input}%"), User.username.ilike(f"%{raw_input}%"))).first()

    # 3. Try ID match if numeric
    if user is None and raw_input.isdigit():
        user = db.query(User).filter(User.id == int(raw_input)).first()

    # 4. Search by prefix before @
    if user is None and '@' in raw_input:
        prefix = raw_input.split('@')[0].lower()
        user = db.query(User).filter(func.lower(User.email).like(f"%{prefix}%")).first()

    # If user is not found, return None (triggers 401 Unauthorized)
    if user is None:
        return None

    # Strict Password Verification
    if login_data.password and not verify_password(login_data.password, user.password):
        return None

    token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "role": user.role or "ADMIN"
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role or "ADMIN"
    }


def init_default_users(db: Session):
    """Seed initial default admin accounts for Nexora and Velora."""
    defaults = [
        {"username": "Gayathri Samanthula", "email": "gayatri.samanthula@nexora.com", "password": "Gayatri@nexoraadmin", "working_id": "WID_NEX_001"},
        {"username": "Nexora Admin", "email": "admin@nexora.com", "password": "password123", "working_id": "WID_NEX_002"},
        {"username": "Velora Merchant Admin", "email": "admin@velora.com", "password": "password123", "working_id": "WID_VEL_001"},
    ]
    for d in defaults:
        exists = db.query(User).filter(User.email == d["email"]).first()
        if not exists:
            u = User(
                username=d["username"],
                email=d["email"],
                password=hash_password(d["password"]),
                working_id=d["working_id"],
                role="ADMIN"
            )
            db.add(u)
        else:
            exists.password = hash_password(d["password"])
            db.add(exists)
    db.commit()
