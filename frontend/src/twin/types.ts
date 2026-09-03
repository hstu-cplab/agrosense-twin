import { WeatherData } from "../types";

/* ------------------------------------------------------------------ *
 *  Digital-twin layer stack
 *  Physical → Acquisition → Integration → Model & Simulation → Visualization
 * ------------------------------------------------------------------ */

export type LayerId =
  | "physical"
  | "acquisition"
  | "integration"
  | "model"
  | "visualization";

export type LayerHealth = "nominal" | "degraded" | "offline";

/** Static description of one architecture layer. */
export interface TwinLayer {
  id: LayerId;
  index: number;
  name: string;
  tagline: string;
  description: string;
  responsibilities: string[];
  components: string[];
  tech: string[];
  /** hex accent */
  color: string;
  /** lucide-react icon name */
  icon: string;
}

/** Live telemetry for one pipeline stage, refreshed every tick. */
export interface StageTelemetry {
  id: LayerId;
  label: string;
  /** epoch ms of the last time this stage executed */
  lastRunAt: number;
  /** wall-clock cost of the last execution */
  durationMs: number;
  /** records that entered the stage this tick */
  inputCount: number;
  /** records that left the stage this tick */
  outputCount: number;
  /** rolling estimate, records/minute */
  throughputPerMin: number;
  health: LayerHealth;
  /** human-readable notes emitted by the stage this tick */
  messages: string[];
  /** short sample of the payload leaving the stage */
  sample: Record<string, string | number>;
}

/* ---------------------------- Physical ---------------------------- */

export type SensorQuality = "ok" | "suspect" | "stale";

export interface SensorChannel {
  raw: number;
  unit: string;
  quality: SensorQuality;
  /** instrument noise band (±) applied by the simulator */
  noise: number;
}

export interface RawSensorFrame {
  stationId: string;
  /** epoch ms the microcontroller latched the sample */
  capturedAt: number;
  firmware: string;
  batteryV: number;
  channels: {
    anemometer: SensorChannel;
    windVane: SensorChannel;
    rainGauge: SensorChannel;
    thermistor: SensorChannel;
    hygrometer: SensorChannel;
    pyranometer: SensorChannel;
    barometer: SensorChannel;
  };
}

/* -------------------------- Acquisition -------------------------- */

export interface AcquiredFrame {
  frameId: string;
  stationId: string;
  capturedAt: number;
  receivedAt: number;
  /** transport hop */
  gateway: string;
  transport: "LoRaWAN" | "Wi-Fi" | "GSM/MQTT" | "Firestore";
  rssiDbm: number;
  /** ms between capture and gateway receipt */
  linkLatencyMs: number;
  packetLossPct: number;
  raw: RawSensorFrame;
  qaFlags: string[];
}

/* -------------------------- Integration ------------------------- */

export interface NormalizedObservation extends WeatherData {
  /** always populated after integration */
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  temperature: number;
  humidity: number;
  light: number;
  pressure: number;
  cloudCover: number;
  solarIrradiance: number;
  condition: string;
  dewPoint: number;
  timestamp: number;
  provenance: {
    calibrationApplied: string[];
    imputedFields: string[];
    rejectedOutliers: string[];
    smoothingWindow: number;
  };
}

/* ----------------------- Model & Simulation --------------------- */

export interface DerivedPhysics {
  dewPoint: number;
  heatIndex: number;
  windChill: number;
  vpd: number;            // vapour-pressure deficit, kPa
  et0: number;            // reference evapotranspiration, mm/day
  absoluteHumidity: number; // g/m³
  solarLoad: number;      // W/m²
  feelsLike: number;
  comfortIndex: number;   // 0-100
}

export interface TwinForecastPoint {
  horizonMin: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  confidence: number;
}

export interface TwinResidual {
  field: "temperature" | "humidity" | "windSpeed" | "pressure";
  predicted: number;
  measured: number;
  residual: number;
  /** % of tolerance band consumed */
  driftPct: number;
}

/* --------------------------- Aggregate ------------------------- */

export type TwinSource = "firestore" | "simulation";

export interface TwinState {
  source: TwinSource;
  observation: NormalizedObservation;
  physics: DerivedPhysics;
  forecast: TwinForecastPoint[];
  residuals: TwinResidual[];
  /** twin health rolled up from stage health + residual drift */
  twinHealth: LayerHealth;
  /** 0-100, how tightly the virtual model tracks the physical asset */
  fidelityPct: number;
  raw: RawSensorFrame;
  acquired: AcquiredFrame;
  stages: StageTelemetry[];
  updatedAt: number;
}
