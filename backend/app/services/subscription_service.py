from fastapi import HTTPException, status
from datetime import timedelta
from sqlalchemy.orm import Session
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.subscription import SubscriptionCreate,SubscriptionUpdate
from app.models.plan import Plan
from app.models.invoice import Invoice
from app.models.billing_cycle import BillingCycle
from app.schemas.audit_log import AuditLogCreate
from app.services.audit_log_service import create_audit_log
from app.services.invoice_service import (
    create_invoice,
    generate_itemized_invoice,
)
from app.services.notification_service import send_subscription_notification
from app.schemas.invoice import InvoiceCreate
from app.models.customer import Customer


def _get_customer_name(db: Session, customer_id: int) -> str:
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    return c.full_name if c else f"Customer #{customer_id}"


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
    now = datetime.utcnow()

    # Module 1 Requirement: Determine Initial Subscription Status based on Plan Trial Period
    if getattr(subscription, 'status', None) is not None:
        initial_status = subscription.status
    elif plan.trial_period_days and plan.trial_period_days > 0:
        initial_status = SubscriptionStatus.TRIAL
    else:
        initial_status = SubscriptionStatus.ACTIVE

    if initial_status == SubscriptionStatus.TRIAL:
        start_date = today
        trial_days = plan.trial_period_days or 14
        next_billing_date = today + timedelta(days=trial_days)
        trial_started_at = now
        activated_at = None
    else:
        start_date = today
        next_billing_date = today
        trial_started_at = now
        activated_at = now

    cycle_lower = (plan.billing_cycle or "monthly").lower()
    if cycle_lower == "monthly":
        end_date = next_billing_date + timedelta(days=30)
    elif cycle_lower == "quarterly":
        end_date = next_billing_date + timedelta(days=90)
    elif cycle_lower in ["semi_annually", "semi_annual", "semi-annually", "semi-annual"]:
        end_date = next_billing_date + timedelta(days=182)
    elif cycle_lower in ["yearly", "annual"]:
        end_date = next_billing_date + timedelta(days=365)
    else:
        end_date = next_billing_date + timedelta(days=30)

    db_subscription = Subscription(
        customer_id=subscription.customer_id,
        plan_id=subscription.plan_id,
        start_date=start_date,
        end_date=end_date,
        next_billing_date=next_billing_date,
        status=initial_status,
        auto_renew=subscription.auto_renew,
        platform_source=getattr(subscription, "platform_source", None) or "NEXORA_DIRECT",
        trial_started_at=trial_started_at,
        activated_at=activated_at
    )

    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Created",
            performed_by="System",
            customer_id=db_subscription.customer_id,
            description=f"Subscription #{db_subscription.id} created with initial status '{initial_status.value if hasattr(initial_status, 'value') else initial_status}' for plan '{plan.name}'." 
        )
    )

    return db_subscription


def _enrich_subscription(db: Session, sub: Subscription):
    if not sub:
        return None
    cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    if cust:
        sub.customer_name = cust.full_name
        sub.customer_email = cust.email
    if plan:
        sub.plan_name = plan.name
    if not getattr(sub, 'platform_source', None):
        setattr(sub, 'platform_source', 'NEXORA_DIRECT')
    if not getattr(sub, 'start_date', None):
        setattr(sub, 'start_date', date.today())
    if not getattr(sub, 'end_date', None):
        setattr(sub, 'end_date', date.today() + timedelta(days=30))
    if not getattr(sub, 'next_billing_date', None):
        setattr(sub, 'next_billing_date', sub.end_date)
    return sub


def get_all_subscriptions(
    db: Session,
    status: str = None
):
    query = db.query(Subscription).filter(Subscription.is_deleted == False)

    if status:
        query = query.filter(Subscription.status == status.upper())

    subs = query.order_by(Subscription.id.desc()).all()
    seen_ids = set()
    unique_subs = []
    for s in subs:
        if s.id not in seen_ids:
            seen_ids.add(s.id)
            unique_subs.append(s)

    return [_enrich_subscription(db, s) for s in unique_subs]


