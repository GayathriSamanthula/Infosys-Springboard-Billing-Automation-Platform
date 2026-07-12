from fastapi import HTTPException, status
from datetime import timedelta
from sqlalchemy.orm import Session
from datetime import date, datetime
from dateutil.relativedelta import relativedelta

from backend.app.models.subscription import Subscription, SubscriptionStatus
from backend.app.schemas.subscription import SubscriptionCreate,SubscriptionUpdate
from backend.app.models.plan import Plan
from backend.app.models.invoice import Invoice
from backend.app.schemas.audit_log import AuditLogCreate
from backend.app.services.audit_log_service import create_audit_log
from backend.app.services.invoice_service import create_invoice


def create_subscription(db: Session, subscription: SubscriptionCreate):
    customer = db.query(Customer).filter(
        Customer.id == subscription.customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
    )

    if plan.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Cannot create subscription for an archived plan"
    )
        
    today = date.today()

    if plan.trial_period_days > 0:
        start_date = today
        next_billing_date = today + timedelta(days=plan.trial_period_days)
        status = SubscriptionStatus.TRIAL
    else:
        start_date = today
        next_billing_date = today
        status = SubscriptionStatus.ACTIVE

    if plan.billing_cycle.lower() == "monthly":
        end_date = next_billing_date + timedelta(days=30)
    elif plan.billing_cycle.lower() == "yearly":
        end_date = next_billing_date + timedelta(days=365)
    else:
        end_date = next_billing_date

    db_subscription = Subscription(
        customer_id=subscription.customer_id,
        plan_id=subscription.plan_id,
        start_date=start_date,
        end_date=end_date,
        next_billing_date=next_billing_date,
        status=status,
        auto_renew=subscription.auto_renew
    )

    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Created",
            performed_by=str(db_subscription.customer_id),
            description=f"Subscription {db_subscription.id} created." 
        )
    )

    return db_subscription


def get_all_subscriptions(db: Session):
    return (
        db.query(Subscription)
        .filter(Subscription.is_deleted == False)
        .all()
    )
    
    
def get_subscription_by_id(db: Session, subscription_id: int):
    return (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )


def update_subscription(
    db: Session,
    subscription_id: int,
    subscription: SubscriptionUpdate
):
    db_subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if not db_subscription:
        return None

    old_status = db_subscription.status
    new_status = subscription.status if subscription.status else old_status

    valid_transitions = {
        SubscriptionStatus.TRIAL: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.CANCELLED,
        ],
        SubscriptionStatus.ACTIVE: [
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.CANCELLED,
        ],
        SubscriptionStatus.PAST_DUE: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.CANCELLED,
        ],
        SubscriptionStatus.CANCELLED: [],
    }

    if new_status != old_status:
        if new_status not in valid_transitions.get(old_status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from {old_status} to {new_status}"
            )

    update_data = subscription.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_subscription, key, value)

    if new_status == SubscriptionStatus.ACTIVE and db_subscription.activated_at is None:
        db_subscription.activated_at = datetime.utcnow()

    elif new_status == SubscriptionStatus.PAST_DUE and db_subscription.past_due_at is None:
        db_subscription.past_due_at = datetime.utcnow()

    elif new_status == SubscriptionStatus.CANCELLED and db_subscription.cancelled_at is None:
        db_subscription.cancelled_at = datetime.utcnow()

    db.commit()
    db.refresh(db_subscription)
    if old_status != new_status:
      create_audit_log(
        db,
        AuditLogCreate(
            event="Status Changed",
            performed_by=str(db_subscription.customer_id),
            description=f"Subscription status changed from {old_status.value} to {new_status.value}."
        )
    )
      
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Updated",
            performed_by=str(db_subscription.customer_id),
            description=f"Subscription {db_subscription.id} updated."
        )
    )

    return db_subscription


def delete_subscription(db: Session, subscription_id: int):
    db_subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if not db_subscription:
        return None

    db_subscription.is_deleted = True

    db.commit()

    return db_subscription   


