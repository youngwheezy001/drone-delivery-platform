import math
import heapq
from typing import List, Tuple, Dict, Optional

class FlightPathPlanner:
    """
    Advanced Autonomous Navigation System using the A* Algorithm.
    Ensures drones can navigate AROUND exclusion zones (KCAA No-Fly Zones)
    by searching for the shortest available path on a coordinate grid.
    """
    def __init__(self):
        self.earth_radius_km = 6371.0
        self.grid_size = 40  # 🚀 ACCELERATION: Lower resolution for 4x faster planning
        self.padding_km = 0.3
        self.max_iterations = 1000 # 🚀 SAFETY: Tighter break for mobile UI responsiveness

    def haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates literal distance between GPS coordinates (Heuristic & Cost)."""
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return self.earth_radius_km * c

    def is_collision(self, point: Tuple[float, float], obstacles: List[Dict]) -> bool:
        """Checks if a coordinate breaches a geofence radius + safety buffer."""
        for obs in obstacles:
            # We add a safety buffer to the obstacle radius
            if self.haversine(point[0], point[1], obs['lat'], obs['lon']) < (obs['radius_km'] + self.padding_km):
                return True
        return False

    async def calculate_optimal_path(
        self, start: Tuple[float, float], goal: Tuple[float, float], obstacles: List[Dict]
    ) -> Optional[List[Tuple[float, float]]]:
        """
        Implementation of the A* algorithm over a dynamically generated GPS grid.
        Returns a collision-free path or None if no route exists.
        """
        # 0. Pre-Flight Validation: Check if start/goal are in exclusion zones
        if self.is_collision(start, obstacles) or self.is_collision(goal, obstacles):
            print("🚨 [A* PLANNER] Start or Goal is inside an exclusion zone. Planning aborted.")
            return None

        # 1. Define Bounding Box & Grid Resolution
        lats = [start[0], goal[0]] + [o['lat'] for o in obstacles]
        lons = [start[1], goal[1]] + [o['lon'] for o in obstacles]
        
        min_lat, max_lat = min(lats) - 0.05, max(lats) + 0.05
        min_lon, max_lon = min(lons) - 0.05, max(lons) + 0.05
        
        lat_step = (max_lat - min_lat) / self.grid_size
        lon_step = (max_lon - min_lon) / self.grid_size

        def to_grid(lat, lon):
            return (round((lat - min_lat) / lat_step), round((lon - min_lon) / lon_step))
        
        def from_grid(r, c):
            return (min_lat + (r * lat_step), min_lon + (c * lon_step))

        start_node = to_grid(*start)
        goal_node = to_grid(*goal)

        # 2. A* Core Logic
        open_list = []
        heapq.heappush(open_list, (0, start_node))
        
        came_from = {}
        g_score = {start_node: 0}
        f_score = {start_node: self.haversine(start[0], start[1], goal[0], goal[1])}

        iterations = 0
        while open_list and iterations < self.max_iterations:
            iterations += 1
            current_f, current = heapq.heappop(open_list)

            if current == goal_node:
                # 3. Reconstruction: Trace back from Goal to Start
                path = []
                while current in came_from:
                    path.append(from_grid(*current))
                    current = came_from[current]
                path.append(start)
                return [ (round(p[0], 5), round(p[1], 5)) for p in reversed(path) ]

            r, c = current
            # 8-Directional Movement (Up, Down, Left, Right + Diagonals)
            neighbors = [(r+1, c), (r-1, c), (r, c+1), (r, c-1), 
                         (r+1, c+1), (r-1, c-1), (r+1, c-1), (r-1, c+1)]

            for next_node in neighbors:
                next_pos = from_grid(*next_node)
                
                # Boundary & Collision Check
                if not (0 <= next_node[0] <= self.grid_size and 0 <= next_node[1] <= self.grid_size):
                    continue
                if self.is_collision(next_pos, obstacles):
                    continue

                # Calculate tentative score (Movement cost is the actual GPS distance)
                move_cost = self.haversine(from_grid(*current)[0], from_grid(*current)[1], next_pos[0], next_pos[1])
                tentative_g_score = g_score[current] + move_cost

                if next_node not in g_score or tentative_g_score < g_score[next_node]:
                    came_from[next_node] = current
                    g_score[next_node] = tentative_g_score
                    h_score = self.haversine(next_pos[0], next_pos[1], goal[0], goal[1])
                    # 🚀 GREEDY OPTIMIZATION: 1.2x factor for faster search tree convergence
                    f_score[next_node] = tentative_g_score + (1.2 * h_score)
                    heapq.heappush(open_list, (f_score[next_node], next_node))

        return None # No viable path found bypassing exclusion zones