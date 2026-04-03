import asyncio
from mavsdk import System

async def run():
    drone = System()
    # Using 14540 which is the standard SITL port
    print("🛰️ Attempting to intercept drone heartbeat...")
    await drone.connect(system_address="udpin://0.0.0.0:14540")

    print("⏳ Waiting for drone to connect...")
    async for state in drone.core.connection_state():
        if state.is_connected:
            print(f"✅ Drone discovered!")
            break

    print("🌍 Waiting for drone to have a global position estimate...")
    async for health in drone.telemetry.health():
        if health.is_global_position_ok and health.is_home_position_ok:
            print("📍 Global position estimate OK")
            break

    print("-- Arming")
    await drone.action.arm()

    print("-- Taking off")
    await drone.action.set_takeoff_altitude(5.0)
    await drone.action.takeoff()

    await asyncio.sleep(10)

    print("-- Landing")
    await drone.action.land()

if __name__ == "__main__":
    asyncio.run(run())