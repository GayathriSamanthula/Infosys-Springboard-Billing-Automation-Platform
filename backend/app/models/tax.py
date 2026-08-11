from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime
from datetime import datetime

from app.database.database import Base


class TaxMaster(Base):
    """
    Stores country and region-based tax rate rules.
    Default Rules:
    - India: GST (18.0%)
    - UAE: VAT (5.0%)
    - USA (California): Sales Tax (8.25%)
    - International / Default: Standard Tax (0.0%)
    """
    __tablename__ = "tax_master"

    id = Column(Integer, primary_key=True, index=True)
    country = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True, default="ALL", index=True)
    tax_name = Column(String(50), nullable=False)
    tax_percentage = Column(Float, nullable=False)
    effective_from = Column(Date, nullable=False, default=datetime.utcnow().date())
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
