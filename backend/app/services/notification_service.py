from sqlalchemy.orm import Session
from backend.app.models.notification import Notification
from backend.app.schemas.notification import NotificationCreate


def create_notification(db: Session, notification: NotificationCreate):
    db_notification = Notification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


def get_notifications(db: Session):
    return db.query(Notification).filter(
        Notification.is_deleted == False
    ).all()


def get_notification(db: Session, notification_id: int):
    return db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.is_deleted == False
    ).first()


def delete_notification(db: Session, notification_id: int):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.is_deleted == False
    ).first()

    if notification:
        notification.is_deleted = True
        db.commit()

    return notification