def pause_subscription(db: Session, subscription_id: int):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if not subscription:
        return None

    if subscription.status != SubscriptionStatus.ACTIVE:
        return None

    subscription.status = SubscriptionStatus.PAUSED
    subscription.pause_date = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription


def resume_subscription(db: Session, subscription_id: int):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if not subscription:
        return None

    if subscription.status != SubscriptionStatus.PAUSED:
        return None

    subscription.status = SubscriptionStatus.ACTIVE
    subscription.pause_date = None
    subscription.activated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Resumed",
            performed_by=str(subscription.customer_id),
            description=f"Subscription {subscription.id} was resumed."
        )
    )

    return subscription
    
    
from datetime import date

def get_subscriptions_ready_for_billing(db: Session):
    today = date.today()

    subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.status == "ACTIVE",
            Subscription.auto_renew == True,
            Subscription.next_billing_date <= today,
            Subscription.is_deleted == False
        )
        .all()
    )

    return subscriptions


from datetime import date

def generate_due_invoices(db: Session):
    today = date.today()

    due_subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.status == "ACTIVE",
            Subscription.auto_renew == True,
            Subscription.next_billing_date <= today,
            Subscription.is_deleted == False
        )
        .all()
    )

    for subscription in due_subscriptions:

        plan = (
            db.query(Plan)
            .filter(Plan.id == subscription.plan_id)
            .first()
        )

        if not plan:
            continue

        invoice = Invoice(
            subscription_id=subscription.id,
            invoice_number=f"INV-{subscription.id}-{today.strftime('%Y%m%d')}",
            amount=plan.price,
            issue_date=today,
            due_date=today,
            status="PENDING",
            remarks="Automatically generated by billing engine"
        )

        db.add(invoice)
        # Update next billing date based on billing cycle
        if plan.billing_cycle.upper() == "MONTHLY":
            subscription.next_billing_date = subscription.next_billing_date + timedelta(days=30)

        elif plan.billing_cycle.upper() == "YEARLY":
            subscription.next_billing_date = subscription.next_billing_date + timedelta(days=365)

        db.commit()
        db.refresh(invoice)
        
def pause_subscription(db: Session, subscription_id: int):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    if subscription.status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="Only ACTIVE subscriptions can be paused"
        )

    subscription.status = SubscriptionStatus.PAUSED
    subscription.pause_date = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Paused",
            performed_by=str(subscription.customer_id),
            description=f"Subscription {subscription.id} was paused."
        )
    )

    return subscription  


from datetime import datetime

def cancel_subscription(db: Session, subscription_id: int):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        return None

    if subscription.status == SubscriptionStatus.CANCELLED:
        return subscription

    subscription.status = SubscriptionStatus.CANCELLED
    subscription.cancelled_at = datetime.utcnow()
    subscription.auto_renew = False

    db.commit()
    db.refresh(subscription)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Cancelled",
            performed_by=str(subscription.customer_id),
            description=f"Subscription {subscription.id} was cancelled."
        )
    )

    return subscription


def past_due_subscription(db: Session, subscription_id: int):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        return None

    if subscription.status == SubscriptionStatus.PAST_DUE:
        return subscription

    subscription.status = SubscriptionStatus.PAST_DUE
    subscription.past_due_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription


def change_subscription_plan(
    db: Session,
    subscription_id: int,
    new_plan_id: int
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        return None

    plan = (
        db.query(Plan)
        .filter(Plan.id == new_plan_id)
        .first()
    )

    if plan is None:
        return "PLAN_NOT_FOUND"
    if plan.is_archived:
        return "PLAN_NOT_FOUND"

    subscription.plan_id = new_plan_id

    today = date.today()

    if plan.billing_cycle.lower() == "monthly":
        subscription.next_billing_date = today + timedelta(days=30)
        subscription.end_date = today + timedelta(days=30)

    elif plan.billing_cycle.lower() == "yearly":
        subscription.next_billing_date = today + timedelta(days=365)
        subscription.end_date = today + timedelta(days=365)

    if plan.trial_period_days > 0:
        subscription.status = SubscriptionStatus.TRIAL
    else:
        subscription.status = SubscriptionStatus.ACTIVE

    db.commit()
    db.refresh(subscription)

    return subscription


def mark_subscription_past_due(
    db: Session,
    subscription_id: int
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        return None

    if subscription.status == SubscriptionStatus.CANCELLED:
        return "CANCELLED_SUBSCRIPTION"

    subscription.status = SubscriptionStatus.PAST_DUE
    subscription.past_due_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription


def get_subscriptions_by_customer(db: Session, customer_id: int):
    subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.customer_id == customer_id,
            Subscription.is_deleted == False
        )
        .all()
    )

    return subscriptions


