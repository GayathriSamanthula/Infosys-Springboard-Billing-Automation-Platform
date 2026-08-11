from datetime import datetime
from uuid import uuid4
import random


class PaymentGatewayService:
    """
    Simulates a payment gateway.

    This service only simulates gateway behaviour.
    It does not interact with the database.
    """

    SUCCESS_RATE = 100

    @classmethod
    def process_payment(cls, amount: float) -> dict:
        """
        Simulate processing a payment request.

        Returns:
            Dictionary containing payment result.
        """

        if amount <= 0:
            raise ValueError(
                "Payment amount must be greater than zero."
            )

        transaction_id = (
            f"TXN-{uuid4().hex[:12].upper()}"
        )

        payment_time = datetime.utcnow()

        is_success = (
            random.randint(1, 100)
            <= cls.SUCCESS_RATE
        )

        if is_success:
            return {
                "transaction_id": transaction_id,
                "payment_status": "SUCCESS",
                "response_code": "200",
                "payment_timestamp": payment_time,
                "response_message": (
                    "Payment processed successfully."
                ),
            }

        return {
            "transaction_id": transaction_id,
            "payment_status": "FAILED",
            "response_code": "400",
            "payment_timestamp": payment_time,
            "response_message": (
                "Payment processing failed."
            ),
        }

    @classmethod
    def simulate_payment(
        cls,
        subscription_id: int,
        amount: float,
        payment_method: str = "Credit Card",
        force_status: str = None
    ):
        txn_id = f"TXN-{uuid4().hex[:12].upper()}"
        ts = datetime.utcnow()
        status = (force_status or "SUCCESS").upper()

        class GatewayResult:
            def __init__(self, transaction_id, status, payment_method, timestamp, amount, response_message):
                self.transaction_id = transaction_id
                self.status = status
                self.payment_status = status
                self.payment_method = payment_method
                self.timestamp = timestamp
                self.amount = amount
                self.response_message = response_message
                self.response_code = "200" if status == "SUCCESS" else "400"

        return GatewayResult(
            transaction_id=txn_id,
            status=status,
            payment_method=payment_method,
            timestamp=ts,
            amount=amount,
            response_message="Payment processed successfully via Mock Payment Gateway." if status == "SUCCESS" else "Payment gateway processing failed."
        )