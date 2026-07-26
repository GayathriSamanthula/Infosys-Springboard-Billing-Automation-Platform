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
                "payment_timestamp": payment_time,
                "response_message": (
                    "Payment processed successfully."
                ),
            }

        return {
            "transaction_id": transaction_id,
            "payment_status": "FAILED",
            "payment_timestamp": payment_time,
            "response_message": (
                "Payment processing failed."
            ),
        }