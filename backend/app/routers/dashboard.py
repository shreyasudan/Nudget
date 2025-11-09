from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import json
from app.database import get_db
from app.models import User
from app.auth import get_current_active_user
from app.schemas import DashboardOverview
from app.services.transaction_service import TransactionService
from app.services.budget_service import BudgetService
from app.services.alert_service import AlertService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive dashboard data including transactions, budgets, and alerts"""
    try:
        # Generate fresh alerts for the user
        await AlertService.generate_all_alerts(db, current_user.id)

        # Get spending overview from transaction service
        spending_data = await TransactionService.get_spending_overview(db, current_user.id)

        # Prepare summary
        summary = {
            "total_income": spending_data["total_income"],
            "total_expenses": spending_data["total_expenses"],
            "net_savings": spending_data["net_savings"]
        }

        # Prepare income vs expenses (monthly trend)
        income_vs_expenses = spending_data["monthly_trend"]

        # Prepare spending by category
        spending_by_category = [
            {"category": cat, "amount": amount}
            for cat, amount in spending_data["categories"].items()
        ]

        # Get budget usage
        budget_usage = await BudgetService.calculate_budget_usage(db, current_user.id)

        # Get recent alerts
        recent_alerts_raw = await AlertService.get_alerts(
            db, current_user.id, unread_only=False, limit=10
        )

        # Convert alerts to response format
        recent_alerts = []
        for alert in recent_alerts_raw:
            alert_dict = {
                "id": alert.id,
                "user_id": alert.user_id,
                "type": alert.type,
                "title": alert.title,
                "description": alert.description,
                "is_read": alert.is_read,
                "created_at": alert.created_at,
                "metadata": None
            }

            # Parse metadata if it exists
            if alert.metadata_json:
                try:
                    alert_dict["metadata"] = json.loads(alert.metadata_json)
                except:
                    pass

            recent_alerts.append(alert_dict)

        return DashboardOverview(
            summary=summary,
            income_vs_expenses=income_vs_expenses,
            spending_by_category=spending_by_category,
            budget_usage=budget_usage,
            recent_alerts=recent_alerts
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate dashboard overview: {str(e)}"
        )