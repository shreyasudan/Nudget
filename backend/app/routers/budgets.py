from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.models import User
from app.auth import get_current_active_user
from app.schemas import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetUsage
)
from app.services.budget_service import BudgetService
from app.services.alert_service import AlertService

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

@router.post("/", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        new_budget = await BudgetService.create_budget(db, budget, current_user.id)

        # Generate budget alerts immediately after creation
        await AlertService.generate_budget_alerts(db, current_user.id)

        return new_budget
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create budget: {str(e)}")

@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    budgets = await BudgetService.get_budgets(db, current_user.id, active_only)
    return budgets

@router.get("/usage", response_model=List[BudgetUsage])
async def get_budget_usage(
    month: Optional[str] = None,  # Format: YYYY-MM
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    usage = await BudgetService.calculate_budget_usage(db, current_user.id, month)
    return usage

@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    budget = await BudgetService.get_budget(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    budget_update: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    updated_budget = await BudgetService.update_budget(
        db, budget_id, budget_update, current_user.id
    )
    if not updated_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Generate budget alerts after update
    await AlertService.generate_budget_alerts(db, current_user.id)

    return updated_budget

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = await BudgetService.delete_budget(db, budget_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deactivated successfully"}