import csv
import json
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models import Transaction
from app.schemas import TransactionCreate
from io import StringIO

class TransactionService:
    @staticmethod
    async def parse_csv(file_content: str) -> List[Dict[str, Any]]:
        transactions = []
        try:
            df = pd.read_csv(StringIO(file_content))

            required_columns = ['date', 'amount', 'merchant', 'category']
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"CSV must contain columns: {required_columns}")

            for _, row in df.iterrows():
                transaction = {
                    'date': pd.to_datetime(row['date']),
                    'amount': float(row['amount']),
                    'merchant': str(row['merchant']),
                    'category': str(row['category']),
                    'description': str(row.get('description', ''))
                }

                if transaction['amount'] < 0:
                    transaction['transaction_type'] = 'income'
                    transaction['amount'] = abs(transaction['amount'])
                else:
                    transaction['transaction_type'] = 'expense'

                transactions.append(transaction)

        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")

        return transactions

    @staticmethod
    async def parse_json(file_content: str) -> List[Dict[str, Any]]:
        try:
            data = json.loads(file_content)
            if not isinstance(data, list):
                data = [data]

            transactions = []
            for item in data:
                transaction = {
                    'date': datetime.fromisoformat(item['date']) if isinstance(item['date'], str) else item['date'],
                    'amount': float(item['amount']),
                    'merchant': str(item['merchant']),
                    'category': str(item['category']),
                    'description': str(item.get('description', '')),
                    'transaction_type': item.get('transaction_type', 'expense')
                }

                if transaction['amount'] < 0:
                    transaction['amount'] = abs(transaction['amount'])

                transactions.append(transaction)

        except Exception as e:
            raise ValueError(f"Failed to parse JSON: {str(e)}")

        return transactions

    @staticmethod
    async def bulk_create(db: AsyncSession, transactions: List[Dict[str, Any]], user_id: str) -> int:
        created_count = 0
        for trans_data in transactions:
            trans_data['user_id'] = user_id
            transaction = Transaction(**trans_data)
            db.add(transaction)
            created_count += 1

        await db.commit()
        return created_count

    @staticmethod
    async def get_all(db: AsyncSession, user_id: str, skip: int = 0, limit: int = 100) -> List[Transaction]:
        result = await db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.date.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_date_range(
        db: AsyncSession,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Transaction]:
        result = await db.execute(
            select(Transaction)
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.date >= start_date,
                Transaction.date <= end_date
            ))
            .order_by(Transaction.date.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_spending_overview(db: AsyncSession, user_id: str) -> Dict[str, Any]:
        from datetime import datetime

        # Get current month boundaries
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        if now.month == 12:
            month_end = datetime(now.year + 1, 1, 1)
        else:
            month_end = datetime(now.year, now.month + 1, 1)

        income_result = await db.execute(
            select(func.sum(Transaction.amount))
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'income'
            ))
        )
        total_income = income_result.scalar() or 0.0

        expense_result = await db.execute(
            select(func.sum(Transaction.amount))
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'expense'
            ))
        )
        total_expenses = expense_result.scalar() or 0.0

        # Get all-time categories for compatibility
        category_result = await db.execute(
            select(
                Transaction.category,
                func.sum(Transaction.amount).label('total')
            )
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'expense'
            ))
            .group_by(Transaction.category)
        )
        categories = {row.category: float(row.total) for row in category_result}

        # Get current month categories
        current_month_result = await db.execute(
            select(
                Transaction.category,
                func.sum(Transaction.amount).label('total')
            )
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'expense',
                Transaction.date >= month_start,
                Transaction.date < month_end
            ))
            .group_by(Transaction.category)
        )
        current_month_categories = {row.category: float(row.total) for row in current_month_result}

        monthly_result = await db.execute(
            select(
                func.strftime('%Y-%m', Transaction.date).label('month'),
                Transaction.transaction_type,
                func.sum(Transaction.amount).label('total')
            )
            .where(Transaction.user_id == user_id)
            .group_by('month', Transaction.transaction_type)
            .order_by('month')
        )

        monthly_data = {}
        for row in monthly_result:
            month = row.month
            if month not in monthly_data:
                monthly_data[month] = {'month': month, 'income': 0, 'expenses': 0}
            if row.transaction_type == 'income':
                monthly_data[month]['income'] = float(row.total)
            else:
                monthly_data[month]['expenses'] = float(row.total)

        return {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_savings': total_income - total_expenses,
            'categories': categories,
            'current_month_categories': current_month_categories,
            'monthly_trend': list(monthly_data.values())
        }