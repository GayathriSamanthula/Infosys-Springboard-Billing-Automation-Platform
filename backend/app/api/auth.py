from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from backend.app.services.user_service import create_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        return create_user(db, user)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
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
            status_code=401,
            detail="Invalid email or password."
        )

    return token  