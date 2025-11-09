import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from app.models import Alert, Transaction, Budget, Goal
from app.schemas import AlertCreate, AlertType

class AlertService:
    @staticmethod
    async def create_alert(
        db: AsyncSession,
        alert_data: AlertCreate,
        user_id: str
    ) -> Alert:
        # Convert metadata dict to JSON string if provided
        metadata_str = json.dumps(alert_data.metadata) if alert_data.metadata else None

        alert = Alert(
            user_id=user_id,
            type=alert_data.type,
            title=alert_data.title,
            description=alert_data.description,
            metadata_json=metadata_str
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def get_alerts(
        db: AsyncSession,
        user_id: str,
        unread_only: bool = False,
        limit: int = 20
    ) -> List[Alert]:
        query = select(Alert).where(Alert.user_id == user_id)

        if unread_only:
            query = query.where(Alert.is_read == False)

        query = query.order_by(desc(Alert.created_at)).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def mark_alerts_read(
        db: AsyncSession,
        alert_ids: List[str],
        user_id: str
    ) -> int:
        result = await db.execute(
            select(Alert).where(
                and_(
                    Alert.id.in_(alert_ids),
                    Alert.user_id == user_id
                )
            )
        )
        alerts = result.scalars().all()

        count = 0
        for alert in alerts:
            if not alert.is_read:
                alert.is_read = True
                count += 1

        await db.commit()
        return count

    @staticmethod
    async def generate_anomaly_alerts(
        db: AsyncSession,
        user_id: str,
        lookback_months: int = 3
    ) -> List[Alert]:
        """Generate alerts for spending anomalies"""
        alerts_created = []
        now = datetime.utcnow()
        current_month_start = datetime(now.year, now.month, 1)

        # Calculate average spending by category for last N months
        lookback_start = current_month_start - timedelta(days=lookback_months * 30)

        # Get historical spending by category
        historical_query = select(
            Transaction.category,
            func.avg(Transaction.amount).label('avg_amount'),
            func.count(Transaction.id).label('transaction_count')
        ).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'expense',
                Transaction.date >= lookback_start,
                Transaction.date < current_month_start
            )
        ).group_by(Transaction.category)

        historical_result = await db.execute(historical_query)
        historical_data = {row.category: row.avg_amount for row in historical_result}

        if not historical_data:
            return alerts_created  # No historical data to compare against

        # Get current month spending by category
        current_query = select(
            Transaction.category,
            func.sum(Transaction.amount).label('current_amount')
        ).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'expense',
                Transaction.date >= current_month_start
            )
        ).group_by(Transaction.category)

        current_result = await db.execute(current_query)

        # Check for anomalies
        for row in current_result:
            category = row.category
            current_amount = row.current_amount

            if category in historical_data:
                avg_amount = historical_data[category]
                # Calculate percentage increase
                if avg_amount > 0:
                    percent_increase = ((current_amount - avg_amount) / avg_amount) * 100

                    # Create alert if spending is 40% above average
                    if percent_increase > 40:
                        alert_data = AlertCreate(
                            type=AlertType.ANOMALY,
                            title=f"Unusual spending in {category}",
                            description=f"Your spending in {category} this month (${current_amount:.2f}) is {percent_increase:.0f}% higher than your {lookback_months}-month average (${avg_amount:.2f})",
                            metadata={
                                "category": category,
                                "current_amount": current_amount,
                                "average_amount": avg_amount,
                                "percent_increase": percent_increase
                            }
                        )
                        alert = await AlertService.create_alert(db, alert_data, user_id)
                        alerts_created.append(alert)

        return alerts_created

    @staticmethod
    async def generate_budget_alerts(
        db: AsyncSession,
        user_id: str
    ) -> List[Alert]:
        """Generate alerts for budget warnings"""
        from app.services.budget_service import BudgetService

        alerts_created = []

        # Get budget usage
        budget_usage = await BudgetService.calculate_budget_usage(db, user_id)

        for usage in budget_usage:
            # Create alert if budget is over 90% used
            if usage['percent_used'] >= 90:
                category_name = usage['category'] or 'Overall'
                alert_data = AlertCreate(
                    type=AlertType.BUDGET_WARNING,
                    title=f"Budget warning for {category_name}",
                    description=f"You've used {usage['percent_used']:.1f}% of your {category_name} budget (${usage['spent_amount']:.2f} of ${usage['budgeted_amount']:.2f})",
                    metadata={
                        "budget_id": usage['budget_id'],
                        "category": usage['category'],
                        "spent_amount": usage['spent_amount'],
                        "budgeted_amount": usage['budgeted_amount'],
                        "percent_used": usage['percent_used']
                    }
                )

                # Check if similar alert already exists in last 7 days
                existing_alert_query = select(Alert).where(
                    and_(
                        Alert.user_id == user_id,
                        Alert.type == AlertType.BUDGET_WARNING,
                        Alert.created_at >= datetime.utcnow() - timedelta(days=7)
                    )
                )
                existing_alert_result = await db.execute(existing_alert_query)
                existing_alerts = existing_alert_result.scalars().all()

                # Check if we already have an alert for this budget
                already_exists = False
                for existing in existing_alerts:
                    if existing.metadata_json:
                        try:
                            metadata = json.loads(existing.metadata_json)
                            if metadata.get('budget_id') == usage['budget_id']:
                                already_exists = True
                                break
                        except:
                            pass

                if not already_exists:
                    alert = await AlertService.create_alert(db, alert_data, user_id)
                    alerts_created.append(alert)

        return alerts_created

    @staticmethod
    async def generate_goal_alerts(
        db: AsyncSession,
        user_id: str
    ) -> List[Alert]:
        """Generate alerts for goal progress"""
        alerts_created = []

        # Get active goals
        goals_query = select(Goal).where(
            and_(
                Goal.user_id == user_id,
                Goal.is_active == True
            )
        )
        goals_result = await db.execute(goals_query)
        goals = goals_result.scalars().all()

        for goal in goals:
            # Calculate progress percentage
            if goal.target_amount > 0:
                progress_percent = (goal.current_amount / goal.target_amount) * 100

                # Create alert if goal is 70% or more complete
                if progress_percent >= 70 and progress_percent < 100:
                    alert_data = AlertCreate(
                        type=AlertType.GOAL_PROGRESS,
                        title=f"Almost there! {goal.name} is {progress_percent:.0f}% complete",
                        description=f"You've saved ${goal.current_amount:.2f} of your ${goal.target_amount:.2f} goal. Keep it up!",
                        metadata={
                            "goal_id": goal.id,
                            "goal_name": goal.name,
                            "current_amount": goal.current_amount,
                            "target_amount": goal.target_amount,
                            "progress_percent": progress_percent
                        }
                    )

                    # Check if alert already exists in last 7 days
                    existing_alert_query = select(Alert).where(
                        and_(
                            Alert.user_id == user_id,
                            Alert.type == AlertType.GOAL_PROGRESS,
                            Alert.created_at >= datetime.utcnow() - timedelta(days=7)
                        )
                    )
                    existing_alert_result = await db.execute(existing_alert_query)
                    existing_alerts = existing_alert_result.scalars().all()

                    # Check if we already have an alert for this goal
                    already_exists = False
                    for existing in existing_alerts:
                        if existing.metadata_json:
                            try:
                                metadata = json.loads(existing.metadata_json)
                                if metadata.get('goal_id') == goal.id:
                                    already_exists = True
                                    break
                            except:
                                pass

                    if not already_exists:
                        alert = await AlertService.create_alert(db, alert_data, user_id)
                        alerts_created.append(alert)

                # Create alert if goal is 100% complete
                elif progress_percent >= 100:
                    alert_data = AlertCreate(
                        type=AlertType.GOAL_PROGRESS,
                        title=f"Congratulations! You've reached your {goal.name} goal!",
                        description=f"You've successfully saved ${goal.current_amount:.2f}, meeting your target of ${goal.target_amount:.2f}!",
                        metadata={
                            "goal_id": goal.id,
                            "goal_name": goal.name,
                            "current_amount": goal.current_amount,
                            "target_amount": goal.target_amount,
                            "progress_percent": 100
                        }
                    )

                    # Check if completion alert already exists
                    existing_alert_query = select(Alert).where(
                        and_(
                            Alert.user_id == user_id,
                            Alert.type == AlertType.GOAL_PROGRESS,
                            Alert.title.contains("Congratulations"),
                            Alert.created_at >= datetime.utcnow() - timedelta(days=30)
                        )
                    )
                    existing_alert_result = await db.execute(existing_alert_query)
                    existing_alerts = existing_alert_result.scalars().all()

                    # Check if we already have a completion alert for this goal
                    already_exists = False
                    for existing in existing_alerts:
                        if existing.metadata_json:
                            try:
                                metadata = json.loads(existing.metadata_json)
                                if metadata.get('goal_id') == goal.id:
                                    already_exists = True
                                    break
                            except:
                                pass

                    if not already_exists:
                        alert = await AlertService.create_alert(db, alert_data, user_id)
                        alerts_created.append(alert)

        return alerts_created

    @staticmethod
    async def generate_all_alerts(
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, List[Alert]]:
        """Generate all types of alerts for a user"""
        anomaly_alerts = await AlertService.generate_anomaly_alerts(db, user_id)
        budget_alerts = await AlertService.generate_budget_alerts(db, user_id)
        goal_alerts = await AlertService.generate_goal_alerts(db, user_id)

        return {
            "anomaly": anomaly_alerts,
            "budget": budget_alerts,
            "goal": goal_alerts,
            "total": len(anomaly_alerts) + len(budget_alerts) + len(goal_alerts)
        }