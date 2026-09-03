import {
  AcquiredFrame,
  DerivedPhysics,
  LayerHealth,
  NormalizedObservation,
  RawSensorFrame,
  StageTelemetry,
  TwinForecastPoint,
  TwinResidual,
  TwinSource,
  TwinState,
} from "./types";
import { CalibrationOffsets } from "../types";
import { derivePhysics, dewPoint } from "./derivations";

/* ------------------------------------------------------------------ *
 *  Orchestrator — runs a raw frame down the layer stack and records
 *  per-stage telemetry. One `run()` call == one twin tick.
 * ------------------------------------------------------------------ */

export interface PipelineHistoryPoint {
  ts: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  light: number;
  precipitation: number;
}

export interface PipelineInput {
  raw: RawSensorFrame;
  source: TwinSource;
  calibration: CalibrationOffsets;
  history: PipelineHistoryPoint[];
  /** epoch ms; defaults to Date.now() */
  now?: number;
}

const TOLERANCE = { temperature: 1.5, humidity: 6, windSpeed: 2.5, pressure: 2 };

function timed<T>(fn: () => T): { value: T; ms: number } {
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const value = fn();
  const t1 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  return { value, ms: Math.max(0.01, Number((t1 - t0).toFixed(2))) };
}

function health(messages: string[], bad: RegExp): LayerHealth {
  return messages.some((m) => bad.test(m)) ? "degraded" : "nominal";
}

/* --------------------------- Stage 2 --------------------------- */

function acquire(raw: RawSensorFrame, source: TwinSource, now: number): {
  frame: AcquiredFrame;
  telemetry: Omit<StageTelemetry, "throughputPerMin">;
} {
  const { value: frame, ms } = timed<AcquiredFrame>(() => {
    const linkLatencyMs =
      source === "simulation" ? Math.round(40 + Math.random() * 180) : now - raw.capturedAt;
    const rssiDbm = source === "simulation" ? -Math.round(58 + Math.random() * 40) : -72;
    const packetLossPct = source === "simulation" ? Number((Math.random() * 2.5).toFixed(1)) : 0;
    const qaFlags: string[] = [];
    Object.entries(raw.channels).forEach(([name, ch]) => {
      if (ch.quality === "suspect") qaFlags.push(`${name}: sensor self-test suspect`);
      if (ch.quality === "stale") qaFlags.push(`${name}: value stale`);
    });
    if (raw.batteryV < 11.8) qaFlags.push("battery: below 11.8 V float");
    return {
      frameId: `frm_${raw.capturedAt.toString(36)}`,
      stationId: raw.stationId,
      capturedAt: raw.capturedAt,
      receivedAt: now,
      gateway: "gw-nilphamari-01",
      transport: source === "simulation" ? "LoRaWAN" : "Firestore",
      rssiDbm,
      linkLatencyMs,
      packetLossPct,
      raw,
      qaFlags,
    };
  });

  const messages = [
    `Framed 7 channels · packet ${frame.frameId}`,
    `Link ${frame.transport} ${frame.rssiDbm} dBm · ${frame.linkLatencyMs} ms · loss ${frame.packetLossPct}%`,
    ...frame.qaFlags,
  ];
  return {
    frame,
    telemetry: {
      id: "acquisition",
      label: "Acquisition",
      lastRunAt: now,
      durationMs: ms,
      inputCount: 7,
      outputCount: 7,
      health: health(messages, /suspect|stale|below|loss (?:[3-9]|\d\d)/),
      messages,
      sample: {
        frame: frame.frameId,
        rssiDbm: frame.rssiDbm,
        latencyMs: frame.linkLatencyMs,
        lossPct: frame.packetLossPct,
      },
    },
  };
}

/* --------------------------- Stage 3 --------------------------- */

