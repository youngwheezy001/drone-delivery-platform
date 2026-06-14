import asyncio
from sqlalchemy import text
from app.models.database import AsyncSessionLocal

async def check_grid():
    async with AsyncSessionLocal() as db:
        users = await db.execute(text("SELECT email, role, is_active FROM users"))
        print("\n--- USERS ---")
        for u in users:
            print(u)
            
        prods = await db.execute(text("SELECT name, seller_id, is_active FROM products"))
        print("\n--- PRODUCTS ---")
        for p in prods:
            print(p)

if __name__ == "__main__":
    asyncio.run(check_grid())
