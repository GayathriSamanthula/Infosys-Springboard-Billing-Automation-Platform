from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id"),
        nullable=False
    )

    invoice_id = Column(
        Integer,
        ForeignKey("invoices.id"),
        nullable=True
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
        DateTime,
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

    subscription = relationship("Subscription", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")