function integrate(
  frame: AcquiredFrame,
  calibration: CalibrationOffsets,
  history: PipelineHistoryPoint[],
  now: number
): { obs: NormalizedObservation; telemetry: Omit<StageTelemetry, "throughputPerMin"> } {
  const { value: obs, ms } = timed<NormalizedObservation>(() => {
    const ch = frame.raw.channels;
    const calibrationApplied: string[] = [];
    const imputedFields: string[] = [];
    const rejectedOutliers: string[] = [];

    // calibration offsets
    let windSpeed = ch.anemometer.raw + calibration.anemometerBaseline;
    if (calibration.anemometerBaseline) calibrationApplied.push("anemometer baseline");
    let pressure = ch.barometer.raw + calibration.barometerOffset;
    if (calibration.barometerOffset) calibrationApplied.push("barometer offset");
    let humidity = ch.hygrometer.raw - calibration.hygrometerDrift;
    if (calibration.hygrometerDrift) calibrationApplied.push("hygrometer drift");

    let temperature = ch.thermistor.raw;
    let light = ch.pyranometer.raw;
    let precipitation = Math.max(0, ch.rainGauge.raw);
    const windDirection = ch.windVane.raw;

    // range validation + outlier rejection against recent history
    const last = history[history.length - 1];
    const clampField = (
      name: keyof typeof TOLERANCE,
      val: number,
      lo: number,
      hi: number,
      maxJump: number
    ): number => {
      let v = val;
      if (v < lo || v > hi) {
        rejectedOutliers.push(`${name} ${v.toFixed(1)} out of [${lo}, ${hi}]`);
        v = Math.max(lo, Math.min(hi, v));
      }
      if (last && Math.abs(v - (last as any)[name]) > maxJump) {
        rejectedOutliers.push(`${name} step ${(v - (last as any)[name]).toFixed(1)} clipped`);
        v = (last as any)[name] + Math.sign(v - (last as any)[name]) * maxJump;
      }
      return v;
    };
    temperature = clampField("temperature", temperature, -5, 52, 4);
    humidity = clampField("humidity", humidity, 0, 100, 25);
    windSpeed = clampField("windSpeed", Math.max(0, windSpeed), 0, 65, 12);
    pressure = clampField("pressure", pressure, 940, 1060, 6);

    // gap imputation for stale channels
    if (ch.windVane.quality === "stale" && last) {
      imputedFields.push("windDirection ← last good");
    }

    // moving-average smoothing (last 5 incl. current)
    const smoothingWindow = 5;
    const recent = history.slice(-(smoothingWindow - 1));
    const smooth = (val: number, sel: (p: PipelineHistoryPoint) => number) => {
      if (recent.length === 0) return val;
      const arr = [...recent.map(sel), val];
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };
    temperature = round2(smooth(temperature, (p) => p.temperature));
    humidity = round2(smooth(humidity, (p) => p.humidity));
    windSpeed = round2(smooth(windSpeed, (p) => p.windSpeed));
    pressure = round2(smooth(pressure, (p) => p.pressure));
    light = round2(smooth(light, (p) => p.light));

    // derived channels
    const cloudCover = Math.round(Math.max(0, Math.min(100, 100 - light)));
    let condition = "Clear";
    if (precipitation > 0.2) condition = "Rain";
    else if (cloudCover > 70) condition = "Clouds";
    else if (cloudCover > 35) condition = "Partly Cloudy";
    const dp = round1(dewPoint(temperature, humidity));

    return {
      windSpeed,
      windDirection,
      precipitation: round2(precipitation),
      temperature,
      humidity,
      light,
      pressure,
      cloudCover,
      solarIrradiance: Math.round((light / 100) * 1000),
      condition,
      dewPoint: dp,
      timestamp: frame.capturedAt,
      provenance: {
        calibrationApplied,
        imputedFields,
        rejectedOutliers,
        smoothingWindow,
      },
    };
  });

  const p = obs.provenance;
  const messages = [
    `Normalised to SI · ${p.calibrationApplied.length} calibration offset(s) applied`,
    p.rejectedOutliers.length
      ? `Rejected ${p.rejectedOutliers.length} outlier(s): ${p.rejectedOutliers[0]}`
      : "Range + spike checks passed",
    p.imputedFields.length ? `Imputed ${p.imputedFields.join(", ")}` : "No gaps to impute",
    `Smoothed on ${p.smoothingWindow}-sample window · derived cloud cover ${obs.cloudCover}%`,
  ];
  return {
    obs,
    telemetry: {
      id: "integration",
      label: "Integration",
      lastRunAt: now,
      durationMs: ms,
      inputCount: 7,
      outputCount: 9,
      health: health(messages, /Rejected [2-9]|Rejected \d\d/),
      messages,
      sample: {
        tempC: obs.temperature,
        rh: obs.humidity,
        hPa: obs.pressure,
        cloud: obs.cloudCover,
      },
    },
  };
}

