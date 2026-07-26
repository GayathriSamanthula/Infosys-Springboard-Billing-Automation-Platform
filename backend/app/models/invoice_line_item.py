from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database.database import Base


class LineItemType(str, enum.Enum):
    PLAN_FEE = "PLAN_FEE"
    PRORATION_CREDIT = "PRORATION_CREDIT"
    PRORATION_DEBIT = "PRORATION_DEBIT"
    TAX = "TAX"
    DISCOUNT = "DISCOUNT"
    USAGE_CHARGE = "USAGE_CHARGE"
    REFUND = "REFUND"


class InvoiceLineItem(Base):
    """
    Represents an itemized line item inside an invoice.
    Tracks individual components like plan fee, proration credits/debits, and tax.
    """
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    description = Column(String(255), nullable=False)
    item_type = Column(SQLEnum(LineItemType), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="line_items")
