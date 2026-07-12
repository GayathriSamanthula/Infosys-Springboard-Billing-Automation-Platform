from sqlalchemy import Column, Integer, String, Boolean
from backend.app.database.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, nullable=False)

    phone_number = Column(String(20), unique=True)

    country = Column(String(60))

    address = Column(String(255))

    customer_status = Column(
        String(20),
        default="ACTIVE",
        nullable=False
    )

    is_deleted = Column(
        Boolean,
        default=False
    )