from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_active_user
from app.schemas import (
    AlertResponse, MarkAlertsReadRequest
)
from app.services.alert_service import AlertService

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    unread_only: bool = False,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    alerts = await AlertService.get_alerts(db, current_user.id, unread_only, limit)

    # Convert metadata from JSON string to dict for response
    for alert in alerts:
        if alert.metadata_json:
            try:
                import json
                alert.metadata = json.loads(alert.metadata_json)
            except:
                alert.metadata = None
        else:
            alert.metadata = None

    return alerts

@router.post("/mark-read")
async def mark_alerts_read(
    request: MarkAlertsReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not request.ids:
        raise HTTPException(status_code=400, detail="No alert IDs provided")

    count = await AlertService.mark_alerts_read(db, request.ids, current_user.id)
    return {
        "message": f"Marked {count} alerts as read",
        "count": count
    }

@router.post("/generate")
async def generate_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Manually trigger alert generation for the current user"""
    try:
        results = await AlertService.generate_all_alerts(db, current_user.id)
        return {
            "message": "Alert generation completed",
            "anomaly_alerts": len(results["anomaly"]),
            "budget_alerts": len(results["budget"]),
            "goal_alerts": len(results["goal"]),
            "subscription_alerts": len(results.get("subscription", [])),
            "total_alerts": results["total"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate alerts: {str(e)}")

@router.post("/generate-subscription-alerts")
async def generate_subscription_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate alerts for upcoming subscription payments and gray charges"""
    try:
        from app.services.alert_generation_service import AlertGenerationService
        from app.services.subscription_detector import SubscriptionDetector

        # First detect and update recurring charges
        await SubscriptionDetector.detect_recurring_charges(db)
        await SubscriptionDetector.mark_transactions_as_recurring(db)

        # Generate subscription-specific alerts
        alerts = await AlertGenerationService.generate_subscription_alerts(db, current_user.id)

        # Get gray charges summary
        gray_charges = await SubscriptionDetector.identify_gray_charges(db)

        return {
            "message": "Subscription alert generation completed",
            "upcoming_payment_alerts": len([a for a in alerts if "SUBSCRIPTION_REMINDER" in str(a.type)]),
            "gray_charge_alerts": len([a for a in alerts if "GRAY_CHARGE" in str(a.type)]),
            "total_gray_charges_detected": len(gray_charges),
            "potential_monthly_savings": sum(c['average_amount'] for c in gray_charges if c['frequency_days'] <= 31),
            "total_alerts": len(alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate subscription alerts: {str(e)}")