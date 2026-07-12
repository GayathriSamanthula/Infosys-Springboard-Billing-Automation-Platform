from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from backend.app.database.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    description = Column(Text)

    price = Column(Float, nullable=False)

    billing_cycle = Column(String(30), nullable=False)

    trial_period_days = Column(Integer, default=0)

    features = Column(Text)

    status = Column(String(20), default="ACTIVE", nullable=False)

    is_deleted = Column(Boolean, default=False)
    
    is_archived = Column(Boolean, default=False)