from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    event = Column(
        String(100),
        nullable=False
    )

    performed_by = Column(
        String(100),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True
    )

    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id"),
        nullable=True
    )

    invoice_id = Column(
        Integer,
        ForeignKey("invoices.id"),
        nullable=True
    )

    payment_id = Column(
        Integer,
        ForeignKey("payments.id"),
        nullable=True
    )

    refund_id = Column(
        Integer,
        ForeignKey("refunds.id"),
        nullable=True
    )

    old_value = Column(
        String(255),
        nullable=True
    )

    new_value = Column(
        String(255),
        nullable=True
    )

    user_role = Column(
        String(50),
        nullable=True,
        default="ADMIN"
    )

    ip_address = Column(
        String(45),
        nullable=True,
        default="127.0.0.1"
    )

    remarks = Column(
        String(255),
        nullable=True
    )

    description = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = relationship("User", back_populates="audit_logs")
    customer = relationship("Customer", back_populates="audit_logs")