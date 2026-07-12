from sqlalchemy import Column, Integer, Date, ForeignKey, String, Boolean
from backend.app.database.database import Base


class BillingCycle(Base):
    __tablename__ = "billing_cycles"

    id = Column(Integer, primary_key=True, index=True)

    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id"),
        nullable=False
    )

    billing_start_date = Column(
        Date,
        nullable=False
    )

    billing_end_date = Column(
        Date,
        nullable=False
    )

    renewal_date = Column(
        Date,
        nullable=False
    )

    next_billing_date = Column(
        Date,
        nullable=False
    )

    cycle_status = Column(
        String(20),
        default="PENDING",
        nullable=False
    )

    is_processed = Column(
        Boolean,
        default=False
    )