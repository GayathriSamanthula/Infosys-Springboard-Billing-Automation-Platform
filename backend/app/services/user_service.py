from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password
from app.core.jwt_handler import create_access_token


def create_user(db: Session, user_data: UserCreate):
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


def login_user(db: Session, login_data: UserLogin):
    user = db.query(User).filter(User.email == login_data.email).first()

    if user is None:
        return None

    if not verify_password(login_data.password, user.password):
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
