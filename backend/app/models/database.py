import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

from app.core.config import settings

# 2. Fetch the Database URL from the centralized settings
DATABASE_URL = settings.DATABASE_URL

# 3. SQLAlchemy Async Engine requires a specific 'postgresql+asyncpg' prefix
if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
    # Convert standard Postgres URL to Async Postgres URL
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if "?" not in DATABASE_URL:
    DATABASE_URL += "?ssl=require"
elif "ssl=" not in DATABASE_URL:
    DATABASE_URL += "&ssl=require"

# 4. Spin up the Cloud Engine with High-Performance Pooling
if DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        DATABASE_URL, 
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_async_engine(
        DATABASE_URL, 
        echo=False,
        pool_size=20,           # Tactical capacity for concurrent mobile uplinks
        max_overflow=10,        # Emergency overflow during surge traffic
        pool_timeout=30,        # Standard grid timeout
        pool_pre_ping=True,     # Proactive health check for stale connections
        connect_args={"statement_cache_size": 0}
    )

# 5. Continuous Session Factory
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    """Yields a secure database session for each API request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()