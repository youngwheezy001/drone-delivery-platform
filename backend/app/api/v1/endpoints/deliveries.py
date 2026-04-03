from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.services.a_star_planner import FlightPathPlanner
from app.models.database import get_db
from app.models.delivery import DeliveryRecord
from app.models.user import User
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter()
planner = FlightPathPlanner()

HQ_LAT = settings.HQ_LAT
HQ_LON = settings.HQ_LON

class DeliveryRequest(BaseModel):
    customer_id: str
    company_id: str = "Megascript Digital"
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    package_weight_kg: float
    scheduled_at: Optional[datetime] = None # NEW: Scheduling support

class DeliveryResponse(BaseModel):
    status: str
    estimated_distance_km: float
    eta_minutes: float 
    route_waypoints: List[Tuple[float, float]]

class AuthorizeResponse(BaseModel):
    delivery_id: str
    status: str

class StatusUpdateRequest(BaseModel):
    status: str

NAIROBI_OBSTACLES = settings.NO_FLY_ZONES

@router.post("/plan", response_model=DeliveryResponse)
async def plan_delivery_route(
    request: DeliveryRequest, 
    current_user: User = Depends(get_current_user)
):
    if request.package_weight_kg > 2.0:
        raise HTTPException(status_code=400, detail="Payload exceeds maximum 2.0kg limit.")

    start = (HQ_LAT, HQ_LON)
    goal = (request.destination_lat, request.destination_lon)
    outbound_path = await planner.calculate_optimal_path(start, goal, NAIROBI_OBSTACLES)
    
    if not outbound_path:
        raise HTTPException(status_code=422, detail="No viable path found avoiding exclusion zones.")

    outbound_distance = sum(planner.haversine(outbound_path[i][0], outbound_path[i][1], outbound_path[i+1][0], outbound_path[i+1][1]) for i in range(len(outbound_path)-1))
    
    cruising_speed_kmh = 60.0 
    eta_minutes = round((outbound_distance / cruising_speed_kmh) * 60, 1)

    return_path = outbound_path[::-1]
    full_mission_path = outbound_path + return_path
    total_round_trip_distance = outbound_distance * 2

    if total_round_trip_distance > 15.0:
        raise HTTPException(status_code=400, detail="Round trip exceeds endurance.")

    return DeliveryResponse(
        status="PLANNING_READY",
        estimated_distance_km=round(outbound_distance, 2),
        eta_minutes=eta_minutes,
        route_waypoints=full_mission_path 
    )

