from sqlalchemy.orm import Session

from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserLogin

from backend.app.core.security import hash_password, verify_password
from backend.app.core.jwt_handler import create_access_token


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
        password=hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def get_user_by_id(db: Session, user_id: int):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    return user

def get_all_users(db: Session):

    users = (
        db.query(User)
        .order_by(User.id)
        .all()
    )

    return users

def update_user(db: Session, user_id: int, user_data: UserCreate):

    existing_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if existing_user is None:
        return None

    existing_user.username = user_data.username
    existing_user.email = user_data.email
    existing_user.password = user_data.password

    db.commit()
    db.refresh(existing_user)

    return existing_user

def delete_user(db: Session, user_id: int):

    existing_user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if existing_user is None:
        return None

    db.delete(existing_user)
    db.commit()

    return existing_user

def login_user(db: Session, login_data: UserLogin):

    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    if user is None:
        return None

    if not verify_password(
        login_data.password,
        user.password
    ):
        return None

    token = create_access_token(
        {
            "sub": user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }



    
