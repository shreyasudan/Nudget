from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models import User
from app.auth import get_current_active_user
from app.schemas import RecurringChargeResponse
from app.services.subscription_detector import SubscriptionDetector

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

@router.post("/detect")
async def detect_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        detected = await SubscriptionDetector.detect_recurring_charges(db, current_user.id)
        await SubscriptionDetector.mark_transactions_as_recurring(db)

        return {
            "message": f"Detected {len(detected)} new recurring charges",
            "count": len(detected)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect subscriptions: {str(e)}")

@router.get("/", response_model=List[RecurringChargeResponse])
async def get_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    subscriptions = await SubscriptionDetector.get_all_recurring(db, current_user.id)
    return subscriptions

@router.get("/gray-charges")
async def get_gray_charges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    gray_charges = await SubscriptionDetector.identify_gray_charges(db, current_user.id)

    return {
        "gray_charges": gray_charges,
        "total": len(gray_charges),
        "potential_monthly_savings": sum(c['average_amount'] for c in gray_charges if c['frequency_days'] <= 31)
    }