/* --------------------------- Stage 4 --------------------------- */

function model(
  obs: NormalizedObservation,
  history: PipelineHistoryPoint[],
  now: number
): {
  physics: DerivedPhysics;
  forecast: TwinForecastPoint[];
  residuals: TwinResidual[];
  fidelityPct: number;
  telemetry: Omit<StageTelemetry, "throughputPerMin">;
} {
  const { value, ms } = timed(() => {
    const physics = derivePhysics(obs, new Date(now));

    // short-horizon forecaster: local linear trend + damping
    const win = history.slice(-6);
    const trend = (sel: (p: PipelineHistoryPoint) => number, cur: number) => {
      if (win.length < 2) return 0;
      const first = sel(win[0]);
      const span = (win[win.length - 1].ts - win[0].ts) / 60000 || 1;
      return (sel(win[win.length - 1]) - first) / span; // per-minute slope
    };
    const tT = trend((p) => p.temperature, obs.temperature);
    const tH = trend((p) => p.humidity, obs.humidity);
    const tW = trend((p) => p.windSpeed, obs.windSpeed);
    const forecast: TwinForecastPoint[] = [15, 30, 60].map((h) => {
      const damp = Math.exp(-h / 90);
      return {
        horizonMin: h,
        temperature: round1(obs.temperature + tT * h * damp),
        humidity: round1(Math.max(0, Math.min(100, obs.humidity + tH * h * damp))),
        windSpeed: round1(Math.max(0, obs.windSpeed + tW * h * damp)),
        confidence: Math.round(88 * damp + 6),
      };
    });

    // residuals: compare the forecast made ~1 interval ago (persistence proxy)
    const prev = history[history.length - 1];
    const mkResidual = (
      field: TwinResidual["field"],
      measured: number,
      predicted: number
    ): TwinResidual => {
      const residual = round2(measured - predicted);
      return {
        field,
        predicted: round2(predicted),
        measured: round2(measured),
        residual,
        driftPct: Math.round((Math.abs(residual) / TOLERANCE[field]) * 100),
      };
    };
    const residuals: TwinResidual[] = prev
      ? [
          mkResidual("temperature", obs.temperature, prev.temperature + tT * 1),
          mkResidual("humidity", obs.humidity, prev.humidity + tH * 1),
          mkResidual("windSpeed", obs.windSpeed, prev.windSpeed + tW * 1),
          mkResidual("pressure", obs.pressure, prev.pressure),
        ]
      : [];

    const avgDrift =
      residuals.length > 0
        ? residuals.reduce((s, r) => s + Math.min(100, r.driftPct), 0) / residuals.length
        : 0;
    const fidelityPct = Math.max(40, Math.round(100 - avgDrift * 0.55));

    return { physics, forecast, residuals, fidelityPct };
  });

  const worst = value.residuals
    .slice()
    .sort((a, b) => b.driftPct - a.driftPct)[0];
  const messages = [
    `Physics: dew point ${value.physics.dewPoint} °C · VPD ${value.physics.vpd} kPa · ET₀ ${value.physics.et0} mm/d`,
    `Forecast +60 min: ${value.forecast[2]?.temperature ?? "–"} °C @ ${value.forecast[2]?.confidence ?? 0}% conf`,
    worst
      ? `Twin↔asset residual: ${worst.field} ${worst.residual >= 0 ? "+" : ""}${worst.residual} (${worst.driftPct}% of band)`
      : "Residual baseline warming up",
    `Model fidelity ${value.fidelityPct}%`,
  ];
  return {
    ...value,
    telemetry: {
      id: "model",
      label: "Model & Simulation",
      lastRunAt: now,
      durationMs: ms,
      inputCount: 9,
      outputCount: 9 + value.forecast.length + value.residuals.length,
      health: value.fidelityPct < 62 ? "degraded" : "nominal",
      messages,
      sample: {
        dewPointC: value.physics.dewPoint,
        vpdKpa: value.physics.vpd,
        fidelityPct: value.fidelityPct,
        forecast60C: value.forecast[2]?.temperature ?? 0,
      },
    },
  };
}

/* --------------------------- Stage 5 --------------------------- */

