from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models import Goal, Transaction
from app.schemas import GoalCreate, GoalUpdate
import numpy as np

class GoalService:
    @staticmethod
    async def create_goal(db: AsyncSession, goal_data: GoalCreate) -> Goal:
        goal = Goal(**goal_data.dict())
        db.add(goal)
        await db.commit()
        await db.refresh(goal)
        return goal

    @staticmethod
    async def get_all_goals(db: AsyncSession, active_only: bool = True) -> List[Goal]:
        query = select(Goal)
        if active_only:
            query = query.where(Goal.is_active == True)
        result = await db.execute(query.order_by(Goal.deadline))
        return result.scalars().all()

    @staticmethod
    async def get_goal(db: AsyncSession, goal_id: int) -> Optional[Goal]:
        result = await db.execute(select(Goal).where(Goal.id == goal_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_goal(db: AsyncSession, goal_id: int, goal_update: GoalUpdate) -> Optional[Goal]:
        goal = await GoalService.get_goal(db, goal_id)
        if not goal:
            return None

        update_data = goal_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)

        goal.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(goal)
        return goal

    @staticmethod
    async def delete_goal(db: AsyncSession, goal_id: int) -> bool:
        goal = await GoalService.get_goal(db, goal_id)
        if not goal:
            return False

        await db.delete(goal)
        await db.commit()
        return True

    @staticmethod
    async def calculate_savings_rate(db: AsyncSession) -> float:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        income_result = await db.execute(
            select(Transaction)
            .where(and_(
                Transaction.transaction_type == 'income',
                Transaction.date >= thirty_days_ago
            ))
        )
        income_transactions = income_result.scalars().all()
        monthly_income = sum(t.amount for t in income_transactions)

        expense_result = await db.execute(
            select(Transaction)
            .where(and_(
                Transaction.transaction_type == 'expense',
                Transaction.date >= thirty_days_ago
            ))
        )
        expense_transactions = expense_result.scalars().all()
        monthly_expenses = sum(t.amount for t in expense_transactions)

        monthly_savings = monthly_income - monthly_expenses
        return max(0, monthly_savings)

    @staticmethod
    async def project_goal_completion(db: AsyncSession, goal: Goal) -> Optional[datetime]:
        if goal.current_amount >= goal.target_amount:
            return datetime.utcnow()

        monthly_savings = await GoalService.calculate_savings_rate(db)

        if monthly_savings <= 0:
            return None

        remaining_amount = goal.target_amount - goal.current_amount
        months_needed = remaining_amount / monthly_savings
        projected_date = datetime.utcnow() + timedelta(days=int(months_needed * 30))

        return projected_date

    @staticmethod
    async def update_goal_progress(db: AsyncSession, goal_id: int, amount_to_add: float) -> Optional[Goal]:
        goal = await GoalService.get_goal(db, goal_id)
        if not goal:
            return None

        goal.current_amount += amount_to_add
        goal.updated_at = datetime.utcnow()

        if goal.current_amount >= goal.target_amount:
            goal.is_active = False

        await db.commit()
        await db.refresh(goal)
        return goal

    @staticmethod
    async def get_goal_recommendations(db: AsyncSession) -> List[dict]:
        monthly_savings = await GoalService.calculate_savings_rate(db)

        recommendations = []

        if monthly_savings > 0:
            emergency_fund = monthly_savings * 6
            recommendations.append({
                'type': 'Emergency Fund',
                'suggested_amount': emergency_fund,
                'timeframe_months': 6,
                'priority': 'high',
                'description': '6 months of expenses for emergency situations'
            })

            vacation_fund = monthly_savings * 3
            recommendations.append({
                'type': 'Vacation Fund',
                'suggested_amount': vacation_fund,
                'timeframe_months': 12,
                'priority': 'medium',
                'description': 'Save for your dream vacation'
            })

            investment_fund = monthly_savings * 12
            recommendations.append({
                'type': 'Investment Fund',
                'suggested_amount': investment_fund,
                'timeframe_months': 24,
                'priority': 'medium',
                'description': 'Build wealth through investments'
            })

        return recommendations