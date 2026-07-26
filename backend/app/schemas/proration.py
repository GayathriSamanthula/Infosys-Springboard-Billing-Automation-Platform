from pydantic import BaseModel


class ProrationRequest(BaseModel):
    subscription_id: int
    new_plan_id: int

class ProrationResponse(BaseModel):
    total_cycle_days: int
    used_days: int
    remaining_days: int
    current_plan_credit: float
    new_plan_charge: float
    final_amount: float
    change_type: str
    
class PlanChangeResponse(BaseModel):
    subscription_id: int
    transaction_id: str
    payment_status: str
    invoice_number: str
    message: str
    proration: ProrationResponse

class PlanChangeRequest(BaseModel):
    new_plan_id: int
    payment_method: str