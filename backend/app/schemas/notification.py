from datetime import date

from pydantic import BaseModel


class NotificationBase(BaseModel):
    customer_id: int
    notification_type: str
    message: str
    sent_date: date
    status: str
    delivery_channel: str


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    is_deleted: bool

    class Config:
        from_attributes = True