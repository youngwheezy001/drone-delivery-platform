import asyncio
from sqlalchemy import text
from app.models.database import AsyncSessionLocal

async def fix_images():
    async with AsyncSessionLocal() as db:
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/pizza' WHERE name LIKE '%Pizza%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/burger' WHERE name LIKE '%Burger%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/salad' WHERE name LIKE '%Salad%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/fries' WHERE name LIKE '%Fries%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/cake' WHERE name LIKE '%Cake%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/soda' WHERE name LIKE '%Coke%' OR name LIKE '%Soda%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/medicine' WHERE name LIKE '%Medicine%' OR name LIKE '%Insulin%' OR name LIKE '%Antibiotic%' OR name LIKE '%Venom%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/medical' WHERE name LIKE '%Gauze%' OR name LIKE '%Bandage%' OR name LIKE '%Kit%' OR name LIKE '%Blood%'"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/technology' WHERE category_id IN (SELECT id FROM categories WHERE name = 'Electronics')"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/industrial' WHERE category_id IN (SELECT id FROM categories WHERE name = 'Industrial')"))
        await db.execute(text("UPDATE products SET image_url = 'https://loremflickr.com/600/400/logistics' WHERE category_id IN (SELECT id FROM categories WHERE name = 'Logistics')"))
        await db.commit()
        print("Images updated successfully!")

if __name__ == "__main__":
    asyncio.run(fix_images())
