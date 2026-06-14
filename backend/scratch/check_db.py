import asyncio
from sqlalchemy import text
from app.models.database import AsyncSessionLocal

async def check_grid_state():
    async with AsyncSessionLocal() as db:
        print("--- USER ROLES ---")
        users = await db.execute(text("SELECT email, role, is_active FROM users"))
        for u in users.all():
            print(f"User: {u.email} | Role: {u.role} | Active: {u.is_active}")
            
        print("\n--- PRODUCT STATUS ---")
        prods = await db.execute(text("SELECT name, is_active FROM products"))
        for p in prods.all():
            print(f"Product: {p.name} | Active: {p.is_active}")

if __name__ == "__main__":
    asyncio.run(check_grid_state())
