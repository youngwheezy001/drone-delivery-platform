import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Load the secrets from the .env file
load_dotenv() 

# 2. Fetch the Supabase URL (Falls back to local SQLite if you forget the .env)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./drone_mission_control.db")

# 3. SQLAlchemy Async Engine requires a specific 'postgresql+asyncpg' prefix
if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
    # Convert standard Postgres URL to Async Postgres URL
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# 4. Spin up the Cloud Engine
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    """Yields a secure database session for each API request."""
    async with AsyncSessionLocal() as session:
        yield session