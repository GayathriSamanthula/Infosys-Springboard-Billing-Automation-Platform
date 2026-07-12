from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, Boolean
from backend.app.database.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id"),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    payment_method = Column(
        String(50),
        nullable=False
    )

    transaction_id = Column(
        String(100),
        unique=True,
        nullable=False
    )

    payment_date = Column(
        Date,
        nullable=False
    )

    payment_status = Column(
        String(20),
        default="PENDING",
        nullable=False
    )

    gateway_name = Column(
        String(50)
    )

    remarks = Column(
        String(255)
    )

    is_deleted = Column(
        Boolean,
        default=False
    )