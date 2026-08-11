from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)

    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id"),
        nullable=False
    )

    invoice_number = Column(
        String(50),
        unique=True,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    tax_amount = Column(
        Float,
        default=0.0,
        nullable=False
    )

    issue_date = Column(
        Date,
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=False
    )

    status = Column(
        String(20),
        default="PENDING",
        nullable=False
    )

    payment_date = Column(
        Date
    )

    remarks = Column(
        String(255)
    )

    refund_amount = Column(
        Float,
        default=0.0,
        nullable=False
    )

    billing_direction = Column(
        String(50),
        default="CUSTOMER_PAYS",
        nullable=False
    )

    is_deleted = Column(
        Boolean,
        default=False
    )

    subscription = relationship("Subscription", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")