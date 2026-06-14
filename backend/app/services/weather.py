import random
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import AsyncSessionLocal
from app.models.weather_log import WeatherLog

# Global cache for the current weather status
_current_weather = {
    "wind_speed_kmh": 15.0,
    "precipitation_mm": 0.0,
    "status": "CLEAR", # CLEAR, RAIN, STORM
    "is_grounded": False,
    "temperature_c": 22.0
}

def get_current_weather():
    """Returns the globally cached weather conditions."""
    return _current_weather

async def poll_weather_api():
    """
    Simulates polling the OpenWeather API every 10 minutes (we use 60s for demo purposes).
    Dynamically fluctuates wind speeds and rain. Occasionally triggers a storm to test grounding.
    """
    global _current_weather
    while True:
        try:
            # 1. Fetch Real Weather Data (Simulated)
            # In production: requests.get(f"https://api.openweathermap.org/data/2.5/weather?q=Nairobi&appid={api_key}")
            
            # Simulate a 5% chance of a severe thunderstorm rolling into Nairobi
            is_storm = random.random() < 0.05
            
            if is_storm:
                wind = random.uniform(40.0, 75.0) # Dangerous winds
                rain = random.uniform(10.0, 50.0) # Heavy rain
                status = "STORM"
            else:
                wind = random.uniform(5.0, 25.0)
                rain = random.uniform(0.0, 2.0)
                status = "CLEAR" if rain < 1.0 else "RAIN"
                
            # Grounding Logic: Wind > 40 km/h OR Rain > 10 mm/h
            is_grounded = wind >= 40.0 or rain >= 10.0
            
            _current_weather.update({
                "wind_speed_kmh": round(wind, 1),
                "precipitation_mm": round(rain, 1),
                "status": status,
                "is_grounded": is_grounded,
                "temperature_c": round(random.uniform(18.0, 28.0), 1)
            })
            
            # 2. Log severe weather to the database if a storm hits
            if is_grounded:
                async with AsyncSessionLocal() as db:
                    log = WeatherLog(
                        storm_lat=-1.2921, # HQ location
                        storm_lon=36.7884,
                        intensity=min(wind / 100.0, 1.0)
                    )
                    db.add(log)
                    await db.commit()
                    
            print(f"[WEATHER SYNC] Status: {status} | Wind: {wind:.1f} km/h | Grounded: {is_grounded}")

        except Exception as e:
            print(f"[WEATHER ERROR] {e}")
            
        await asyncio.sleep(60) # Poll every 60 seconds for demonstration (normally 10 mins)

async def start_weather_engine():
    """Kicks off the background polling task."""
    asyncio.create_task(poll_weather_api())
