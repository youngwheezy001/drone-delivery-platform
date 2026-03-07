from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.a_star_planner import FlightPathPlanner
from app.models.database import get_db
from app.models.delivery import DeliveryRecord

router = APIRouter()
planner = FlightPathPlanner()

HQ_LAT = -1.2921
HQ_LON = 36.7884

class DeliveryRequest(BaseModel):
    customer_id: str
    company_id: str = "Megascript Digital"
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    package_weight_kg: float

class DeliveryResponse(BaseModel):
    delivery_id: str
    status: str
    estimated_distance_km: float
    eta_minutes: float 
    route_waypoints: List[Tuple[float, float]]

class StatusUpdateRequest(BaseModel):
    status: str

NAIROBI_OBSTACLES = [
    {"name": "JKIA Airport", "lat": -1.319, "lon": 36.927, "radius_km": 5.0},
    {"name": "Wilson Airport", "lat": -1.321, "lon": 36.814, "radius_km": 3.0},
    {"name": "State House", "lat": -1.278, "lon": 36.804, "radius_km": 1.0} 
]

@router.post("/plan", response_model=DeliveryResponse)
async def plan_delivery_route(request: DeliveryRequest, db: AsyncSession = Depends(get_db)):
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

    new_delivery = DeliveryRecord(
        customer_id=request.customer_id,
        company_id=request.company_id,
        status="DISPATCHED",
        origin_lat=start[0],
        origin_lon=start[1],
        destination_lat=goal[0],
        destination_lon=goal[1],
        package_weight_kg=request.package_weight_kg,
        distance_km=round(total_round_trip_distance, 3), 
        route_json=full_mission_path 
    )
    
    db.add(new_delivery)
    await db.commit()
    await db.refresh(new_delivery)

    return DeliveryResponse(
        delivery_id=new_delivery.id,
        status="ROUTE_CALCULATED",
        estimated_distance_km=round(outbound_distance, 2),
        eta_minutes=eta_minutes,
        route_waypoints=full_mission_path 
    )

@router.get("/history/{customer_id}")
async def get_delivery_history(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.customer_id == customer_id).order_by(DeliveryRecord.created_at.desc()).limit(10))
    deliveries = result.scalars().all()
    return [{"id": d.id, "status": d.status, "distance_km": d.distance_km, "weight": d.package_weight_kg, "date": d.created_at.strftime("%b %d, %Y - %H:%M") if d.created_at else "Unknown"} for d in deliveries]

# NEW: The Polling Endpoint for the Customer App!
@router.get("/{delivery_id}")
async def get_single_delivery(delivery_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = result.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"id": delivery.id, "status": delivery.status}

@router.patch("/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, request: StatusUpdateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = result.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Order not found")
    delivery.status = request.status
    await db.commit()
    return {"message": "Status updated successfully", "new_status": delivery.status}

@router.get("/seller/active")
async def get_active_orders_for_seller(company_id: Optional[str] = "ALL_NETWORK", db: AsyncSession = Depends(get_db)):
    query = select(DeliveryRecord).where(DeliveryRecord.status.in_(["DISPATCHED", "PREPARING", "READY"]))
    if company_id and company_id != "ALL_NETWORK":
        query = query.where(DeliveryRecord.company_id == company_id)
    query = query.order_by(DeliveryRecord.created_at.asc())
    result = await db.execute(query)
    deliveries = result.scalars().all()
    return [{"id": d.id, "status": d.status, "distance_km": d.distance_km, "weight": d.package_weight_kg, "customer_id": d.customer_id, "time_elapsed": "Live"} for d in deliveries]

@router.get("/seller/stats")
async def get_seller_metrics(company_id: Optional[str] = "ALL_NETWORK", db: AsyncSession = Depends(get_db)):
    query = select(DeliveryRecord)
    if company_id and company_id != "ALL_NETWORK":
        query = query.where(DeliveryRecord.company_id == company_id)
    result = await db.execute(query)
    all_deliveries = result.scalars().all()
    
    total_flights = len(all_deliveries)
    valid_statuses = ["IN_FLIGHT", "COMPLETED", "DELIVERED", "READY"]
    revenue = sum([4500 for d in all_deliveries if d.status in valid_statuses])
    
    active_count = len([d for d in all_deliveries if d.status in ["DISPATCHED", "PREPARING"]])
    avg_prep_seconds = 120 + (active_count * 15)
    
    return {"flightsToday": total_flights, "revenueToday": f"{revenue:,}", "avgPrepTime": f"{avg_prep_seconds // 60}m {avg_prep_seconds % 60}s"}