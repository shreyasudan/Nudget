from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models import Transaction, RecurringCharge
from collections import defaultdict
import numpy as np

class SubscriptionDetector:
    @staticmethod
    def calculate_frequency_score(dates: List[datetime]) -> tuple[float, int]:
        if len(dates) < 2:
            return 0.0, 0

        dates_sorted = sorted(dates)
        intervals = []
        for i in range(1, len(dates_sorted)):
            interval = (dates_sorted[i] - dates_sorted[i-1]).days
            intervals.append(interval)

        if not intervals:
            return 0.0, 0

        mean_interval = np.mean(intervals)
        std_interval = np.std(intervals) if len(intervals) > 1 else 0

        if mean_interval == 0:
            return 0.0, 0

        consistency_score = 1 - (std_interval / mean_interval) if mean_interval > 0 else 0
        consistency_score = max(0, min(1, consistency_score))

        frequency_days = int(round(mean_interval))

        confidence = consistency_score
        if len(dates) >= 3:
            confidence *= 1.2
        if len(dates) >= 6:
            confidence *= 1.3

        confidence = min(1.0, confidence)

        return confidence, frequency_days

    @staticmethod
    async def detect_recurring_charges(db: AsyncSession) -> List[RecurringCharge]:
        result = await db.execute(
            select(Transaction)
            .where(Transaction.transaction_type == 'expense')
            .order_by(Transaction.merchant, Transaction.date)
        )
        transactions = result.scalars().all()

        merchant_transactions = defaultdict(list)
        for trans in transactions:
            merchant_transactions[trans.merchant].append(trans)

        recurring_charges = []

        for merchant, trans_list in merchant_transactions.items():
            if len(trans_list) < 2:
                continue

            dates = [t.date for t in trans_list]
            amounts = [t.amount for t in trans_list]

            confidence, frequency_days = SubscriptionDetector.calculate_frequency_score(dates)

            if confidence < 0.6:
                continue

            amount_variance = np.std(amounts) / np.mean(amounts) if np.mean(amounts) > 0 else 1
            if amount_variance > 0.2:
                confidence *= 0.8

            recurring_charge = RecurringCharge(
                merchant=merchant,
                average_amount=float(np.mean(amounts)),
                frequency_days=frequency_days,
                last_charge_date=max(dates),
                next_expected_date=max(dates) + timedelta(days=frequency_days),
                category=trans_list[0].category,
                is_active=True,
                confidence_score=confidence
            )

            existing = await db.execute(
                select(RecurringCharge).where(RecurringCharge.merchant == merchant)
            )
            existing_charge = existing.scalar_one_or_none()

            if existing_charge:
                existing_charge.average_amount = recurring_charge.average_amount
                existing_charge.frequency_days = recurring_charge.frequency_days
                existing_charge.last_charge_date = recurring_charge.last_charge_date
                existing_charge.next_expected_date = recurring_charge.next_expected_date
                existing_charge.confidence_score = recurring_charge.confidence_score
            else:
                db.add(recurring_charge)
                recurring_charges.append(recurring_charge)

        await db.commit()
        return recurring_charges

    @staticmethod
    async def get_all_recurring(db: AsyncSession) -> List[RecurringCharge]:
        result = await db.execute(
            select(RecurringCharge)
            .where(RecurringCharge.is_active == True)
            .order_by(RecurringCharge.confidence_score.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def identify_gray_charges(db: AsyncSession) -> List[Dict[str, Any]]:
        recurring = await SubscriptionDetector.get_all_recurring(db)

        gray_charges = []
        suspicious_keywords = ['trial', 'premium', 'pro', 'plus', 'subscription',
                              'monthly', 'annual', 'membership', 'service']

        for charge in recurring:
            is_suspicious = False
            reasons = []

            merchant_lower = charge.merchant.lower()
            for keyword in suspicious_keywords:
                if keyword in merchant_lower:
                    is_suspicious = True
                    reasons.append(f"Contains keyword: {keyword}")
                    break

            if charge.average_amount < 10:
                is_suspicious = True
                reasons.append("Small recurring amount (possible forgotten subscription)")

            if charge.confidence_score > 0.9 and charge.frequency_days in [28, 29, 30, 31]:
                reasons.append("Monthly subscription pattern detected")

            if charge.confidence_score > 0.9 and charge.frequency_days in [365, 366]:
                reasons.append("Annual subscription pattern detected")

            if is_suspicious or reasons:
                gray_charges.append({
                    'merchant': charge.merchant,
                    'average_amount': charge.average_amount,
                    'frequency_days': charge.frequency_days,
                    'last_charge_date': charge.last_charge_date,
                    'next_expected_date': charge.next_expected_date,
                    'reasons': reasons,
                    'confidence_score': charge.confidence_score
                })

        return gray_charges

    @staticmethod
    async def mark_transactions_as_recurring(db: AsyncSession):
        recurring = await SubscriptionDetector.get_all_recurring(db)

        for charge in recurring:
            result = await db.execute(
                select(Transaction)
                .where(and_(
                    Transaction.merchant == charge.merchant,
                    Transaction.is_recurring == False
                ))
            )
            transactions = result.scalars().all()

            for trans in transactions:
                trans.is_recurring = True

        await db.commit()