from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.models.delivery import DeliveryRecord
from typing import Tuple, Optional
import random

class PredictiveDemandEngine:
    async def predict_hotspot(self, db: AsyncSession) -> Optional[Tuple[float, float]]:
        """
        Analyzes historical delivery data to predict the next demand hotspot.
        Returns the (latitude, longitude) of the predicted high-demand origin.
        """
        try:
            # We want to group by approximate coordinates to find clusters.
            # SQLite doesn't have a built-in ROUND function for GROUP BY easily in SQLAlchemy sometimes,
            # so we'll do a textual query for simplicity to find the most common origin grid.
            
            query = text("""
                SELECT 
                    ROUND(origin_lat, 2) as grid_lat, 
                    ROUND(origin_lon, 2) as grid_lon, 
                    COUNT(id) as demand_score
                FROM deliveries
                WHERE created_at >= datetime('now', '-7 days')
                GROUP BY grid_lat, grid_lon
                ORDER BY demand_score DESC
                LIMIT 1
            """)
            
            result = await db.execute(query)
            row = result.fetchone()
            
            if row and row.grid_lat and row.grid_lon:
                print(f"🧠 [PREDICTIVE AI] High demand predicted at ({row.grid_lat}, {row.grid_lon}) based on {row.demand_score} recent orders.")
                return (float(row.grid_lat), float(row.grid_lon))
                
            return None
        except Exception as e:
            print(f"❌ [PREDICTIVE AI ERROR] {e}")
            return None

predictive_demand_engine = PredictiveDemandEngine()
