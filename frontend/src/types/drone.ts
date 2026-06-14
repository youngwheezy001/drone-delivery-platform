export interface Drone {
  id: string;
  org: string;
  battery: number;
  alt: string;
  speed: string;
  coords: [number, number];
  status: 'IN_FLIGHT' | 'CHARGING' | 'READY';
}

export interface DroneTelemetry {
  latitude: number;
  longitude: number;
  altitude_m: number;
  speed_ms: number;
  battery_pct?: number;
}
