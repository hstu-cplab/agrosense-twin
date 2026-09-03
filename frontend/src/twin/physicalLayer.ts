import { RawSensorFrame, SensorChannel, SensorQuality } from "./types";

/* ------------------------------------------------------------------ *
 *  Physical Layer — synthetic environment for the BRAC Nursery mast.
 *
 *  Generates physically-plausible raw sensor frames (Nilphamari,
 *  Bangladesh — warm-humid, monsoon tail in September) so the twin is
 *  fully exercisable without a live Firestore feed. State is carried
 *  between calls so series are temporally coherent (gusts decay, rain
 *  cells pass through, pressure drifts).
 * ------------------------------------------------------------------ */

export interface PhysicalLayerState {
  /** slow barometric drift, hPa */
  pressureBias: number;
  /** current gust envelope, m/s */
  gust: number;
  /** rain-cell intensity 0-1, decays each step */
  rainCell: number;
  /** prevailing wind bearing, deg */
  bearing: number;
  seed: number;
}

export function createPhysicalState(): PhysicalLayerState {
  return {
    pressureBias: 0,
    gust: 0,
    rainCell: 0,
    bearing: 190,
    seed: Math.floor(Math.random() * 1e6),
  };
}

/** deterministic-ish PRNG so a given seed is reproducible within a run */
function rng(state: PhysicalLayerState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 0xffffffff;
}

function gaussian(state: PhysicalLayerState): number {
  const u = Math.max(1e-6, rng(state));
  const v = rng(state);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** solar elevation proxy 0..1 from local hour (BST, UTC+6) */
function solarFraction(date: Date): number {
  const h = date.getUTCHours() + 6 + date.getUTCMinutes() / 60;
  const hod = ((h % 24) + 24) % 24;
  // sunrise ~05:40, sunset ~18:10 in September
  const x = (hod - 12) / 6.3;
  const f = Math.cos(x * (Math.PI / 2));
  return hod < 5.6 || hod > 18.2 ? 0 : Math.max(0, f);
}

function channel(
  raw: number,
  unit: string,
  noise: number,
  quality: SensorQuality = "ok"
): SensorChannel {
  return { raw: Number(raw.toFixed(3)), unit, quality, noise };
}

/**
 * Advance the simulated environment by one step and emit a raw frame.
 * `nowMs` lets callers pin the clock (tests / replay); defaults to real time.
 */
export function stepPhysicalLayer(
  state: PhysicalLayerState,
  nowMs: number = Date.now()
): RawSensorFrame {
  const now = new Date(nowMs);
  const sun = solarFraction(now);

  // --- temperature: diurnal swing around a ~28.5 °C September mean
  const baseTemp = 28.5 + 5.4 * (sun - 0.42) + gaussian(state) * 0.35;

  // --- pressure: slow random walk around 1005 hPa, dips before rain
  state.pressureBias += gaussian(state) * 0.15;
  state.pressureBias = Math.max(-6, Math.min(6, state.pressureBias * 0.995));
  const pressure = 1005 + state.pressureBias - state.rainCell * 3;

  // --- rain cells: occasionally spawn, then decay
  if (rng(state) < 0.03 && state.rainCell < 0.2) {
    state.rainCell = 0.4 + rng(state) * 0.6;
  }
  state.rainCell = Math.max(0, state.rainCell - 0.04 - rng(state) * 0.03);
  const rainRate = state.rainCell > 0.05 ? state.rainCell * 12 + gaussian(state) * 0.6 : 0;

  // --- humidity: high baseline, rises at night + during rain, falls midday
  const humidity = Math.max(
    45,
    Math.min(
      99,
      74 + (1 - sun) * 14 + state.rainCell * 18 - baseTemp * 0.4 + gaussian(state) * 2.5
    )
  );

  // --- wind: light prevailing + decaying gusts, stronger under rain cells
  if (rng(state) < 0.12) state.gust = Math.min(14, state.gust + rng(state) * 5);
  state.gust *= 0.86;
  const windSpeed = Math.max(
    0,
    1.4 + sun * 1.8 + state.gust + state.rainCell * 3 + gaussian(state) * 0.4
  );
  state.bearing += gaussian(state) * 4;
  state.bearing = ((state.bearing % 360) + 360) % 360;

  // --- light: solar fraction attenuated by rain-cell cloud, as %
  const lightPct = Math.max(0, Math.min(100, sun * 100 * (1 - state.rainCell * 0.75)));

  // occasional sensor fault injection so QA layers have something to catch
  const hygroFault = rng(state) < 0.015;

  return {
    stationId: "brac-nursery",
    capturedAt: nowMs,
    firmware: "agrosense-fw 2.4.1",
    batteryV: Number((12.6 - (1 - sun) * 0.7 + gaussian(state) * 0.03).toFixed(2)),
    channels: {
      anemometer: channel(windSpeed, "m/s", 0.3),
      windVane: channel(state.bearing, "deg", 3),
      rainGauge: channel(Math.max(0, rainRate), "mm", 0.2),
      thermistor: channel(baseTemp, "°C", 0.2),
      hygrometer: channel(
        hygroFault ? humidity + 25 : humidity,
        "%RH",
        0.8,
        hygroFault ? "suspect" : "ok"
      ),
      pyranometer: channel(lightPct, "%", 1.5),
      barometer: channel(pressure, "hPa", 0.1),
    },
  };
}

/** Adapt a persisted Firestore reading into a raw frame shape. */
export function firestoreReadingToRawFrame(r: {
  windSpeed: number;
  precipitation: number;
  temperature: number;
  humidity: number;
  light: number;
  pressure: number;
  ts: number;
}): RawSensorFrame {
  return {
    stationId: "brac-nursery",
    capturedAt: r.ts,
    firmware: "agrosense-fw 2.4.1",
    batteryV: 12.4,
    channels: {
      anemometer: channel(r.windSpeed, "m/s", 0.3),
      windVane: channel(0, "deg", 3, "stale"),
      rainGauge: channel(r.precipitation, "mm", 0.2),
      thermistor: channel(r.temperature, "°C", 0.2),
      hygrometer: channel(r.humidity, "%RH", 0.8),
      pyranometer: channel(r.light, "%", 1.5),
      barometer: channel(r.pressure, "hPa", 0.1),
    },
  };
}
