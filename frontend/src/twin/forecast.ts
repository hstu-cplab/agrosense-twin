import { CalibrationOffsets } from "../types";
import {
  PhysicalLayerState,
  stepPhysicalLayer,
} from "./physicalLayer";
import { dewPoint, satVapourPressure, heatIndex, et0Hargreaves } from "./derivations";

/* ------------------------------------------------------------------ *
 *  Model & Simulation Layer — forward forecast.
 *
 *  Runs the Physical-Layer simulator forward from a *clone* of the
 *  current environment state so the twin can project the next few days
 *  of conditions (diurnal cycle, passing rain cells, pressure drift).
 *  This is a genuine model roll-out, not a straight-line extrapolation.
 * ------------------------------------------------------------------ */

export interface ForecastPoint {
  atMs: number;
  hoursAhead: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  light: number;
  pressure: number;
  dewPoint: number;
  vpd: number;
  heatIndex: number;
  et0: number;
}

interface ForecastOpts {
  hours?: number;
  stepMinutes?: number;
  calibration?: CalibrationOffsets;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Deep-ish clone of the (plain-object) physical state. */
function cloneState(s: PhysicalLayerState): PhysicalLayerState {
  return { ...s };
}

export function simulateForecast(
  base: PhysicalLayerState,
  fromMs: number,
  opts: ForecastOpts = {}
): ForecastPoint[] {
  const hours = opts.hours ?? 48;
  const stepMinutes = opts.stepMinutes ?? 60;
  const cal = opts.calibration;
  const stepsPerPoint = 1;
  const state = cloneState(base);

  const points: ForecastPoint[] = [];
  const stepMs = stepMinutes * 60_000;
  const total = Math.round((hours * 60) / stepMinutes);

  // advance the RNG a little so the clone diverges from the live series
  for (let i = 0; i < 3; i++) stepPhysicalLayer(state, fromMs);

  for (let i = 1; i <= total; i++) {
    const atMs = fromMs + i * stepMs;
    let frame = stepPhysicalLayer(state, atMs);
    for (let k = 1; k < stepsPerPoint; k++) frame = stepPhysicalLayer(state, atMs);

    const ch = frame.channels;
    const temperature = ch.thermistor.raw;
    const humidity = Math.max(0, Math.min(100, ch.hygrometer.raw - (cal?.hygrometerDrift ?? 0)));
    const windSpeed = Math.max(0, ch.anemometer.raw + (cal?.anemometerBaseline ?? 0));
    const precipitation = Math.max(0, ch.rainGauge.raw);
    const light = Math.max(0, Math.min(100, ch.pyranometer.raw));
    const pressure = ch.barometer.raw + (cal?.barometerOffset ?? 0);

    const es = satVapourPressure(temperature);
    const ea = es * (humidity / 100);
    const doy = Math.floor(
      (atMs - Date.UTC(new Date(atMs).getUTCFullYear(), 0, 0)) / 86_400_000
    );

    points.push({
      atMs,
      hoursAhead: (i * stepMinutes) / 60,
      temperature: round1(temperature),
      humidity: round1(humidity),
      windSpeed: round1(windSpeed),
      precipitation: round1(precipitation),
      light: round1(light),
      pressure: round1(pressure),
      dewPoint: round1(dewPoint(temperature, humidity)),
      vpd: Number(Math.max(0, es - ea).toFixed(2)),
      heatIndex: round1(heatIndex(temperature, humidity)),
      et0: Number(et0Hargreaves(temperature, light, doy).toFixed(2)),
    });
  }

  return points;
}

/** Aggregate a forecast window into daily min/mean/max summaries. */
export interface ForecastDay {
  dayOffset: number;
  label: string;
  tMin: number;
  tMax: number;
  tMean: number;
  rhMean: number;
  rainTotal: number;
  et0Total: number;
  vpdMax: number;
  windMax: number;
}

export function summariseDays(points: ForecastPoint[], fromMs: number): ForecastDay[] {
  const byDay = new Map<number, ForecastPoint[]>();
  for (const p of points) {
    const day = Math.floor((p.atMs - fromMs) / 86_400_000);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(p);
  }
  const out: ForecastDay[] = [];
  for (const [day, ps] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    if (ps.length < 3) continue;
    const temps = ps.map((p) => p.temperature);
    const d = new Date(fromMs + day * 86_400_000);
    out.push({
      dayOffset: day,
      label: day === 0 ? "Today" : day === 1 ? "Tomorrow" : d.toLocaleDateString("en", { weekday: "short" }),
      tMin: round1(Math.min(...temps)),
      tMax: round1(Math.max(...temps)),
      tMean: round1(temps.reduce((a, b) => a + b, 0) / temps.length),
      rhMean: round1(ps.reduce((a, b) => a + b.humidity, 0) / ps.length),
      rainTotal: round1(ps.reduce((a, b) => a + b.precipitation, 0)),
      et0Total: Number(ps.reduce((a, b) => a + b.et0 / 24, 0).toFixed(2)),
      vpdMax: round1(Math.max(...ps.map((p) => p.vpd))),
      windMax: round1(Math.max(...ps.map((p) => p.windSpeed))),
    });
  }
  return out.slice(0, 7);
}
