import asyncio
import httpx
import time
from sqlalchemy import select
from app.models.database import AsyncSessionLocal
from app.models.delivery import DeliveryRecord
from app.models.user import User
from app.models.ledger import Transaction
from app.models.marketplace import Product
from app.models.drone import Drone

BACKEND_URL = "http://localhost:8000"

async def simulate_sales():
    print("INFO: [FINTECH ENGINE] Starting live sales simulation...")
    
    async with AsyncSessionLocal() as db:
        # Get all deliveries
        result = await db.execute(select(DeliveryRecord))
        all_deliveries = result.scalars().all()
        
        if not all_deliveries:
            print("WARNING: No deliveries found. Seed the database first.")
            return

        # PATCH: Ensure all deliveries have a valid customer_id and company_id to satisfy Foreign Key constraints
        for delivery in all_deliveries:
            delivery.customer_id = "user_master_admin"
            delivery.company_id = "user_tustar_hq"
        await db.commit()

    print(f"INFO: Found {len(all_deliveries)} missions. Initiating STK Pushes for those without transactions...")

    async with httpx.AsyncClient() as client:
        for delivery in all_deliveries:
            print(f"INFO: Simulating M-Pesa Checkout for Delivery {delivery.id}...")
            
            # Hit the FinTech API
            try:
                response = await client.post(f"{BACKEND_URL}/api/v1/fintech/checkout/{delivery.id}", timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"OK: PAYMENT CLEARED: KES {data['total_charged']}")
                    print(f"    Partner Earns: KES {data['split']['partner_earns']}")
                    print(f"    Tustar HQ Fee: KES {data['split']['tustar_hq_fee']}")
                else:
                    print(f"ERROR: Payment Failed: {response.text}")
            except Exception as e:
                print(f"ERROR: Connection Error: {e}")
                
            # Wait 3-5 seconds between sales to simulate live traffic
            time.sleep(3)

if __name__ == "__main__":
    asyncio.run(simulate_sales())
