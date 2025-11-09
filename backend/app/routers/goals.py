from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_active_user
from app.models import User
from app.schemas import GoalCreate, GoalUpdate, GoalResponse
from app.services.goal_service import GoalService
from app.services.alert_service import AlertService

router = APIRouter(prefix="/api/goals", tags=["goals"])

@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_goal = await GoalService.create_goal(db, goal, current_user.id)

    # Generate goal alerts after creating goal
    await AlertService.generate_goal_alerts(db, current_user.id)

    return new_goal

@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    goals = await GoalService.get_all_goals(db, current_user.id, active_only)
    return goals

@router.get("/recommendations")
async def get_goal_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    recommendations = await GoalService.get_goal_recommendations(db, current_user.id)
    return {"recommendations": recommendations}

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    goal = await GoalService.get_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    goal = await GoalService.update_goal(db, goal_id, goal_update, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = await GoalService.delete_goal(db, goal_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}

@router.post("/{goal_id}/progress")
async def update_goal_progress(
    goal_id: int,
    amount: float,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    goal = await GoalService.update_goal_progress(db, goal_id, amount, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Generate goal alerts after updating progress
    await AlertService.generate_goal_alerts(db, current_user.id)

    return {
        "message": f"Added ${amount:.2f} to goal",
        "current_amount": goal.current_amount,
        "target_amount": goal.target_amount,
        "progress_percentage": (goal.current_amount / goal.target_amount) * 100
    }

@router.get("/{goal_id}/projection")
async def get_goal_projection(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    goal = await GoalService.get_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    projected_date = await GoalService.project_goal_completion(db, goal, current_user.id)

    if not projected_date:
        return {
            "message": "Cannot project completion - no positive savings rate detected",
            "goal_name": goal.name,
            "remaining_amount": goal.target_amount - goal.current_amount
        }

    return {
        "goal_name": goal.name,
        "projected_completion_date": projected_date,
        "current_progress": (goal.current_amount / goal.target_amount) * 100,
        "remaining_amount": goal.target_amount - goal.current_amount
    }