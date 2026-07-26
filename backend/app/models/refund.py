from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database.database import Base


class RefundStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Refund(Base):
    """
    Represents a refund transaction for a subscription cancellation or adjustment.
    """
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(SQLEnum(RefundStatus), default=RefundStatus.COMPLETED, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="refunds")
    customer = relationship("Customer", back_populates="refunds")
