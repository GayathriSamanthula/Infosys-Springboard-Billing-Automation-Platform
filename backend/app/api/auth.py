from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token, PasswordReset
from app.schemas.customer import CustomerLogin, CustomerTokenResponse, CustomerRegister, CustomerVerifyOTP
from app.services.user_service import create_user, login_user, reset_user_password
from app.services.customer_service import login_customer, register_customer, verify_customer_otp

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/admin/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin & Staff User Registration"
)
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin User Registration (Alias)",
    include_in_schema=False
)
def register_admin(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """
    BELONGS TO: Platform Administrators, Finance Staff & System Operators (users table, role: ADMIN).
    Registers administrative staff who manage platform billing, customers, pricing plans, and system configurations.
    Customers/Subscribers cannot be registered via this endpoint.
    """
    try:
        return create_user(db, user)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.post(
    "/admin/login",
    response_model=Token,
    summary="Admin Platform Login"
)
@router.post(
    "/login",
    response_model=Token,
    summary="Admin Platform Login (Alias)",
    include_in_schema=False
)
def admin_login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticates a platform administrator (role: ADMIN).
    Customers are strictly prohibited from logging in through this endpoint.
    """
    try:
        token = login_user(db, user)

        if token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin email or password."
            )

        return token
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(exc)}"
        )


@router.post(
    "/customer/register",
    status_code=status.HTTP_201_CREATED,
    summary="Customer Registration"
)
def customer_register(
    customer_data: CustomerRegister,
    db: Session = Depends(get_db)
):
    """
    Registers a new customer (role: CUSTOMER) with username, password, email, and phone number.
    Triggers a 10-minute OTP verification email dispatch.
    """
    try:
        return register_customer(db, customer_data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.post(
    "/customer/verify-otp",
    response_model=CustomerTokenResponse,
    summary="Verify Customer 10-Minute Security OTP"
)
def customer_verify_otp(
    data: CustomerVerifyOTP,
    db: Session = Depends(get_db)
):
    """
    Verifies the 6-digit OTP code sent to the customer's email (10-minute expiration).
    On successful verification, activates the account and returns access token.
    """
    try:
        return verify_customer_otp(db, data.email, data.otp_code)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.post(
    "/customer/login",
    response_model=CustomerTokenResponse,
    summary="Customer Login"
)
def customer_login(
    credentials: CustomerLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticates a customer (role: CUSTOMER) and returns access token + customer profile.
    """
    try:
        auth_result = login_customer(db, credentials)
        return CustomerTokenResponse(
            access_token=auth_result["access_token"],
            token_type=auth_result.get("token_type", "bearer"),
            customer_id=int(auth_result["customer_id"]),
            full_name=str(auth_result["full_name"]),
            email=str(auth_result["email"]),
            role=str(auth_result.get("role", "CUSTOMER")),
            platform_source=str(auth_result.get("platform_source", "NEXORA_DIRECT"))
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Customer authentication notice: {str(exc)}"
        )


@router.post(
    "/reset-password",
    summary="Admin Password Reset"
)
def admin_reset_password(
    data: PasswordReset,
    db: Session = Depends(get_db)
):
    """
    Resets an administrative user's password given their email address.
    """
    try:
        updated_user = reset_user_password(db, data.email, data.new_password)
        return {"message": f"Password reset successfully for {updated_user.email}. You can now sign in."}
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password reset notice: {str(exc)}"
        )