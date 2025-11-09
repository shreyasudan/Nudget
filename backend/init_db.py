"""
Initialize database with new tables
Run with: python init_db.py
"""

import asyncio
from app.database import engine, init_db
from app.models import Base

async def main():
    print("Initializing database...")
    try:
        # Initialize database (create tables)
        await init_db()
        print("✓ Database initialized successfully")
        print("✓ Budget and Alert tables created")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    asyncio.run(main())