from dataclasses import dataclass
from datetime import date


@dataclass
class ProrationResult:
    total_cycle_days: int
    used_days: int
    remaining_days: int
    current_plan_credit: float
    new_plan_charge: float
    final_amount: float
    change_type: str


class ProrationService:
    """
    Handles subscription plan proration calculations.

    This service performs only calculations.
    It does not modify the database or create invoices.
    """

    @staticmethod
    def calculate_proration(
        current_plan_price: float,
        new_plan_price: float,
        billing_start_date: date,
        billing_end_date: date,
        plan_change_date: date,
    ) -> ProrationResult:

        if plan_change_date >= billing_end_date:
            raise ValueError(
                "Proration is only applicable for mid-cycle plan changes."
            )

        total_cycle_days = (billing_end_date - billing_start_date).days

        if total_cycle_days <= 0:
            raise ValueError("Invalid billing cycle.")

        used_days = (plan_change_date - billing_start_date).days

        if used_days < 0:
            raise ValueError(
                "Plan change date cannot be before billing start date."
            )

        remaining_days = total_cycle_days - used_days

        current_plan_credit = (
            current_plan_price * remaining_days
        ) / total_cycle_days

        new_plan_charge = (
            new_plan_price * remaining_days
        ) / total_cycle_days

        final_amount = round(
            new_plan_charge - current_plan_credit,
            2
        )

        if new_plan_price > current_plan_price:
            change_type = "UPGRADE"
        elif new_plan_price < current_plan_price:
            change_type = "DOWNGRADE"
        else:
            change_type = "NO_CHANGE"

        return ProrationResult(
            total_cycle_days=total_cycle_days,
            used_days=used_days,
            remaining_days=remaining_days,
            current_plan_credit=round(current_plan_credit, 2),
            new_plan_charge=round(new_plan_charge, 2),
            final_amount=final_amount,
            change_type=change_type,
        )