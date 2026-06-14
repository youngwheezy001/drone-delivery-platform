from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.models.database import get_db
from app.models.user import User
from app.api.v1.endpoints.deliveries import P2PDeliveryRequest
from app.services.a_star_planner import FlightPathPlanner
from app.services.pricing_engine import pricing_engine
from app.services.airspace_registry import airspace_registry
from app.models.delivery import DeliveryRecord
from app.core.config import settings

router = APIRouter()
planner = FlightPathPlanner()

async def get_enterprise_user(x_api_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.api_key == x_api_key))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return user

@router.post("/dispatch")
async def enterprise_dispatch(
    request: P2PDeliveryRequest,
    enterprise: User = Depends(get_enterprise_user),
    db: AsyncSession = Depends(get_db)
):
    """
    B2B Programmatic Dispatch Endpoint.
    Enterprise partners can trigger missions directly without human intervention.
    """
    try:
        path = await planner.calculate_optimal_path(
            (request.origin_lat, request.origin_lon), 
            (request.destination_lat, request.destination_lon), 
            settings.NO_FLY_ZONES
        )
        if not path:
             raise ValueError("Synchronization failed: No viable path found.")

        outbound_distance = sum(planner.haversine(path[i][0], path[i][1], path[i+1][0], path[i+1][1]) for i in range(len(path)-1))
        
        # Enterprise B2B usually has flat-rate contracts, but we'll use base pricing here
        pricing = pricing_engine.calculate_mission_cost(outbound_distance, 0, 0.0)

        new_delivery = DeliveryRecord(
            customer_id=request.customer_id,
            company_id=enterprise.company_id, # Link it to the enterprise!
            status="DISPATCHED", # B2B bypasses PREPARING
            origin_lat=request.origin_lat,
            origin_lon=request.origin_lon,
            destination_lat=request.destination_lat,
            destination_lon=request.destination_lon,
            package_weight_kg=request.package_weight_kg,
            distance_km=round(outbound_distance, 3), 
            route_json=path, 
            estimated_cost=pricing['total_yield'],
            is_p2p=False
        )
        
        db.add(new_delivery)
        await db.commit()
        await db.refresh(new_delivery)
        
        airspace_registry.reserve_path(str(new_delivery.id), path, datetime.now())
        
        return {
            "status": "ACCEPTED",
            "delivery_id": new_delivery.id,
            "estimated_cost": pricing['total_yield'],
            "webhook_target": enterprise.webhook_url or "NONE_REGISTERED"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"B2B Failure: {str(e)}")
