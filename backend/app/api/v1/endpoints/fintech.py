from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.database import get_db
from app.models.ledger import Transaction
from app.models.delivery import DeliveryRecord
from app.models.user import User
from app.services.mpesa import MpesaClient
from typing import List
import time

router = APIRouter()

def calculate_dynamic_pricing(distance_km: float, weight_kg: float):
    """
    Core algorithm for calculating delivery fees dynamically based on distance and load.
    Base Fee: 100 KES
    Distance Fee: 50 KES per km
    Weight Fee: 50 KES per kg
    """
    base_fee = 100.0
    distance_fee = distance_km * 50.0
    weight_fee = weight_kg * 50.0
    
    total_cost = base_fee + distance_fee + weight_fee
    
    # Calculate Platform Commission (Tustar HQ)
    # Base is 10%, but if it's heavy (> 2kg), charge an extra 2.5% for structural load wear
    commission_rate = 0.125 if weight_kg > 2.0 else 0.10
    platform_fee = total_cost * commission_rate
    partner_payout = total_cost - platform_fee
    
    return round(total_cost, 2), round(platform_fee, 2), round(partner_payout, 2)

@router.post("/checkout/{delivery_id}")
async def checkout_delivery(delivery_id: str, phone_number: str, db: AsyncSession = Depends(get_db)):
    """
    Executes a checkout. Charges the customer via M-Pesa Daraja, calculates the dynamic split,
    and creates a PENDING transaction.
    """
    # 1. Fetch the delivery record
    res_del = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = res_del.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery mission not found")
        
    # Check if already paid
    res_txn = await db.execute(select(Transaction).where(Transaction.delivery_id == delivery_id))
    existing_txn = res_txn.scalars().first()
    if existing_txn and existing_txn.status == "CLEARED":
        return {"status": "Already paid", "transaction_id": existing_txn.id}
        
    # 2. Calculate dynamic pricing based on PostGIS distance & load
    total_cost, platform_fee, partner_payout = calculate_dynamic_pricing(
        distance_km=delivery.distance_km, 
        weight_kg=delivery.package_weight_kg
    )
    
    # 3. Real M-Pesa STK Push
    try:
        mpesa_client = MpesaClient()
        # Daraja needs integer amount
        daraja_res = await mpesa_client.initiate_stk_push(
            phone_number=phone_number,
            amount=int(total_cost),
            account_reference=delivery_id[:12],
            transaction_desc="Tustar Delivery Payment"
        )
        checkout_request_id = daraja_res.get("CheckoutRequestID")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"M-Pesa API Error: {str(e)}")
        
    # 4. Generate the immutable ledger transaction (PENDING)
    transaction = Transaction(
        delivery_id=delivery.id,
        customer_id=delivery.customer_id,
        partner_id=delivery.company_id, # Linking revenue directly to the seller's multi-tenant ID
        total_amount_kes=total_cost,
        partner_payout_kes=partner_payout,
        platform_fee_kes=platform_fee,
        status="PENDING",
        checkout_request_id=checkout_request_id
    )
    
    db.add(transaction)
    
    # Update delivery estimated cost (for historical tracking)
    delivery.estimated_cost = total_cost
    
    await db.commit()
    await db.refresh(transaction)
    
    return {
        "status": "Payment Initiated. Enter PIN.",
        "transaction_id": transaction.id,
        "checkout_request_id": checkout_request_id,
        "total_charged": total_cost
    }

