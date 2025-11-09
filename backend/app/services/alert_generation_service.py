from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
import json
from app.models import Alert, Goal, Budget, Transaction, User, RecurringCharge
from app.schemas import AlertType
from app.services.subscription_detector import SubscriptionDetector

class AlertGenerationService:
    @staticmethod
    async def create_alert_if_not_exists(
        db: AsyncSession,
        user_id: str,
        alert_type: str,
        title: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Alert]:
        """Create an alert if a similar unread one doesn't already exist"""

        # Check for duplicate unread alert (same type, user, and title)
        # Don't create duplicate if there's already an unread alert with same title
        existing_query = select(Alert).where(
            and_(
                Alert.user_id == user_id,
                Alert.type == alert_type,
                Alert.title == title,  # Same title means same alert
                Alert.is_read == False  # Only check unread alerts
            )
        )

        result = await db.execute(existing_query)
        if result.scalar():
            return None  # Alert already exists and is unread

        # Create new alert
        alert = Alert(
            user_id=user_id,
            type=alert_type,
            title=title,
            description=description,
            metadata_json=json.dumps(metadata) if metadata else None
        )

        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def generate_goal_progress_alerts(
        db: AsyncSession,
        user_id: str
    ) -> List[Alert]:
        """Generate alerts for goals that are 70% or more complete with completion forecasting"""
        from app.services.goal_service import GoalService

        created_alerts = []

        # Get all active goals for the user
        goals_query = select(Goal).where(
            and_(
                Goal.user_id == user_id,
                Goal.is_active == True
            )
        )
        result = await db.execute(goals_query)
        goals = result.scalars().all()

        for goal in goals:
            # Calculate progress
            if goal.target_amount <= 0:
                continue

            progress = goal.current_amount / goal.target_amount

            # Generate alert if progress is between 70% and 100%
            if 0.7 <= progress < 1.0:
                progress_percent = int(progress * 100)
                remaining = goal.target_amount - goal.current_amount

                # Calculate projected completion date
                projected_date = await GoalService.project_goal_completion(db, goal, user_id)

                if projected_date:
                    days_to_completion = (projected_date - datetime.utcnow()).days
                    forecast_message = (
                        f" Based on your saving patterns, you're on track to reach this goal in "
                        f"approximately {days_to_completion} days ({projected_date.strftime('%B %d, %Y')}). "
                        f"Keep going!"
                    )
                else:
                    # Calculate how much they need to save per month
                    days_until_deadline = (goal.deadline - datetime.utcnow()).days
                    if days_until_deadline > 0:
                        monthly_needed = (remaining / days_until_deadline) * 30
                        forecast_message = (
                            f" To meet your deadline, you'll need to save approximately "
                            f"${monthly_needed:.2f} per month."
                        )
                    else:
                        forecast_message = " Your deadline has passed, but don't give up!"

                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="GOAL_PROGRESS",
                    title=f"Goal Progress: {goal.name}",
                    description=(
                        f"Great progress! You're {progress_percent}% of the way to your "
                        f"{goal.name} goal. Only ${remaining:.2f} left to save!{forecast_message}"
                    ),
                    metadata={
                        "goal_id": goal.id,
                        "goal_name": goal.name,
                        "current_amount": goal.current_amount,
                        "target_amount": goal.target_amount,
                        "progress_percentage": progress_percent,
                        "projected_completion_date": projected_date.isoformat() if projected_date else None
                    }
                )

                if alert:
                    created_alerts.append(alert)

            # Generate completion alert if goal is 100% or more complete
            elif progress >= 1.0:
                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="GOAL_PROGRESS",
                    title=f"Goal Complete: {goal.name}",
                    description=(
                        f"Congratulations! You've reached your {goal.name} goal "
                        f"of ${goal.target_amount:.2f}!"
                    ),
                    metadata={
                        "goal_id": goal.id,
                        "goal_name": goal.name,
                        "current_amount": goal.current_amount,
                        "target_amount": goal.target_amount,
                        "progress_percentage": 100
                    }
                )

                if alert:
                    created_alerts.append(alert)

        return created_alerts

    @staticmethod
    async def generate_budget_overspending_alerts(
        db: AsyncSession,
        user_id: str,
        month: Optional[datetime] = None
    ) -> List[Alert]:
        """Generate alerts for budgets that are 80% spent or exceeded"""

        created_alerts = []

        # Determine month to check
        if not month:
            month = datetime.utcnow()

        # Get start and end of month
        month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month.month == 12:
            month_end = month.replace(year=month.year + 1, month=1, day=1) - timedelta(seconds=1)
        else:
            month_end = month.replace(month=month.month + 1, day=1) - timedelta(seconds=1)

        # Calculate how far through the month we are
        days_in_month = (month_end - month_start).days + 1
        days_elapsed = (datetime.utcnow() - month_start).days + 1
        month_progress_percent = (days_elapsed / days_in_month) * 100

        # Get all active budgets for the user
        budgets_query = select(Budget).where(
            and_(
                Budget.user_id == user_id,
                Budget.is_active == True
            )
        )
        result = await db.execute(budgets_query)
        budgets = result.scalars().all()

        for budget in budgets:
            # Calculate spending for this budget's category
            if budget.category:
                # Category-specific budget
                spending_query = select(func.sum(Transaction.amount)).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.category == budget.category,
                        Transaction.transaction_type == 'expense',
                        Transaction.date >= month_start,
                        Transaction.date <= month_end
                    )
                )
            else:
                # Overall budget
                spending_query = select(func.sum(Transaction.amount)).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.transaction_type == 'expense',
                        Transaction.date >= month_start,
                        Transaction.date <= month_end
                    )
                )

            result = await db.execute(spending_query)
            spent_amount = result.scalar() or 0.0

            # Calculate budget usage percentage
            budget_usage_percent = (spent_amount / budget.amount_monthly * 100) if budget.amount_monthly > 0 else 0
            category_name = budget.category or "Overall"

            # Check if budget is exceeded
            if spent_amount > budget.amount_monthly:
                overspend = spent_amount - budget.amount_monthly
                percent_over = int((spent_amount / budget.amount_monthly - 1) * 100)

                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="BUDGET_WARNING",
                    title=f"Budget Exceeded: {category_name}",
                    description=(
                        f"You've spent ${spent_amount:.2f} in {category_name} this month, "
                        f"which is ${overspend:.2f} over your ${budget.amount_monthly:.2f} budget "
                        f"({percent_over}% over)."
                    ),
                    metadata={
                        "budget_id": budget.id,
                        "category": budget.category,
                        "budgeted_amount": budget.amount_monthly,
                        "spent_amount": spent_amount,
                        "overspend_amount": overspend,
                        "severity": "high",
                        "month": month.strftime("%Y-%m")
                    }
                )

                if alert:
                    created_alerts.append(alert)

            # Check if budget is 80% spent and we're only halfway through the month or less
            elif budget_usage_percent >= 80 and month_progress_percent <= 60:
                remaining = budget.amount_monthly - spent_amount
                days_left = days_in_month - days_elapsed
                daily_budget_remaining = remaining / days_left if days_left > 0 else 0

                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="BUDGET_WARNING",
                    title=f"Budget Alert: {category_name}",
                    description=(
                        f"Careful! You've spent ${spent_amount:.2f} ({int(budget_usage_percent)}%) "
                        f"of your ${budget.amount_monthly:.2f} {category_name} budget, "
                        f"but we're only {int(month_progress_percent)}% through the month. "
                        f"You have ${remaining:.2f} left for the next {days_left} days "
                        f"(about ${daily_budget_remaining:.2f}/day)."
                    ),
                    metadata={
                        "budget_id": budget.id,
                        "category": budget.category,
                        "budgeted_amount": budget.amount_monthly,
                        "spent_amount": spent_amount,
                        "budget_usage_percent": budget_usage_percent,
                        "month_progress_percent": month_progress_percent,
                        "severity": "medium",
                        "month": month.strftime("%Y-%m")
                    }
                )

                if alert:
                    created_alerts.append(alert)

        return created_alerts

    @staticmethod
    async def generate_anomaly_alerts(
        db: AsyncSession,
        user_id: str,
        month: Optional[datetime] = None
    ) -> List[Alert]:
        """Generate alerts for unusual spending patterns (>40% above 3-month average)"""

        created_alerts = []

        # Determine current month
        if not month:
            month = datetime.utcnow()

        current_month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month.month == 12:
            current_month_end = month.replace(year=month.year + 1, month=1, day=1) - timedelta(seconds=1)
        else:
            current_month_end = month.replace(month=month.month + 1, day=1) - timedelta(seconds=1)

        # Calculate 3 months ago
        three_months_ago = current_month_start - timedelta(days=90)

        # Get distinct categories used by this user in recent months
        categories_query = select(Transaction.category).distinct().where(
            and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'expense',
                Transaction.date >= three_months_ago,
                Transaction.category.isnot(None)
            )
        )
        result = await db.execute(categories_query)
        categories = result.scalars().all()

        for category in categories:
            # Calculate current month spending
            current_query = select(func.sum(Transaction.amount)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category == category,
                    Transaction.transaction_type == 'expense',
                    Transaction.date >= current_month_start,
                    Transaction.date <= current_month_end
                )
            )
            result = await db.execute(current_query)
            current_spending = result.scalar() or 0.0

            if current_spending == 0:
                continue

            # Calculate average of last 3 months (excluding current month)
            last_3_months_end = current_month_start - timedelta(seconds=1)
            last_3_months_start = last_3_months_end.replace(day=1) - timedelta(days=89)  # ~3 months

            avg_query = select(func.avg(Transaction.amount)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category == category,
                    Transaction.transaction_type == 'expense',
                    Transaction.date >= last_3_months_start,
                    Transaction.date <= last_3_months_end
                )
            )

            # Get count of transactions for average calculation
            count_query = select(func.count(Transaction.id)).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category == category,
                    Transaction.transaction_type == 'expense',
                    Transaction.date >= last_3_months_start,
                    Transaction.date <= last_3_months_end
                )
            )

            avg_result = await db.execute(avg_query)
            avg_transaction = avg_result.scalar() or 0.0

            count_result = await db.execute(count_query)
            transaction_count = count_result.scalar() or 0

            if transaction_count < 3:  # Need at least 3 transactions for meaningful average
                continue

            # Estimate monthly average (assuming similar transaction frequency)
            monthly_avg = avg_transaction * (transaction_count / 3)  # Rough monthly estimate

            # Check if current spending is anomalous (>40% above average)
            if monthly_avg > 0 and current_spending > monthly_avg * 1.4:
                percent_of_usual = int((current_spending / monthly_avg) * 100)

                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="ANOMALY",
                    title=f"Unusual Spending: {category}",
                    description=(
                        f"Your {category} spending this month (${current_spending:.2f}) "
                        f"is {percent_of_usual}% of your usual amount. "
                        f"This is significantly higher than your typical spending pattern."
                    ),
                    metadata={
                        "category": category,
                        "current_amount": current_spending,
                        "average_amount": monthly_avg,
                        "percent_of_usual": percent_of_usual,
                        "month": month.strftime("%Y-%m")
                    }
                )

                if alert:
                    created_alerts.append(alert)

        return created_alerts

    @staticmethod
    async def generate_subscription_alerts(
        db: AsyncSession,
        user_id: str
    ) -> List[Alert]:
        """Generate alerts for upcoming subscription payments and gray charges"""

        created_alerts = []
        now = datetime.utcnow()

        # Get all recurring charges
        recurring_charges = await SubscriptionDetector.get_all_recurring(db)

        # Filter charges for this user (based on transactions)
        user_transactions = await db.execute(
            select(Transaction.merchant).distinct().where(
                Transaction.user_id == user_id
            )
        )
        user_merchants = set(user_transactions.scalars().all())

        # Check for upcoming payments (within 3 days)
        for charge in recurring_charges:
            if charge.merchant not in user_merchants:
                continue

            days_until_charge = (charge.next_expected_date - now).days

            # Alert for upcoming payments (within 3 days)
            if 0 <= days_until_charge <= 3:
                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="SUBSCRIPTION_REMINDER",
                    title=f"Upcoming Payment: {charge.merchant}",
                    description=(
                        f"You have a recurring payment of ${charge.average_amount:.2f} "
                        f"from {charge.merchant} coming up in {days_until_charge} day(s). "
                        f"Expected on {charge.next_expected_date.strftime('%B %d, %Y')}."
                    ),
                    metadata={
                        "merchant": charge.merchant,
                        "amount": charge.average_amount,
                        "next_charge_date": charge.next_expected_date.isoformat(),
                        "frequency_days": charge.frequency_days,
                        "confidence_score": charge.confidence_score
                    }
                )

                if alert:
                    created_alerts.append(alert)

        # Generate gray charge alerts
        gray_charges = await SubscriptionDetector.identify_gray_charges(db)

        for gray_charge in gray_charges:
            if gray_charge['merchant'] not in user_merchants:
                continue

            # Only alert for high-confidence gray charges
            if gray_charge['confidence_score'] > 0.7:
                reasons_text = ". ".join(gray_charge['reasons']) if gray_charge['reasons'] else "Potentially forgotten subscription"

                alert = await AlertGenerationService.create_alert_if_not_exists(
                    db,
                    user_id=user_id,
                    alert_type="GRAY_CHARGE",
                    title=f"Review Subscription: {gray_charge['merchant']}",
                    description=(
                        f"You have a recurring charge of ${gray_charge['average_amount']:.2f} "
                        f"from {gray_charge['merchant']} every {gray_charge['frequency_days']} days. "
                        f"{reasons_text}. Consider reviewing if you still need this subscription."
                    ),
                    metadata={
                        "merchant": gray_charge['merchant'],
                        "amount": gray_charge['average_amount'],
                        "frequency_days": gray_charge['frequency_days'],
                        "reasons": gray_charge['reasons'],
                        "confidence_score": gray_charge['confidence_score'],
                        "last_charge_date": gray_charge['last_charge_date'].isoformat() if gray_charge['last_charge_date'] else None
                    }
                )

                if alert:
                    created_alerts.append(alert)

        return created_alerts

    @staticmethod
    async def generate_all_alerts_for_user(
        db: AsyncSession,
        user_id: str,
        month: Optional[datetime] = None
    ) -> Dict[str, List[Alert]]:
        """Generate all types of alerts for a user"""

        if not month:
            month = datetime.utcnow()

        # Generate all alert types
        goal_alerts = await AlertGenerationService.generate_goal_progress_alerts(db, user_id)
        budget_alerts = await AlertGenerationService.generate_budget_overspending_alerts(db, user_id, month)
        anomaly_alerts = await AlertGenerationService.generate_anomaly_alerts(db, user_id, month)
        subscription_alerts = await AlertGenerationService.generate_subscription_alerts(db, user_id)

        return {
            "goal_progress": goal_alerts,
            "budget_overspending": budget_alerts,
            "anomalies": anomaly_alerts,
            "subscriptions": subscription_alerts,
            "total": len(goal_alerts) + len(budget_alerts) + len(anomaly_alerts) + len(subscription_alerts)
        }