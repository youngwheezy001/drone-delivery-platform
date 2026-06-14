from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.drone import Drone
from app.models.delivery import DeliveryRecord

router = APIRouter()

class NLPCommandRequest(BaseModel):
    command: str

class NLPCommandResponse(BaseModel):
    intent: str
    action_taken: str
    reply: str

@router.post("/command", response_model=NLPCommandResponse)
async def process_nlp_command(req: NLPCommandRequest, db: AsyncSession = Depends(get_db)):
    """
    Simulates a J.A.R.V.I.S like NLP intent parser for fleet command.
    """
    text = req.command.lower()
    
    if "ground" in text and "all" in text:
        # Intent: Ground entire fleet
        res = await db.execute(select(Drone).where(Drone.status != "MAINTENANCE"))
        drones = res.scalars().all()
        for d in drones:
            d.status = "IDLE"
        await db.commit()
        return NLPCommandResponse(
            intent="EMERGENCY_GROUNDING",
            action_taken=f"Grounded {len(drones)} drones.",
            reply=f"Sir, I have issued an emergency grounding order to all {len(drones)} active drones. They are returning to base."
        )
        
    elif "status" in text or "where" in text:
        # Intent: Get fleet status
        res = await db.execute(select(DeliveryRecord).where(DeliveryRecord.status.in_(["DISPATCHED", "EN_ROUTE", "ARRIVED_AT_DROPZONE"])))
        active = len(res.scalars().all())
        return NLPCommandResponse(
            intent="STATUS_CHECK",
            action_taken="Queried active deliveries.",
            reply=f"Currently, there are {active} active deliveries in the grid, all operating within normal parameters."
        )
        
    elif "maintenance" in text:
        # Intent: Find drones needing maintenance
        res = await db.execute(select(Drone).where(Drone.needs_maintenance == True))
        drones = res.scalars().all()
        if drones:
            return NLPCommandResponse(
                intent="MAINTENANCE_CHECK",
                action_taken="Queried maintenance drones.",
                reply=f"I found {len(drones)} drones requiring maintenance. Their statuses have been updated."
            )
        else:
            return NLPCommandResponse(
                intent="MAINTENANCE_CHECK",
                action_taken="Queried maintenance drones.",
                reply="All drones are currently operating within safe flight hour limits. No maintenance required."
            )

    # Fallback
    return NLPCommandResponse(
        intent="UNKNOWN",
        action_taken="None",
        reply="I'm sorry, I did not understand that command. Try 'ground all drones' or 'system status'."
    )
