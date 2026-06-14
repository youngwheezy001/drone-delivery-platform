export type FlightPhase = 'PREPARING' | 'IN_TRANSIT' | 'HOVERING' | 'ARRIVED' | 'DELIVERED' | 'SCHEDULED';

export interface DroneTelemetry {
  latitude: number;
  longitude: number;
  altitude_m: number;
  speed_ms: number;
  battery_pct?: number;
}

export interface TelemetryHardware {
  motor_temp_c: number;
  rotor_rpm: number;
  imu_drift_rad: number;
  voltage: number;
}

export interface TelemetryPacket {
  delivery_id: string;
  status: FlightPhase;
  telemetry: DroneTelemetry;
  hardware?: TelemetryHardware;
}
