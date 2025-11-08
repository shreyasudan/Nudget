from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime
from app.database import get_db
from app.schemas import (
    TransactionResponse, TransactionCreate, SpendingOverview,
    FileUploadResponse
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.post("/upload", response_model=FileUploadResponse)
async def upload_transactions(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['csv', 'json']:
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")

    try:
        content = await file.read()
        content_str = content.decode('utf-8')

        if file_extension == 'csv':
            transactions = await TransactionService.parse_csv(content_str)
        else:
            transactions = await TransactionService.parse_json(content_str)

        count = await TransactionService.bulk_create(db, transactions)

        return FileUploadResponse(
            message=f"Successfully imported {count} transactions",
            transactions_imported=count
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    transactions = await TransactionService.get_all(db, skip=skip, limit=limit)
    return transactions

@router.get("/date-range", response_model=List[TransactionResponse])
async def get_transactions_by_date(
    start_date: datetime,
    end_date: datetime,
    db: AsyncSession = Depends(get_db)
):
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    transactions = await TransactionService.get_by_date_range(db, start_date, end_date)
    return transactions

@router.get("/overview", response_model=SpendingOverview)
async def get_spending_overview(db: AsyncSession = Depends(get_db)):
    overview = await TransactionService.get_spending_overview(db)
    return overview

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    new_transaction = await TransactionService.bulk_create(db, [transaction.dict()])
    if new_transaction:
        result = await TransactionService.get_all(db, skip=0, limit=1)
        return result[0]
    raise HTTPException(status_code=400, detail="Failed to create transaction")