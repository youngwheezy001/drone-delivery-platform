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
from app.services.notifications import send_push_notification

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
    is_rugged_terrain: bool = False

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

class P2PDeliveryRequest(BaseModel):
    customer_id: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    package_weight_kg: float
    is_rugged_terrain: bool = False

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

from app.services.mission_service import mission_service

@router.post("/plan", response_model=DeliveryResponse)
async def plan_delivery_route(
    request: DeliveryRequest, 
    current_user: User = Depends(get_current_user)
):
    if request.package_weight_kg > 2.0:
        raise HTTPException(status_code=400, detail="Payload exceeds maximum 2.0kg limit.")

    try:
        # Pass to mission service for planning (internal logic)
        start = (HQ_LAT, HQ_LON)
        goal = (request.destination_lat, request.destination_lon)
        outbound_path = await planner.calculate_optimal_path(start, goal, NAIROBI_OBSTACLES)
        
        if not outbound_path:
            raise HTTPException(status_code=422, detail="No viable path found.")

        outbound_distance = sum(planner.haversine(outbound_path[i][0], outbound_path[i][1], outbound_path[i+1][0], outbound_path[i+1][1]) for i in range(len(outbound_path)-1))
        eta_minutes = round((outbound_distance / 60.0) * 60, 1)

        return DeliveryResponse(
            status="PLANNING_READY",
            estimated_distance_km=round(outbound_distance, 2),
            eta_minutes=eta_minutes,
            route_waypoints=outbound_path + outbound_path[::-1]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/authorize", response_model=AuthorizeResponse)
async def authorize_mission(
    request: DeliveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Refactored: Delegate to MissionService Domain Master."""
    try:
        new_delivery = await mission_service.authorize_mission(
            db=db,
            customer_id=request.customer_id,
            destination=(request.destination_lat, request.destination_lon),
            package_weight=request.package_weight_kg,
            scheduled_at=request.scheduled_at,
            company_id=request.company_id,
            is_rugged_terrain=request.is_rugged_terrain
        )
        return AuthorizeResponse(
            delivery_id=new_delivery.id,
            status="MISSION_LOCKED"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategic failure: {str(e)}")

@router.post("/p2p", response_model=AuthorizeResponse)
async def create_p2p_mission(
    request: P2PDeliveryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AVENUE 2: Peer-to-Peer Courier Network"""
    try:
        path = await planner.calculate_optimal_path(
            (request.origin_lat, request.origin_lon), 
            (request.destination_lat, request.destination_lon), 
            NAIROBI_OBSTACLES
        )
        if not path:
             raise ValueError("P2P synchronization failed: No viable path found.")

        outbound_distance = sum(planner.haversine(path[i][0], path[i][1], path[i+1][0], path[i+1][1]) for i in range(len(path)-1))
        
        from app.services.pricing_engine import pricing_engine
        # Base pricing for P2P (using 0 active count for simplicity, or we could calculate it)
        pricing = pricing_engine.calculate_mission_cost(outbound_distance, 0, 0.0)

        new_delivery = DeliveryRecord(
            customer_id=request.customer_id,
            company_id="Tustar_Courier",
            status="PREPARING",
            origin_lat=request.origin_lat,
            origin_lon=request.origin_lon,
            destination_lat=request.destination_lat,
            destination_lon=request.destination_lon,
            package_weight_kg=request.package_weight_kg,
            distance_km=round(outbound_distance, 3), 
            route_json=path, 
            estimated_cost=pricing['total_yield'],
            is_p2p=True
        )
        
        db.add(new_delivery)
        await db.commit()
        await db.refresh(new_delivery)
        
        from app.services.airspace_registry import airspace_registry
        airspace_registry.reserve_path(str(new_delivery.id), path, datetime.now())
        
        return AuthorizeResponse(
            delivery_id=new_delivery.id,
            status="MISSION_LOCKED"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategic failure: {str(e)}")

@router.get("/queue/scheduled", response_model=List[dict])
async def get_scheduled_missions(db: AsyncSession = Depends(get_db)):
    """Refactored: Delegate queue assessment to MissionService."""
    return await mission_service.get_scheduled_queue(db)

@router.post("/queue/batch-dispatch")
async def batch_dispatch_missions(
    request: List[str], # List of IDs
    db: AsyncSession = Depends(get_db)
):
    """🚀 MASS DISPATCH: Promote multiple scheduled missions to active status."""
    result = await db.execute(
        select(DeliveryRecord)
        .where(DeliveryRecord.id.in_(request))
        .where(DeliveryRecord.status == "SCHEDULED")
    )
    missions = result.scalars().all()
    
    count = 0
    for m in missions:
        m.status = "DISPATCHED"
        count += 1
    
    await db.commit()
    return {"status": "success", "promoted_count": count}

@router.post("/queue/process")
async def process_dispatch_queue(db: AsyncSession = Depends(get_db)):
    count = await mission_service.process_queue(db)
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
        
    old_status = delivery.status
    delivery.status = request.status
    await db.commit()
    
    # 📲 PUSH NOTIFICATION TRIGGER
    if old_status != request.status and request.status in ["DISPATCHED", "ARRIVED"]:
        user_res = await db.execute(select(User).where(User.id == delivery.customer_id))
        customer = user_res.scalars().first()
        if customer and customer.expo_push_token:
            title = "📦 Delivery Dispatched!" if request.status == "DISPATCHED" else "🛬 Delivery Arrived!"
            body = "Your Tustar drone has taken off and is en route!" if request.status == "DISPATCHED" else "Your drone is hovering above the drop zone. Please collect your package."
            import asyncio
            asyncio.create_task(send_push_notification(customer.expo_push_token, title, body))
            
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

@router.post("/{delivery_id}/takeoff-clearance")
async def clear_for_takeoff(delivery_id: str, db: AsyncSession = Depends(get_db)):
    """
    Called by the Ground Crew Operator App after physically loading the drone.
    Promotes the mission from PREPARING -> DISPATCHED and releases it to the Auto-Dispatcher.
    """
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = result.scalars().first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if delivery.status not in ["SCHEDULED", "PREPARING", "READY"]:
        raise HTTPException(status_code=400, detail=f"Cannot clear for takeoff from status {delivery.status}")
        
    old_status = delivery.status
    delivery.status = "DISPATCHED"
    await db.commit()
    
    # Trigger Customer Push Notification
    user_res = await db.execute(select(User).where(User.id == delivery.customer_id))
    customer = user_res.scalars().first()
    if customer and customer.expo_push_token:
        title = "📦 Delivery Dispatched!"
        body = "Your Tustar drone has taken off and is en route! Keep an eye on the sky."
        import asyncio
        from app.services.notifications import send_push_notification
        asyncio.create_task(send_push_notification(customer.expo_push_token, title, body))
            
    return {"message": "Drone Cleared For Takeoff", "delivery_id": delivery_id}

@router.post("/{delivery_id}/optical-sync")
async def optical_sync_delivery(delivery_id: str, db: AsyncSession = Depends(get_db)):
    """
    Called by the Customer App when the drone is hovering above the drop zone.
    The customer scans a QR or presses 'Sync' to authorize the payload release.
    """
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = result.scalars().first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if delivery.status != "ARRIVED_AT_DROPZONE":
        raise HTTPException(status_code=400, detail=f"Drone is not at drop zone. Current status: {delivery.status}")
        
    delivery.status = "DELIVERED"
    
    # AWARD TUSTAR TOKENS (FinTech 2.0 Gamification)
    user_res = await db.execute(select(User).where(User.id == delivery.customer_id))
    customer = user_res.scalars().first()
    if customer:
        customer.tustar_tokens += 10
        
    await db.commit()
    
    return {"message": "Optical Sync Confirmed. Payload Released. +10 TT Earned!", "status": "DELIVERED"}

class RerouteRequest(BaseModel):
    new_lat: float
    new_lon: float

@router.post("/{delivery_id}/reroute")
async def reroute_delivery(delivery_id: str, req: RerouteRequest, db: AsyncSession = Depends(get_db)):
    """
    PHASE 14: Mid-Air Destination Rerouting.
    Hot-swaps the destination of an active flight.
    """
    result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
    delivery = result.scalars().first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if delivery.status not in ["DISPATCHED", "EN_ROUTE"]:
        raise HTTPException(status_code=400, detail=f"Cannot reroute from status {delivery.status}. Must be in-flight.")
        
    # Update DB
    delivery.destination_lat = req.new_lat
    delivery.destination_lon = req.new_lon
    
    # Update PostGIS representation
    delivery.destination_location = f"SRID=4326;POINT({req.new_lon} {req.new_lat})"
    
    await db.commit()
    
    # Signal Telemetry Loop to Hot-Swap Path
    from app.api.v1.endpoints.telemetry import active_reroutes
    active_reroutes[delivery_id] = (req.new_lat, req.new_lon)
    
    return {"message": "Reroute command transmitted to Swarm Orchestrator."}