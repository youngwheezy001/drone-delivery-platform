import asyncio
from sqlalchemy import select
from app.models.database import AsyncSessionLocal
from app.models.user import User
from app.models.marketplace import Product

async def run():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.email=="global@cargo.net"))).scalar_one_or_none()
        if user:
            print(f"Exists! ID: {user.id}, Active: {user.is_active}, Hashed: {bool(user.hashed_password)}")
        else:
            print("Does not exist!")
            
if __name__ == "__main__":
    asyncio.run(run())
