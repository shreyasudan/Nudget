from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.routers import transactions, subscriptions, anomalies, goals

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Nudget - Smart Financial Coach API",
    description="API for personal finance management with subscription detection and anomaly detection",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(subscriptions.router)
app.include_router(anomalies.router)
app.include_router(goals.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Nudget API",
        "docs": "/docs",
        "health": "ok"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "nudget-api"}