def get_subscription_by_id(db: Session, subscription_id: int):
    sub = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )
    if not sub:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )
    return _enrich_subscription(db, sub)




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
                performed_by="System",
                customer_id=db_subscription.customer_id,
                description=f"Subscription status changed from {old_status.value if hasattr(old_status, 'value') else old_status} to {new_status.value if hasattr(new_status, 'value') else new_status}."
            )
        )

    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Updated",
            performed_by="System",
            customer_id=db_subscription.customer_id,
            description=f"Subscription #{db_subscription.id} updated."
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

    status_str = subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status)
    if status_str.upper() != "ACTIVE":
        return None

    old_status = subscription.status
    subscription.status = SubscriptionStatus.PAUSED
    subscription.pause_date = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Paused",
            performed_by="System",
            customer_id=subscription.customer_id,
            description=f"Subscription #{subscription.id} was paused."
        )
    )

    create_audit_log(
        db,
        AuditLogCreate(
            event="Status Changed",
            performed_by="System",
            customer_id=subscription.customer_id,
            description=f"Subscription #{subscription.id} status changed from {old_status.value if hasattr(old_status, 'value') else old_status} to PAUSED."
        )
    )

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

    status_str = subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status)
    if status_str.upper() != "PAUSED":
        return None

    old_status = subscription.status
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.pause_date = None
    subscription.activated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Resumed",
            performed_by="System",
            customer_id=subscription.customer_id,
            description=f"Subscription #{subscription.id} was resumed."
        )
    )

    create_audit_log(
        db,
        AuditLogCreate(
            event="Status Changed",
            performed_by="System",
            customer_id=subscription.customer_id,
            description=f"Subscription #{subscription.id} status changed from {old_status.value if hasattr(old_status, 'value') else old_status} to ACTIVE."
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

    generated_invoices = []
    for subscription in due_subscriptions:
        plan = (
            db.query(Plan)
            .filter(Plan.id == subscription.plan_id)
            .first()
        )

        if not plan:
            continue

        inv = generate_itemized_invoice(
            db=db,
            subscription_id=subscription.id,
            proration_credit=0.0,
            proration_debit=0.0,
            tax_rate=0.18,
            remarks="Automatically generated by billing engine"
        )
        generated_invoices.append(inv)

        # Update next billing date based on billing cycle
        if plan.billing_cycle.upper() == "MONTHLY":
            subscription.next_billing_date = subscription.next_billing_date + timedelta(days=30)
        elif plan.billing_cycle.upper() == "YEARLY":
            subscription.next_billing_date = subscription.next_billing_date + timedelta(days=365)

        db.commit()

    return generated_invoices
        



from datetime import datetime

def cancel_subscription(db: Session, subscription_id: int, request_refund: bool = True):
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

    old_status = subscription.status
    status_str = old_status.value if hasattr(old_status, 'value') else str(old_status)
    is_trial = (status_str.upper() == "TRIAL")

    subscription.status = SubscriptionStatus.CANCELLED
    subscription.cancelled_at = datetime.utcnow()
    subscription.auto_renew = False

    db.commit()
    db.refresh(subscription)

    # Process Prorated Refund if requested and subscription is not trial
    if request_refund and not is_trial:
        try:
            from app.services.refund_service import process_subscription_refund
            from app.schemas.refund import RefundRequest
            target_invoice = (
                db.query(Invoice)
                .filter(Invoice.subscription_id == subscription.id)
                .order_by(Invoice.id.desc())
                .first()
            )
            if target_invoice and target_invoice.status in ["PAID", "UNPAID"]:
                process_subscription_refund(
                    db,
                    RefundRequest(
                        invoice_id=target_invoice.id,
                        reason="Customer requested cancellation and prorated refund"
                    )
                )
        except Exception as refund_err:
            print("Cancellation prorated refund notice:", refund_err)

    audit_desc = (
        f"Trial Subscription #{subscription.id} was cancelled during trial period. No charges or refunds incurred."
        if is_trial else
        f"Subscription #{subscription.id} was cancelled and prorated refund was processed."
    )

    create_audit_log(
        db,
        AuditLogCreate(
            event="Subscription Cancelled",
            performed_by="System",
            customer_id=subscription.customer_id,
            description=audit_desc
        )
    )

    create_audit_log(
        db,
        AuditLogCreate(
            event="Status Changed",
            performed_by="System",
            customer_id=subscription.customer_id,
            description=f"Subscription #{subscription.id} status changed from {old_status.value if hasattr(old_status, 'value') else old_status} to CANCELLED."
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

    return [_enrich_subscription(db, s) for s in subscriptions]


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
    print("Today's date:", date.today())

    all_subscriptions = db.query(Subscription).all()
    
    print("ALL SUBSCRIPTIONS")
    for s in all_subscriptions:
        print(
            "ID:", s.id,
            "Status:", s.status,
            "Deleted:", s.is_deleted,
            "Next Billing:", s.next_billing_date
        )
    
    due_subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.is_deleted == False,
            Subscription.next_billing_date <= date.today()
        )
        .all()
    )
    
    print("Due subscriptions:", len(due_subscriptions))

    processed_subscriptions = []
    
    if not due_subscriptions:
        print("No subscriptions due.")
        return []

    for subscription in due_subscriptions:
        print("Function:", process_subscription_renewal)
        print("Module:", process_subscription_renewal.__module__)
        print("Defaults:", process_subscription_renewal.__defaults__)
        print("Var names:", process_subscription_renewal.__code__.co_varnames)
        renewed_subscription = process_subscription_renewal(
            db=db,                                                      
            subscription_id=subscription.id
        )
        
        print("renewed_subscription =", renewed_subscription)
        print("type =", type(renewed_subscription))
        

        if renewed_subscription is None:
            continue

        if isinstance(renewed_subscription, str):
            continue

        try:
            # Generate invoice after successful renewal
            plan = (
                db.query(Plan)
                .filter(Plan.id == subscription.plan_id)
                .first()
            )

            if not plan:
                continue
            
            
            generate_itemized_invoice(
                db=db,
                subscription_id=subscription.id,
                proration_credit=0.0,
                proration_debit=0.0,
                tax_rate=0.0,
                remarks="Automatically generated by Celery renewal"
            )

            # Record Billing Cycle entry
            db_cycle = BillingCycle(
                subscription_id=subscription.id,
                billing_start_date=date.today(),
                billing_end_date=subscription.next_billing_date,
                renewal_date=subscription.next_billing_date,
                next_billing_date=subscription.next_billing_date,
                cycle_status="PROCESSED",
                is_processed=True
            )
            db.add(db_cycle)
            db.commit()

            # Record audit log
            create_audit_log(
                db,
                AuditLogCreate(
                    event="Subscription Renewed",
                    performed_by=_get_customer_name(db, subscription.customer_id),
                    customer_id=subscription.customer_id,
                    description=f"Subscription #{subscription.id} renewed automatically by Celery Beat."
                )
            )

            # Send notification
            send_subscription_notification(
                db=db,
                subscription_id=subscription.id
            )

        except Exception as e:
            import traceback

            print("========== ERROR ==========")
            traceback.print_exc()
            print("===========================")

        processed_subscriptions.append(subscription.id)
        
    print("Returning:", processed_subscriptions)
    return processed_subscriptions
        