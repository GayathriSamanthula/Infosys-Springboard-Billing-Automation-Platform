from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4

from app.database.database import get_db
from app.models.subscription import SubscriptionStatus
from app.schemas.subscription import (
    SubscriptionCreate, 
    SubscriptionUpdate,
    SubscriptionResponse,
)

from app.models.plan import Plan
from app.services.proration_service import ProrationService
from app.services.payment_service import process_payment
from app.schemas.payment import PaymentProcessRequest
from app.schemas.proration import PlanChangeRequest
from app.services.payment_gateway_service import PaymentGatewayService
from app.services.invoice_service import (
    create_invoice,
    generate_itemized_invoice,
)
from app.schemas.invoice import InvoiceCreate
from app.services.subscription_service import (
    create_subscription,
    get_all_subscriptions,
    get_subscription_by_id,
    update_subscription,
    delete_subscription,
    pause_subscription,
    resume_subscription,
    cancel_subscription,
    past_due_subscription,
    change_subscription_plan,
    get_subscriptions_by_customer,
    get_subscriptions_by_status,
    schedule_subscription_cancellation,
    mark_subscription_past_due,
    cancel_subscription_at_period_end,
    process_subscription_renewal,
)
    
    
router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscriptions"]
)


@router.post(
    "/",
    response_model=SubscriptionResponse,
    status_code=201
)
def create_new_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    return create_subscription(db, subscription)


@router.get(
    "/",
    response_model=list[SubscriptionResponse]
)
def get_subscriptions(
    status: str = None,
    db: Session = Depends(get_db)
):
    return get_all_subscriptions(db, status=status)




@router.get("/status/{status}", response_model=list[SubscriptionResponse])
def get_subscriptions_status(
    status: SubscriptionStatus,
    db: Session = Depends(get_db)
):
    return get_subscriptions_by_status(
        db,
        status
    )


