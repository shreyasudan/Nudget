from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionBase(BaseModel):
    date: datetime
    amount: float = Field(..., gt=0)
    merchant: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    transaction_type: TransactionType = TransactionType.expense

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[datetime] = None
    amount: Optional[float] = Field(None, gt=0)
    merchant: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    transaction_type: Optional[TransactionType] = None

class TransactionResponse(TransactionBase):
    id: int
    is_recurring: bool = False
    is_anomaly: bool = False
    anomaly_score: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    deadline: datetime
    description: Optional[str] = None

    @validator('deadline')
    def deadline_must_be_future(cls, v):
        # Handle both timezone-aware and naive datetimes
        now = datetime.now()
        # If v is timezone-aware, make now timezone-aware too
        if v.tzinfo is not None and v.tzinfo.utcoffset(v) is not None:
            from datetime import timezone
            now = datetime.now(timezone.utc)
        # If v is naive, compare with naive now (already set above)
        if v <= now:
            raise ValueError('Deadline must be in the future')
        return v

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class GoalResponse(GoalBase):
    id: int
    current_amount: float = 0.0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    progress_percentage: float = 0.0
    days_remaining: int = 0

    class Config:
        from_attributes = True

    @validator('progress_percentage', always=True)
    def calculate_progress(cls, v, values):
        if 'target_amount' in values and 'current_amount' in values:
            return min((values['current_amount'] / values['target_amount']) * 100, 100)
        return 0.0

    @validator('days_remaining', always=True)
    def calculate_days(cls, v, values):
        if 'deadline' in values:
            delta = values['deadline'] - datetime.now()
            return max(delta.days, 0)
        return 0

class RecurringChargeResponse(BaseModel):
    id: int
    merchant: str
    average_amount: float
    frequency_days: int
    last_charge_date: Optional[datetime]
    next_expected_date: Optional[datetime]
    category: Optional[str]
    is_active: bool = True
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class SpendingOverview(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    categories: Dict[str, float]
    current_month_categories: Dict[str, float]
    monthly_trend: List[Dict[str, Any]]

class AnomalyAlert(BaseModel):
    transaction_id: int
    reason: str
    severity: str
    anomaly_score: float

class FileUploadResponse(BaseModel):
    message: str
    transactions_imported: int
    errors: List[str] = []

class BudgetBase(BaseModel):
    category: Optional[str] = Field(None, max_length=100)  # None for overall budget
    amount_monthly: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=10)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = Field(None, max_length=100)
    amount_monthly: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    is_active: Optional[bool] = None

class BudgetResponse(BudgetBase):
    id: str
    user_id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetUsage(BaseModel):
    budget_id: str
    category: Optional[str]
    budgeted_amount: float
    spent_amount: float
    remaining_amount: float
    percent_used: float
    status: str  # "ok", "warning", "danger"
    currency: str

class AlertType(str, Enum):
    ANOMALY = "ANOMALY"
    BUDGET_WARNING = "BUDGET_WARNING"
    GOAL_PROGRESS = "GOAL_PROGRESS"
    SUMMARY = "SUMMARY"
    SUBSCRIPTION_REMINDER = "SUBSCRIPTION_REMINDER"
    GRAY_CHARGE = "GRAY_CHARGE"

class AlertBase(BaseModel):
    type: AlertType
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    metadata: Optional[Dict[str, Any]] = None

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: str
    user_id: str
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class MarkAlertsReadRequest(BaseModel):
    ids: List[str]

class DashboardOverview(BaseModel):
    summary: Dict[str, float]  # total_income, total_expenses, net_savings
    income_vs_expenses: List[Dict[str, Any]]
    spending_by_category: List[Dict[str, Any]]
    budget_usage: List[BudgetUsage]
    recent_alerts: List[AlertResponse]