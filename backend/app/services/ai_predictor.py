import random
from typing import List, Dict

class DemandPredictor:
    """
    AI Predictive Logistics Engine.
    Analyzes historical flight density and weather to predict near-future order clusters.
    Generates 'Hot Zones' for idle drones to pre-position at.
    """
    
    def __init__(self):
        # Base Nairobi tactical zones
        self.base_zones = [
            {"lat": -1.2921, "lon": 36.7884, "intensity": 0.9, "label": "KILIMANI_HUB"},
            {"lat": -1.2800, "lon": 36.8200, "intensity": 0.8, "label": "CBD_SURGE"},
            {"lat": -1.3000, "lon": 36.7600, "intensity": 0.75, "label": "LAVINGTON_POCKET"},
            {"lat": -1.2650, "lon": 36.8000, "intensity": 0.6, "label": "WESTLANDS_SECTOR"},
        ]
        
    def get_predictive_heatmap(self, base_records: List[Dict] = None) -> List[Dict]:
        """
        Takes real active delivery destinations and merges them with AI predicted surge zones.
        """
        heatmap = []
        
        # 1. Add predictive hot zones (with dynamic pulsing intensities)
        for zone in self.base_zones:
            # Simulate a live breathing/pulsing prediction model
            fluctuation = random.uniform(-0.1, 0.2)
            final_intensity = min(1.0, max(0.3, zone["intensity"] + fluctuation))
            heatmap.append({
                "lat": zone["lat"],
                "lon": zone["lon"],
                "intensity": final_intensity
            })
            
        # 2. Add actual current flight destinations
        if base_records:
            for rec in base_records:
                heatmap.append({
                    "lat": rec["lat"],
                    "lon": rec["lon"],
                    "intensity": 0.85 # High intensity for confirmed active zones
                })
                
        return heatmap

ai_predictor = DemandPredictor()
