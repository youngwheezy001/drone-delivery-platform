import os

class Settings:
    # Using asyncpg for high-performance asynchronous database operations
    DATABASE_URL = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./drone_mission_control.db"
    )

settings = Settings()