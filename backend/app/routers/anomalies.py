from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas import AnomalyAlert
from app.services.anomaly_detector import AnomalyDetector

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

@router.post("/detect", response_model=List[AnomalyAlert])
async def detect_anomalies(
    use_ml: bool = False,
    db: AsyncSession = Depends(get_db)
):
    try:
        if use_ml:
            anomalies = await AnomalyDetector.detect_anomalies_ml(db)
        else:
            anomalies = await AnomalyDetector.detect_anomalies(db)

        return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect anomalies: {str(e)}")

@router.get("/summary")
async def get_anomaly_summary(db: AsyncSession = Depends(get_db)):
    summary = await AnomalyDetector.get_anomaly_summary(db)
    return summary