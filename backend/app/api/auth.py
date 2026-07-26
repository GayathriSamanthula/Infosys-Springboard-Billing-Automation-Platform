from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.services.user_service import create_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        return create_user(db, user)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.post(
    "/login",
    response_model=Token
)
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    token = login_user(db, user)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    return token