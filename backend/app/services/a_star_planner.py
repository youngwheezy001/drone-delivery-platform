import math
import heapq
import time
from typing import List, Tuple, Dict, Optional
from app.services.airspace_registry import airspace_registry

class FlightPathPlanner:
    """
    UAV NAV-COM OS v4.0: High-Precision Autonomous Navigation.
    Uses A* with post-processing 'String Pulling' for smooth, efficient flight paths.
    """
    def __init__(self):
        self.earth_radius_km = 6371.0
        self.grid_size = 120 # 🚀 PRECISION: 3x resolution for tight obstacle avoidance
        self.padding_km = 0.25 # Safety buffer around geofences
        self.max_iterations = 3000

    def haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Standard distance formula for GPS coordinates."""
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return self.earth_radius_km * c

    def is_collision(self, point: Tuple[float, float], obstacles: List[Dict]) -> bool:
        """Collision check using haversine circle-boundary logic."""
        for obs in obstacles:
            if self.haversine(point[0], point[1], obs['lat'], obs['lon']) < (obs['radius_km'] + self.padding_km):
                return True
        return False

    def check_line_of_sight(self, p1: Tuple[float, float], p2: Tuple[float, float], obstacles: List[Dict]) -> bool:
        """
        Mathematical LOS Check: Samples the line between two points to ensure no obstacle collisions.
        Used for 'String Pulling' path smoothing.
        """
        samples = 15
        for i in range(1, samples):
            t = i / samples
            lat = p1[0] + (p2[0] - p1[0]) * t
            lon = p1[1] + (p2[1] - p1[1]) * t
            if self.is_collision((lat, lon), obstacles):
                return False
        return True

    def smooth_path(self, path: List[Tuple[float, float]], obstacles: List[Dict]) -> List[Tuple[float, float]]:
        """
        String Pulling: Reduces redundant waypoints by checking direct line-of-sight.
        Converts 'stairs' into straight flight lines.
        """
        if len(path) < 3:
            return path
        
        smoothed = [path[0]]
        current_idx = 0
        
        while current_idx < len(path) - 1:
            furthest_visible = current_idx + 1
            # Look ahead as far as possible
            for check_idx in range(len(path) - 1, current_idx + 1, -1):
                if self.check_line_of_sight(path[current_idx], path[check_idx], obstacles):
                    furthest_visible = check_idx
                    break
            
            smoothed.append(path[furthest_visible])
            current_idx = furthest_visible
            
        return smoothed

    async def calculate_optimal_path(
        self, start: Tuple[float, float], goal: Tuple[float, float], obstacles: List[Dict], start_time: float = None
    ) -> Optional[List[Tuple[float, float]]]:
        """A* Implementation with Dynamic Swarm Avoidance (V3)."""
        if self.is_collision(start, obstacles) or self.is_collision(goal, obstacles):
            return None

        st = start_time or time.time()

        # 1. Define Search Space
        lats = [start[0], goal[0]] + [o['lat'] for o in obstacles]
        lons = [start[1], goal[1]] + [o['lon'] for o in obstacles]
        
        min_lat, max_lat = min(lats) - 0.05, max(lats) + 0.05
        min_lon, max_lon = min(lons) - 0.05, max(lons) + 0.05
        
        lat_step = (max_lat - min_lat) / self.grid_size
        lon_step = (max_lon - min_lon) / self.grid_size

        def from_grid(r, c):
            return (min_lat + (r * lat_step), min_lon + (c * lon_step))

        start_node = (int((start[0] - min_lat) / lat_step), int((start[1] - min_lon) / lon_step))
        goal_node = (int((goal[0] - min_lat) / lat_step), int((goal[1] - min_lon) / lon_step))

        # 2. A* Core
        open_list = []
        heapq.heappush(open_list, (0, start_node))
        came_from = {}
        g_score = {start_node: 0}
        
        iterations = 0
        while open_list and iterations < self.max_iterations:
            iterations += 1
            _, current = heapq.heappop(open_list)

            if current == goal_node:
                # Reconstruction
                full_path = []
                temp = current
                while temp in came_from:
                    full_path.append(from_grid(*temp))
                    temp = came_from[temp]
                full_path.append(start)
                
                raw_path = [ (round(p[0], 6), round(p[1], 6)) for p in reversed(full_path) ]
                return self.smooth_path(raw_path, obstacles)

            r, c = current
            # Estimate current time based on distance traveled (60km/h = 1km/min = 0.016km/sec)
            estimated_time = st + (g_score[current] / 60.0) * 3600
            
            # 🚀 SWARM V3: Fetch dynamic airspace obstacles for this timestamp
            dynamic_obs = airspace_registry.get_dynamic_obstacles(estimated_time)
            all_obstacles = obstacles + dynamic_obs

            for dr, dc in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)]:
                neighbor = (r+dr, c+dc)
                
                if not (0 <= neighbor[0] <= self.grid_size and 0 <= neighbor[1] <= self.grid_size):
                    continue
                
                pos = from_grid(*neighbor)
                if self.is_collision(pos, all_obstacles):
                    continue

                cost = self.haversine(from_grid(*current)[0], from_grid(*current)[1], pos[0], pos[1])
                tentative_g = g_score[current] + cost

                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    h = self.haversine(pos[0], pos[1], goal[0], goal[1])
                    f = tentative_g + (1.1 * h)
                    heapq.heappush(open_list, (f, neighbor))

        return None