from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from app.api.v1.endpoints import deliveries, telemetry
from app.models.database import engine, Base
from app.models.delivery import DeliveryRecord

# This ensures the database tables are created when the server starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # Note: In a production app, use Alembic migrations instead of create_all
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="Autonomous Drone Delivery API",
    version="1.0.0",
    lifespan=lifespan # Attach the startup logic here
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deliveries.router, prefix="/api/v1/deliveries", tags=["Deliveries"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["Telemetry"])

@app.get("/")
async def root():
    return {"message": "Drone Mission Control API is online."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)