@router.get(
    "/{subscription_id}",
    response_model=SubscriptionResponse
)
def read_subscription(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    subscription = get_subscription_by_id(db, subscription_id)

    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return subscription


@router.put(
    "/{subscription_id}",
    response_model=SubscriptionResponse
)
def update_existing_subscription(
    subscription_id: int,
    subscription: SubscriptionUpdate,
    db: Session = Depends(get_db)
):
    updated_subscription = update_subscription(
        db,
        subscription_id,
        subscription
    )

    if updated_subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return updated_subscription


@router.delete("/{subscription_id}")
def remove_subscription(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    deleted_subscription = delete_subscription(db, subscription_id)

    if deleted_subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return {
        "success": True,
        "message": "Subscription deleted successfully"
    }



@router.put("/{subscription_id}/cancel")
def cancel_subscription_api(
    subscription_id: int,
    request_refund: bool = True,
    db: Session = Depends(get_db)
):
    cancelled_subscription = cancel_subscription(db, subscription_id, request_refund=request_refund)

    if cancelled_subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    if cancelled_subscription == "ALREADY_CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Subscription is already cancelled"
        )

    return {
        "message": "Subscription cancelled successfully and prorated refund processed.",
        "subscription": cancelled_subscription
    }
    
    @router.put("/{subscription_id}/past-due")
    def mark_subscription_past_due_api(
        subscription_id: int,
        db: Session = Depends(get_db)
    ):
        updated_subscription = mark_subscription_past_due(
            db,
            subscription_id
        )

        if updated_subscription is None:
            raise HTTPException(
                status_code=404,
                detail="Subscription not found"
            )

        if updated_subscription == "CANCELLED_SUBSCRIPTION":
            raise HTTPException(
                status_code=400,
                detail="Cancelled subscription cannot be marked as past due"
        )

        return {
            "message": "Subscription marked as past due successfully",
            "subscription": updated_subscription
        }

@router.put("/{subscription_id}/pause", response_model=SubscriptionResponse)
def pause_existing_subscription(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    subscription = pause_subscription(db, subscription_id)

    if subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
    )

    return subscription


@router.put(
    "/{subscription_id}/resume",
    response_model=SubscriptionResponse
)
def resume_existing_subscription(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    subscription = resume_subscription(db, subscription_id)

    if subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
    )

    return subscription


@router.put("/{subscription_id}/past-due", response_model=SubscriptionResponse)
def mark_subscription_past_due(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    updated_subscription = past_due_subscription(db, subscription_id)

    if updated_subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    return updated_subscription


@router.put("/{subscription_id}/cancel-at-period-end")
def cancel_subscription_at_period_end_api(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    subscription = cancel_subscription_at_period_end(
        db,
        subscription_id
    )

    if subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    if subscription == "ALREADY_CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Subscription is already cancelled"
        )

    return {
        "message": "Subscription will be cancelled at the end of the current billing period",
        "subscription": subscription
    }


@router.put("/{subscription_id}/change-plan/{plan_id}",
            response_model=SubscriptionResponse)
def change_plan(
    subscription_id: int,
    plan_id: int,
    db: Session = Depends(get_db)
):
    subscription = change_subscription_plan(
        db,
        subscription_id,
        plan_id
    )

    if subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    if subscription == "PLAN_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    return subscription


@router.get(
    "/customer/{customer_id}",
    response_model=list[SubscriptionResponse]
)
def get_customer_subscriptions(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return get_subscriptions_by_customer(db, customer_id)


@router.post("/{subscription_id}/change-plan")
def change_plan_with_proration(
    subscription_id: int,
    request: PlanChangeRequest,
    db: Session = Depends(get_db)
):
    subscription = get_subscription_by_id(
        db,
        subscription_id
    )

    if subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    current_plan = (
        db.query(Plan)
        .filter(Plan.id == subscription.plan_id)
        .first()
    )

    new_plan = (
        db.query(Plan)
        .filter(Plan.id == request.new_plan_id)
        .first()
    )

    if new_plan is None:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )
   
    if date.today() > subscription.end_date:
        raise HTTPException(
            
            
            status_code=400,
            detail="Billing cycle has already ended. Proration cannot be applied."
        )
    
    proration = ProrationService.calculate_proration(
            current_plan_price=current_plan.price,
            new_plan_price=new_plan.price,
            billing_start_date=subscription.start_date,
            billing_end_date=subscription.end_date,
            plan_change_date=date.today()
    )
    
    if proration.change_type == "NO_CHANGE":
        raise HTTPException(
            status_code=400,
            detail="Selected plan has the same billing amount. No proration is required."
        )
    payment_result = None

    if proration.change_type == "UPGRADE":
            
        payment_result = PaymentGatewayService.process_payment(
            abs(proration.final_amount)
        )                                                                            
    
    if payment_result is not None and payment_result["payment_status"] == "FAILED":
        raise HTTPException(
            status_code=400,
            detail="Payment failed. Plan change aborted."
        )
    subscription.plan_id = new_plan.id
    subscription.start_date = date.today()

    if new_plan.billing_cycle == "MONTHLY":
        subscription.end_date = subscription.start_date + timedelta(days=30)

    elif new_plan.billing_cycle == "YEARLY":
        subscription.end_date = subscription.start_date + timedelta(days=365)

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported billing cycle."
        )

    subscription.next_billing_date = subscription.end_date

    db.commit()
    db.refresh(subscription)
        
    invoice = generate_itemized_invoice(
        db=db,
        subscription_id=subscription.id,
        proration_credit=proration.current_plan_credit,
        proration_debit=proration.new_plan_charge,
        tax_rate=0.18,
        remarks=f"Plan {proration.change_type}: {current_plan.name} -> {new_plan.name}",
        previous_plan_name=current_plan.name,
        previous_plan_price=current_plan.price,
        remaining_days=proration.remaining_days,
        total_cycle_days=proration.total_cycle_days,
    )

    return {
            "message": "Proration calculated successfully",
            "proration": {
                "total_cycle_days": proration.total_cycle_days,
                "used_days": proration.used_days,
                "remaining_days": proration.remaining_days,
                "current_plan_credit": proration.current_plan_credit,
                "new_plan_charge": proration.new_plan_charge,
                "final_amount": proration.final_amount,
                "change_type": proration.change_type
            },
            "invoice": {
                "invoice_id": invoice.id,
                "subscription_id": invoice.subscription_id,
                "amount": invoice.amount,
                "status": invoice.status
            }
    }


@router.put(
    "/{subscription_id}/renew",
    response_model=SubscriptionResponse
)
def renew_subscription(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    renewed_subscription = process_subscription_renewal(
        db,
        subscription_id
    )

    if renewed_subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found"
        )

    if renewed_subscription == "SUBSCRIPTION_NOT_ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Only active subscriptions can be renewed"
        )

    if renewed_subscription == "PLAN_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Associated plan not found"
        )

    return renewed_subscription