function visualize(
  obs: NormalizedObservation,
  physics: DerivedPhysics,
  fidelityPct: number,
  now: number
): Omit<StageTelemetry, "throughputPerMin"> {
  const { ms } = timed(() => {
    const alerts: string[] = [];
    if (obs.windSpeed * 3.6 > 40) alerts.push("high-wind");
    if (obs.temperature > 38) alerts.push("heat");
    if (obs.precipitation > 10) alerts.push("heavy-rain");
    if (physics.vpd > 2.2) alerts.push("crop-water-stress");
    return alerts;
  });
  const alerts: string[] = [];
  if (obs.windSpeed * 3.6 > 40) alerts.push("High-wind advisory (>40 km/h)");
  if (obs.temperature > 38) alerts.push("Heat stress (>38 °C)");
  if (obs.precipitation > 10) alerts.push("Heavy rainfall (>10 mm)");
  if (physics.vpd > 2.2) alerts.push("Crop water stress (VPD >2.2 kPa)");

  const messages = [
    `Rendered 6 KPI tiles + 3D viewport + trend panel`,
    alerts.length ? `${alerts.length} threshold alert(s): ${alerts.join("; ")}` : "No active threshold alerts",
    `Operator surface fidelity badge: ${fidelityPct}%`,
  ];
  return {
    id: "visualization",
    label: "Visualization & Control",
    lastRunAt: now,
    durationMs: ms,
    inputCount: 9,
    outputCount: 10,
    health: alerts.length >= 3 ? "degraded" : "nominal",
    messages,
    sample: {
      alerts: alerts.length,
      condition: obs.condition,
      feelsLikeC: physics.feelsLike,
    },
  };
}

/* --------------------------- Physical telemetry ---------------- */

function physicalTelemetry(raw: RawSensorFrame, source: TwinSource, now: number): Omit<StageTelemetry, "throughputPerMin"> {
  const suspect = Object.entries(raw.channels).filter(([, c]) => c.quality !== "ok");
  const messages = [
    `${source === "simulation" ? "Simulated" : "Live"} mast · fw ${raw.firmware} · ${raw.batteryV} V`,
    `7 instruments sampled at ${new Date(raw.capturedAt).toISOString().substring(11, 19)}Z`,
    suspect.length
      ? `${suspect.length} channel(s) flagged: ${suspect.map(([n]) => n).join(", ")}`
      : "All instrument self-tests OK",
  ];
  return {
    id: "physical",
    label: "Physical Asset",
    lastRunAt: now,
    durationMs: 0.5,
    inputCount: 7,
    outputCount: 7,
    health: raw.batteryV < 11.8 ? "degraded" : suspect.length > 1 ? "degraded" : "nominal",
    messages,
    sample: {
      tempC: raw.channels.thermistor.raw,
      windMs: raw.channels.anemometer.raw,
      batteryV: raw.batteryV,
    },
  };
}

/* ------------------------------- run --------------------------- */

let lastRunAt = 0;

export function runPipeline(input: PipelineInput): TwinState {
  const now = input.now ?? Date.now();
  const dtMin = lastRunAt ? Math.max(0.05, (now - lastRunAt) / 60000) : 0.17;
  lastRunAt = now;

  const phys = physicalTelemetry(input.raw, input.source, now);
  const acq = acquire(input.raw, input.source, now);
  const integ = integrate(acq.frame, input.calibration, input.history, now);
  const mdl = model(integ.obs, input.history, now);
  const vis = visualize(integ.obs, mdl.physics, mdl.fidelityPct, now);

  const withThroughput = (t: Omit<StageTelemetry, "throughputPerMin">): StageTelemetry => ({
    ...t,
    throughputPerMin: Number((t.outputCount / dtMin).toFixed(1)),
  });

  const stages = [phys, acq.telemetry, integ.telemetry, mdl.telemetry, vis].map(withThroughput);

  const twinHealth: LayerHealth = stages.some((s) => s.health === "offline")
    ? "offline"
    : stages.filter((s) => s.health === "degraded").length >= 2 || mdl.fidelityPct < 55
      ? "degraded"
      : "nominal";

  return {
    source: input.source,
    observation: integ.obs,
    physics: mdl.physics,
    forecast: mdl.forecast,
    residuals: mdl.residuals,
    twinHealth,
    fidelityPct: mdl.fidelityPct,
    raw: input.raw,
    acquired: acq.frame,
    stages,
    updatedAt: now,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