@router.post("/authorize", response_model=AuthorizeResponse)
async def authorize_mission(
    request: DeliveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """🛰️ ATOMIC COMMAND: Persist the authorized mission to the database."""
    start = (HQ_LAT, HQ_LON)
    goal = (request.destination_lat, request.destination_lon)
    
    # Simple path recalculation (or could pass path directly)
    outbound_path = await planner.calculate_optimal_path(start, goal, NAIROBI_OBSTACLES)
    if not outbound_path:
         raise HTTPException(status_code=422, detail="Mission synchronization failed.")

    outbound_distance = sum(planner.haversine(outbound_path[i][0], outbound_path[i][1], outbound_path[i+1][0], outbound_path[i+1][1]) for i in range(len(outbound_path)-1))
    return_path = outbound_path[::-1]
    full_mission_path = outbound_path + return_path
    total_round_trip_distance = outbound_distance * 2

    initial_status = "DISPATCHED"
    if request.scheduled_at:
        now = datetime.now()
        if request.scheduled_at > now + timedelta(minutes=5):
            initial_status = "SCHEDULED"

    new_delivery = DeliveryRecord(
        customer_id=request.customer_id,
        company_id=request.company_id,
        status=initial_status,
        origin_lat=start[0],
        origin_lon=start[1],
        destination_lat=goal[0],
        destination_lon=goal[1],
        package_weight_kg=request.package_weight_kg,
        distance_km=round(total_round_trip_distance, 3), 
        route_json=full_mission_path,
        estimated_cost=100 + (total_round_trip_distance * 50),
        scheduled_at=request.scheduled_at
    )
    
    db.add(new_delivery)
    await db.commit()
    await db.refresh(new_delivery)

    return AuthorizeResponse(
        delivery_id=new_delivery.id,
        status="MISSION_LOCKED"
    )

@router.get("/queue/scheduled", response_model=List[dict])
async def get_scheduled_missions(db: AsyncSession = Depends(get_db)):
    """Fetch all upcoming missions for the logistics queue. 🛰️📅"""
    result = await db.execute(
        select(DeliveryRecord)
        .where(DeliveryRecord.status == "SCHEDULED")
        .order_by(DeliveryRecord.scheduled_at.asc())
    )
    missions = result.scalars().all()
    return [{
        "id": m.id,
        "customer": m.customer_id,
        "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
        "weight": m.package_weight_kg,
        "hub": m.company_id
    } for m in missions]

@router.post("/queue/process")
async def process_dispatch_queue(db: AsyncSession = Depends(get_db)):
    """ADMIN: Automatically promote scheduled missions to packing status. 🛰️🚀"""
    now = datetime.now()
    # Promote missions scheduled for the next 15 minutes
    threshold = now + timedelta(minutes=15)
    
    result = await db.execute(
        select(DeliveryRecord)
        .where(DeliveryRecord.status == "SCHEDULED")
        .where(DeliveryRecord.scheduled_at <= threshold)
    )
    missions = result.scalars().all()
    
    count = 0
    for m in missions:
        m.status = "DISPATCHED"
        count += 1
    
    await db.commit()
    return {"status": "success", "promoted_count": count}

@router.get("/history/{customer_id}")
async def get_delivery_history(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.customer_id == customer_id).order_by(DeliveryRecord.created_at.desc()).limit(10))
    deliveries = result.scalars().all()
    return [{
        "id": d.id, 
        "status": d.status, 
        "distance_km": d.distance_km, 
        "weight": d.package_weight_kg, 
        "date": d.created_at.strftime("%b %d, %Y - %H:%M") if d.created_at else "Unknown",
        "scheduled_at": d.scheduled_at.isoformat() if d.scheduled_at else None,
        "route": d.route_json
    } for d in deliveries]

@router.get("/seller/active")
async def get_active_orders_for_seller(company_id: Optional[str] = "ALL_NETWORK", db: AsyncSession = Depends(get_db)):
    # Include SCHEDULED in the seller view so they can see upcoming demand
    query = select(DeliveryRecord).where(DeliveryRecord.status.in_(["SCHEDULED", "DISPATCHED", "PREPARING", "READY"]))
    if company_id and company_id != "ALL_NETWORK":
        query = query.where(DeliveryRecord.company_id == company_id)
    query = query.order_by(DeliveryRecord.scheduled_at.asc() if DeliveryRecord.scheduled_at else DeliveryRecord.created_at.asc())
    result = await db.execute(query)
    deliveries = result.scalars().all()
    return [{
        "id": d.id, 
        "status": d.status, 
        "distance_km": d.distance_km, 
        "weight": d.package_weight_kg, 
        "customer_id": d.customer_id, 
        "scheduled_at": d.scheduled_at.isoformat() if d.scheduled_at else None,
        "time_elapsed": "Live"
    } for d in deliveries]

@router.patch("/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, request: StatusUpdateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = result.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Order not found")
    delivery.status = request.status
    await db.commit()
    return {"message": "Status updated successfully", "new_status": delivery.status}

@router.get("/seller/stats")
async def get_seller_metrics(company_id: Optional[str] = "ALL_NETWORK", db: AsyncSession = Depends(get_db)):
    query = select(DeliveryRecord)
    if company_id and company_id != "ALL_NETWORK":
        query = query.where(DeliveryRecord.company_id == company_id)
    result = await db.execute(query)
    all_deliveries = result.scalars().all()
    
    total_flights = len([d for d in all_deliveries if d.status != "SCHEDULED"])
    valid_statuses = ["IN_FLIGHT", "COMPLETED", "DELIVERED", "READY"]
    revenue = sum([4500 for d in all_deliveries if d.status in valid_statuses])
    
    active_count = len([d for d in all_deliveries if d.status in ["DISPATCHED", "PREPARING"]])
    avg_prep_seconds = 120 + (active_count * 15)
    
    return {"flightsToday": total_flights, "revenueToday": f"{revenue:,}", "avgPrepTime": f"{avg_prep_seconds // 60}m {avg_prep_seconds % 60}s"}