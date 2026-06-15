import asyncio
import os
from app.models.database import engine, Base
from passlib.context import CryptContext
from sqlalchemy import text

async def sync_database():
    print('Initiating Database Synchronization Sequence...')
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print('Core Tables Verified.')
    
    pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')
    partners = [
        ('admin@tustar.io', 'tustar123', 'TUSTAR CENTRAL HUB', 'TUSTAR_HQ', 'SELLER'),
        ('lewis@megascript.com', 'megascript001', 'MEGASCRIPT LOGISTICS', 'MEGASCRIPT_HUB', 'SELLER'),
        ('global@cargo.net', 'cargo777', 'GLOBAL CARGO NODE', 'GLOBAL_CARGO', 'SELLER')
    ]
    
    async with engine.begin() as conn:
        for email, pin, name, cid, role in partners:
            result = await conn.execute(text('SELECT id FROM users WHERE email = :email'), {'email': email})
            if not result.fetchone():
                user_id = f'user_{cid.lower()}'
                hashed_pw = pwd_context.hash(pin)
                await conn.execute(
                    text("INSERT INTO users (id, email, hashed_password, full_name, company_id, role, is_active) VALUES (:id, :email, :pw, :name, :cid, :role, TRUE)"),
                    {'id': user_id, 'email': email, 'pw': hashed_pw, 'name': name, 'cid': cid, 'role': role}
                )
                print(f'Seeded {email}')
        print('Partner ecosystem provisioned.')

if __name__ == '__main__':
    asyncio.run(sync_database())