def schedule_subscription_cancellation(db: Session, subscription_id: int):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        return None

    subscription.cancel_at_period_end = True

    db.commit()
    db.refresh(subscription)

    return subscription


def cancel_subscription_at_period_end(
    db: Session,
    subscription_id: int
):
        subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

        if subscription is None:
            return None

        if subscription.status == SubscriptionStatus.CANCELLED:
            return "ALREADY_CANCELLED"

        subscription.cancel_at_period_end = True

        db.commit()
        db.refresh(subscription)

        return subscription
    
    
    
def get_subscriptions_by_status(
    db: Session,
    status: SubscriptionStatus
):
    subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.status == status,
            Subscription.is_deleted == False
        )
        .all()
    )

    return subscriptions


def process_subscription_renewal(
    db: Session,
    subscription_id: int
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        return None

    if subscription.status != SubscriptionStatus.ACTIVE:
        return "SUBSCRIPTION_NOT_ACTIVE"

    if subscription.cancel_at_period_end:
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancelled_at = datetime.utcnow()
        db.commit()
        db.refresh(subscription)
        return subscription

    plan = (
        db.query(Plan)
        .filter(Plan.id == subscription.plan_id)
        .first()
    )

    if plan is None:
        return "PLAN_NOT_FOUND"

    current_date = subscription.next_billing_date

    if plan.billing_cycle.upper() == "MONTHLY":
        next_date = current_date + relativedelta(months=1)

    elif plan.billing_cycle.upper() == "YEARLY":
        next_date = current_date + relativedelta(years=1)

    elif plan.billing_cycle.upper() == "WEEKLY":
        next_date = current_date + timedelta(days=7)

    else:
        next_date = current_date + timedelta(days=30)
    
    subscription.start_date = current_date
    subscription.next_billing_date = next_date
    subscription.end_date = next_date

    db.commit()
    db.refresh(subscription)

    return subscription


def process_due_subscription_renewals(db: Session):
    """
    Process all active subscriptions that are due for renewal.
    Used by the Celery scheduler.
    """

    due_subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.is_deleted == False,
            Subscription.next_billing_date <= datetime.utcnow()
        )
        .all()
    )

    processed_subscriptions = []

    for subscription in due_subscriptions:
        print("Function:", process_subscription_renewal)
        print("Module:", process_subscription_renewal.__module__)
        print("Defaults:", process_subscription_renewal.__defaults__)
        print("Var names:", process_subscription_renewal.__code__.co_varnames)
        renewed_subscription = process_subscription_renewal(
            db=db,                                                      
            subscription_id=subscription.id
        )
        

        if renewed_subscription is None:
            continue

        if isinstance(renewed_subscription, str):
            continue

        try:
            # Generate invoice after successful renewal
            create_invoice(
                db=db,
                subscription_id=subscription.id
            )

            # Record audit log
            create_audit_log(
                db=db,
                action="SUBSCRIPTION_RENEWED",
                entity_type="Subscription",
                entity_id=subscription.id,
                description="Subscription renewed automatically by Celery Beat."
            )

            # Send notification
            send_subscription_notification(
                db=db,
                subscription_id=subscription.id
            )

        except Exception as e:
            print(f"Background task error for subscription {subscription.id}: {e}")

        processed_subscriptions.append(subscription.id)
        
        print("Returning:", processed_subscriptions)
        return processed_subscriptions
        