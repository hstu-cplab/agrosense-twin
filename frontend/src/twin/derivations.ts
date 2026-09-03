import { DerivedPhysics, NormalizedObservation } from "./types";

/* ------------------------------------------------------------------ *
 *  Model & Simulation Layer — physics derivations.
 *  Standard psychrometric / agro-meteorological formulae so the twin
 *  reports quantities the bare sensors never measure.
 * ------------------------------------------------------------------ */

/** Saturation vapour pressure (kPa) — Tetens. */
export function satVapourPressure(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/** Magnus-formula dew point (°C). */
export function dewPoint(tempC: number, rh: number): number {
  const rhc = Math.max(1, Math.min(100, rh));
  const a = 17.27;
  const b = 237.7;
  const gamma = (a * tempC) / (b + tempC) + Math.log(rhc / 100);
  return (b * gamma) / (a - gamma);
}

/** NWS heat index (°C in, °C out); only meaningful when warm. */
export function heatIndex(tempC: number, rh: number): number {
  const T = tempC * 1.8 + 32;
  if (T < 80) return tempC;
  const R = Math.max(0, Math.min(100, rh));
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  if (R < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  }
  return (HI - 32) / 1.8;
}

/** Wind-chill (°C); only meaningful when cold + windy. */
export function windChill(tempC: number, windMs: number): number {
  const v = windMs * 3.6; // km/h
  if (tempC > 10 || v < 4.8) return tempC;
  return (
    13.12 +
    0.6215 * tempC -
    11.37 * Math.pow(v, 0.16) +
    0.3965 * tempC * Math.pow(v, 0.16)
  );
}

/** Absolute humidity (g/m³). */
export function absoluteHumidity(tempC: number, rh: number): number {
  const pv = satVapourPressure(tempC) * (Math.max(0, Math.min(100, rh)) / 100); // kPa
  return (2.1667 * (pv * 1000)) / (tempC + 273.15);
}

/**
 * Reference evapotranspiration (mm/day), Hargreaves — needs only temp and
 * radiation. `lightPct` is the pyranometer reading as a % of clear-sky.
 */
export function et0Hargreaves(tempC: number, lightPct: number, dayOfYear: number): number {
  const lat = 0.454; // 26°N in radians (Nilphamari)
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const decl = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const ws = Math.acos(-Math.tan(lat) * Math.tan(decl));
  const Ra =
    (24 * 60 / Math.PI) *
    0.082 *
    dr *
    (ws * Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.sin(ws));
  const trange = 8 + (lightPct / 100) * 4; // proxy diurnal range
  const et = 0.0023 * (tempC + 17.8) * Math.sqrt(Math.max(0, trange)) * (Ra * 0.408);
  return Math.max(0, et * (0.5 + lightPct / 200));
}

export function comfortIndex(tempC: number, rh: number, windMs: number): number {
  const dpGap = tempC - dewPoint(tempC, rh);
  let score = 100;
  score -= Math.abs(tempC - 24) * 3.2;
  score -= Math.max(0, 60 - dpGap * 6);
  score -= Math.max(0, rh - 65) * 0.6;
  score -= Math.max(0, windMs - 6) * 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function derivePhysics(o: NormalizedObservation, now: Date = new Date()): DerivedPhysics {
  const dp = dewPoint(o.temperature, o.humidity);
  const hi = heatIndex(o.temperature, o.humidity);
  const wc = windChill(o.temperature, o.windSpeed);
  const es = satVapourPressure(o.temperature);
  const ea = es * (Math.max(0, Math.min(100, o.humidity)) / 100);
  const vpd = Math.max(0, es - ea);
  const doy = Math.floor(
    (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000
  );
  const et0 = et0Hargreaves(o.temperature, o.light, doy);
  const solarLoad = Math.round((o.light / 100) * 1000); // W/m² clear-sky ≈ 1000
  const feelsLike = o.temperature > 20 ? hi : o.temperature < 10 ? wc : o.temperature;

  return {
    dewPoint: round1(dp),
    heatIndex: round1(hi),
    windChill: round1(wc),
    vpd: Number(vpd.toFixed(2)),
    et0: Number(et0.toFixed(2)),
    absoluteHumidity: round1(absoluteHumidity(o.temperature, o.humidity)),
    solarLoad,
    feelsLike: round1(feelsLike),
    comfortIndex: comfortIndex(o.temperature, o.humidity, o.windSpeed),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
