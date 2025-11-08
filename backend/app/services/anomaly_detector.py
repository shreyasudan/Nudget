from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models import Transaction
from app.schemas import AnomalyAlert
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    @staticmethod
    def calculate_zscore(value: float, mean: float, std: float) -> float:
        if std == 0:
            return 0
        return abs((value - mean) / std)

    @staticmethod
    async def detect_anomalies(db: AsyncSession) -> List[AnomalyAlert]:
        result = await db.execute(
            select(Transaction)
            .where(Transaction.transaction_type == 'expense')
            .order_by(Transaction.date.desc())
        )
        transactions = result.scalars().all()

        if len(transactions) < 10:
            return []

        amounts = [t.amount for t in transactions]
        mean_amount = np.mean(amounts)
        std_amount = np.std(amounts)

        merchant_stats = {}
        for trans in transactions:
            if trans.merchant not in merchant_stats:
                merchant_stats[trans.merchant] = []
            merchant_stats[trans.merchant].append(trans.amount)

        for merchant, amounts_list in merchant_stats.items():
            if len(amounts_list) > 1:
                merchant_stats[merchant] = {
                    'mean': np.mean(amounts_list),
                    'std': np.std(amounts_list),
                    'count': len(amounts_list)
                }

        category_stats = {}
        for trans in transactions:
            if trans.category not in category_stats:
                category_stats[trans.category] = []
            category_stats[trans.category].append(trans.amount)

        for category, amounts_list in category_stats.items():
            if len(amounts_list) > 1:
                category_stats[category] = {
                    'mean': np.mean(amounts_list),
                    'std': np.std(amounts_list),
                    'count': len(amounts_list)
                }

        anomalies = []

        for trans in transactions[:100]:
            anomaly_score = 0
            reasons = []
            severity = 'low'

            amount_zscore = AnomalyDetector.calculate_zscore(
                trans.amount, mean_amount, std_amount
            )
            if amount_zscore > 3:
                anomaly_score += amount_zscore
                reasons.append(f"Amount significantly higher than average (Z-score: {amount_zscore:.2f})")
                severity = 'high' if amount_zscore > 4 else 'medium'

            if trans.merchant in merchant_stats and isinstance(merchant_stats[trans.merchant], dict):
                merchant_mean = merchant_stats[trans.merchant]['mean']
                merchant_std = merchant_stats[trans.merchant]['std']
                merchant_zscore = AnomalyDetector.calculate_zscore(
                    trans.amount, merchant_mean, merchant_std
                )
                if merchant_zscore > 2.5:
                    anomaly_score += merchant_zscore * 0.5
                    reasons.append(f"Unusual amount for this merchant")

            if trans.category in category_stats and isinstance(category_stats[trans.category], dict):
                cat_mean = category_stats[trans.category]['mean']
                cat_std = category_stats[trans.category]['std']
                cat_zscore = AnomalyDetector.calculate_zscore(
                    trans.amount, cat_mean, cat_std
                )
                if cat_zscore > 2.5:
                    anomaly_score += cat_zscore * 0.3
                    reasons.append(f"Unusual amount for category {trans.category}")

            time_of_day = trans.date.hour
            if time_of_day >= 2 and time_of_day <= 5:
                anomaly_score += 0.5
                reasons.append("Transaction at unusual hour")

            is_weekend = trans.date.weekday() >= 5
            if trans.amount > mean_amount * 2 and is_weekend:
                anomaly_score += 0.3
                reasons.append("Large weekend transaction")

            if anomaly_score > 2:
                trans.is_anomaly = True
                trans.anomaly_score = min(anomaly_score, 10.0)

                if reasons:
                    alert = AnomalyAlert(
                        transaction_id=trans.id,
                        reason="; ".join(reasons),
                        severity=severity,
                        anomaly_score=trans.anomaly_score
                    )
                    anomalies.append(alert)

        await db.commit()
        return anomalies

    @staticmethod
    async def detect_anomalies_ml(db: AsyncSession) -> List[AnomalyAlert]:
        result = await db.execute(
            select(Transaction)
            .where(Transaction.transaction_type == 'expense')
            .order_by(Transaction.date.desc())
        )
        transactions = result.scalars().all()

        if len(transactions) < 20:
            return await AnomalyDetector.detect_anomalies(db)

        features = []
        trans_list = []

        for trans in transactions:
            feature = [
                trans.amount,
                trans.date.weekday(),
                trans.date.hour,
                trans.date.day,
                len(trans.merchant),
                hash(trans.category) % 100
            ]
            features.append(feature)
            trans_list.append(trans)

        features_array = np.array(features)

        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features_array)

        iso_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        predictions = iso_forest.fit_predict(features_scaled)
        scores = iso_forest.score_samples(features_scaled)

        anomalies = []
        for i, (pred, score) in enumerate(zip(predictions, scores)):
            if pred == -1:
                trans = trans_list[i]
                trans.is_anomaly = True
                trans.anomaly_score = abs(score) * 10

                severity = 'high' if abs(score) > 0.5 else 'medium' if abs(score) > 0.3 else 'low'

                alert = AnomalyAlert(
                    transaction_id=trans.id,
                    reason="ML model detected unusual pattern in transaction",
                    severity=severity,
                    anomaly_score=trans.anomaly_score
                )
                anomalies.append(alert)

        await db.commit()
        return anomalies

    @staticmethod
    async def get_anomaly_summary(db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(
            select(Transaction)
            .where(Transaction.is_anomaly == True)
            .order_by(Transaction.anomaly_score.desc())
        )
        anomalous_transactions = result.scalars().all()

        total_anomalies = len(anomalous_transactions)
        if total_anomalies == 0:
            return {
                'total_anomalies': 0,
                'total_anomaly_amount': 0,
                'average_anomaly_score': 0,
                'top_anomalies': []
            }

        total_amount = sum(t.amount for t in anomalous_transactions)
        avg_score = np.mean([t.anomaly_score for t in anomalous_transactions])

        top_anomalies = []
        for trans in anomalous_transactions[:10]:
            top_anomalies.append({
                'id': trans.id,
                'date': trans.date,
                'merchant': trans.merchant,
                'amount': trans.amount,
                'category': trans.category,
                'anomaly_score': trans.anomaly_score
            })

        return {
            'total_anomalies': total_anomalies,
            'total_anomaly_amount': total_amount,
            'average_anomaly_score': avg_score,
            'top_anomalies': top_anomalies
        }