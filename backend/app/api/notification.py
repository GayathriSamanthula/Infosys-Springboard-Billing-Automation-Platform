from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)
from app.services.notification_service import (
    create_notification,
    get_notifications,
    get_notification,
    delete_notification,
)

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/", response_model=list[NotificationResponse])
def read_notifications(db: Session = Depends(get_db)):
    return get_notifications(db)


@router.post("/", response_model=NotificationResponse)
def create_new_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    return create_notification(db, notification)


@router.get("/{notification_id}", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = get_notification(db, notification_id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.delete("/{notification_id}")
def remove_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = delete_notification(db, notification_id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification deleted successfully"}