@router.get("/transaction/{delivery_id}")
async def get_transaction_status(delivery_id: str, db: AsyncSession = Depends(get_db)):
    """Frontend polling endpoint to check if Daraja callback cleared the txn, or query Daraja directly."""
    res_txn = await db.execute(select(Transaction).where(Transaction.delivery_id == delivery_id))
    txn = res_txn.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # If still PENDING, query Daraja directly as a fallback to webhooks
    if txn.status == "PENDING" and txn.checkout_request_id:
        try:
            mpesa_client = MpesaClient()
            status_res = await mpesa_client.check_stk_status(txn.checkout_request_id)
            
            # ResultCode 0 means Success. 
            # If ResultCode exists and is not 0, it means it failed/cancelled.
            # If "errorCode" is in response, it might mean the request is still processing.
            if "ResultCode" in status_res:
                result_code = str(status_res["ResultCode"])
                if result_code == "0":
                    txn.status = "CLEARED"
                else:
                    txn.status = "FAILED"
                await db.commit()
        except Exception:
            pass # Ignore errors and let it remain PENDING
            
    return {"status": txn.status}

@router.post("/mpesa-callback")
async def mpesa_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receives asynchronous callback from Safaricom Daraja."""
    payload = await request.json()
    try:
        stk_callback = payload["Body"]["stkCallback"]
        checkout_request_id = stk_callback["CheckoutRequestID"]
        result_code = stk_callback["ResultCode"]
        
        # Find pending transaction
        res_txn = await db.execute(select(Transaction).where(Transaction.checkout_request_id == checkout_request_id))
        txn = res_txn.scalars().first()
        
        if txn:
            if result_code == 0:
                txn.status = "CLEARED"
            else:
                txn.status = "FAILED"
            await db.commit()
            
    except KeyError:
        pass # Ignore malformed payload
    
    # Daraja expects success acknowledgement
    return {"ResultCode": 0, "ResultDesc": "Accepted"}

@router.get("/ledger/{partner_id}")
async def get_partner_ledger(partner_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves live earnings for a specific partner/seller."""
    # Sum up all CLEARED transactions for this partner
    res_earnings = await db.execute(
        select(func.sum(Transaction.partner_payout_kes))
        .where(Transaction.partner_id == partner_id, Transaction.status == "CLEARED")
    )
    total_earnings = res_earnings.scalar() or 0.0
    
    # Get last 10 transactions
    res_txns = await db.execute(
        select(Transaction)
        .where(Transaction.partner_id == partner_id, Transaction.status == "CLEARED")
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    recent_txns = res_txns.scalars().all()
    
    # Also sum up total sales volume (what customers paid in total)
    res_vol = await db.execute(
        select(func.sum(Transaction.total_amount_kes))
        .where(Transaction.partner_id == partner_id, Transaction.status == "CLEARED")
    )
    gross_volume = res_vol.scalar() or 0.0
    
    platform_fees_paid = gross_volume - total_earnings
    
    return {
        "gross_volume_kes": round(gross_volume, 2),
        "net_earnings_kes": round(total_earnings, 2),
        "platform_fees_paid_kes": round(platform_fees_paid, 2),
        "recent_transactions": [
            {
                "id": t.id,
                "amount": t.total_amount_kes,
                "payout": t.partner_payout_kes,
                "date": t.created_at
            } for t in recent_txns
        ]
    }

@router.get("/platform-revenue")
async def get_platform_revenue(db: AsyncSession = Depends(get_db)):
    """Retrieves live global Tustar HQ revenue (Yield Matrix)."""
    # Sum of all platform fees collected globally
    res_rev = await db.execute(select(func.sum(Transaction.platform_fee_kes)).where(Transaction.status == "CLEARED"))
    total_revenue = res_rev.scalar() or 0.0
    
    res_vol = await db.execute(select(func.sum(Transaction.total_amount_kes)).where(Transaction.status == "CLEARED"))
    total_volume = res_vol.scalar() or 0.0
    
    res_count = await db.execute(select(func.count(Transaction.id)).where(Transaction.status == "CLEARED"))
    tx_count = res_count.scalar() or 0
    
    return {
        "global_gross_volume_kes": round(total_volume, 2),
        "tustar_hq_revenue_kes": round(total_revenue, 2),
        "total_network_transactions": tx_count
    }
