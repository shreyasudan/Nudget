from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from app.models import Budget, Transaction
from app.schemas import BudgetCreate, BudgetUpdate

class BudgetService:
    @staticmethod
    async def create_budget(
        db: AsyncSession,
        budget_data: BudgetCreate,
        user_id: str
    ) -> Budget:
        # Check if budget for this category already exists
        existing_budget = await db.execute(
            select(Budget).where(
                and_(
                    Budget.user_id == user_id,
                    Budget.category == budget_data.category,
                    Budget.is_active == True
                )
            )
        )
        if existing_budget.scalar():
            raise ValueError(f"Active budget for category '{budget_data.category or 'overall'}' already exists")

        budget = Budget(
            user_id=user_id,
            **budget_data.dict()
        )
        db.add(budget)
        await db.commit()
        await db.refresh(budget)
        return budget

    @staticmethod
    async def get_budgets(
        db: AsyncSession,
        user_id: str,
        active_only: bool = True
    ) -> List[Budget]:
        query = select(Budget).where(Budget.user_id == user_id)
        if active_only:
            query = query.where(Budget.is_active == True)
        result = await db.execute(query.order_by(Budget.created_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def get_budget(
        db: AsyncSession,
        budget_id: str,
        user_id: str
    ) -> Optional[Budget]:
        result = await db.execute(
            select(Budget).where(
                and_(
                    Budget.id == budget_id,
                    Budget.user_id == user_id
                )
            )
        )
        return result.scalar()

    @staticmethod
    async def update_budget(
        db: AsyncSession,
        budget_id: str,
        budget_update: BudgetUpdate,
        user_id: str
    ) -> Optional[Budget]:
        budget = await BudgetService.get_budget(db, budget_id, user_id)
        if not budget:
            return None

        update_data = budget_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(budget, field, value)

        budget.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(budget)
        return budget

    @staticmethod
    async def delete_budget(
        db: AsyncSession,
        budget_id: str,
        user_id: str
    ) -> bool:
        budget = await BudgetService.get_budget(db, budget_id, user_id)
        if not budget:
            return False

        # Soft delete by deactivating
        budget.is_active = False
        budget.updated_at = datetime.utcnow()
        await db.commit()
        return True

    @staticmethod
    async def calculate_budget_usage(
        db: AsyncSession,
        user_id: str,
        month: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        # Get current month if not specified
        if not month:
            now = datetime.utcnow()
            month = now.strftime("%Y-%m")

        # Parse month to get date range
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1)
        if month_num == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(year, month_num + 1, 1) - timedelta(seconds=1)

        # Get active budgets
        budgets = await BudgetService.get_budgets(db, user_id, active_only=True)

        usage_list = []
        for budget in budgets:
            # Calculate spending for this budget's category
            if budget.category:
                # Category-specific budget
                spending_query = select(func.sum(Transaction.amount)).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.category == budget.category,
                        Transaction.transaction_type == 'expense',
                        Transaction.date >= start_date,
                        Transaction.date <= end_date
                    )
                )
            else:
                # Overall budget
                spending_query = select(func.sum(Transaction.amount)).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.transaction_type == 'expense',
                        Transaction.date >= start_date,
                        Transaction.date <= end_date
                    )
                )

            result = await db.execute(spending_query)
            spent_amount = result.scalar() or 0.0

            # Calculate percentage and status
            percent_used = (spent_amount / budget.amount_monthly * 100) if budget.amount_monthly > 0 else 0

            if percent_used <= 70:
                status = "ok"
            elif percent_used <= 90:
                status = "warning"
            else:
                status = "danger"

            remaining_amount = budget.amount_monthly - spent_amount

            usage_list.append({
                "budget_id": budget.id,
                "category": budget.category,
                "budgeted_amount": budget.amount_monthly,
                "spent_amount": spent_amount,
                "remaining_amount": remaining_amount,
                "percent_used": min(percent_used, 999.99),  # Cap at 999.99%
                "status": status,
                "currency": budget.currency
            })

        return usage_list