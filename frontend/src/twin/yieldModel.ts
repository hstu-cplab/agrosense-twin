import { NormalizedObservation } from "./types";
import { CropProfile, assessCrop } from "./cropCatalog";
import { ForecastPoint } from "./forecast";

/* ------------------------------------------------------------------ *
 *  Crop yield forecast — transparent agronomic estimate.
 *
 *  yield ≈ potential × fit^0.55 × Πstress × water-balance term
 *
 *  Every multiplier is surfaced in the UI. This is a decision-support
 *  estimate, not a calibrated crop-growth model (DSSAT/APSIM class).
 * ------------------------------------------------------------------ */

/** Attainable yield under good management for Bangladesh, t/ha (fresh wt for fruit/veg). */
export const POTENTIAL_YIELD: Record<string, number> = {
  rice: 6.0,
  jute: 2.8,
  maize: 8.5,
  wheat: 4.5,
  potato: 24,
  mustard: 1.6,
  lentil: 1.5,
  chickpea: 1.8,
  sugarcane: 75,
  banana: 45,
  mango: 12,
  papaya: 55,
  chili: 12,
  tomato: 40,
  cucumber: 30,
  watermelon: 32,
};

export interface YieldFactor {
  label: string;
  multiplier: number; // 0-1.1
  note: string;
}

export interface YieldEstimate {
  crop: CropProfile;
  fitScore: number;
  potential: number;
  estimate: number;
  pctOfPotential: number;
  confidence: number;
  factors: YieldFactor[];
  band: [low: number, high: number];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param obs      current (or scenario) observation
 * @param forecast optional forward window — its mean VPD / rain / heat feed
 *                 the stress terms so the estimate reflects the outlook, not
 *                 just this instant.
 */
export function estimateYield(
  crop: CropProfile,
  obs: NormalizedObservation,
  forecast?: ForecastPoint[]
): YieldEstimate {
  const potential = POTENTIAL_YIELD[crop.id] ?? 5;
  const fit = assessCrop(crop, obs).score;

  const window = forecast && forecast.length > 4 ? forecast.slice(0, Math.min(forecast.length, 24 * 5)) : null;
  const mean = (sel: (p: ForecastPoint) => number) =>
    window ? window.reduce((a, b) => a + sel(b), 0) / window.length : null;
  const max = (sel: (p: ForecastPoint) => number) =>
    window ? Math.max(...window.map(sel)) : null;

  const factors: YieldFactor[] = [];

  // 1. environmental fit (dominant term)
  const fitMult = Math.pow(clamp(fit / 100, 0, 1), 0.55);
  factors.push({
    label: "Environmental fit",
    multiplier: Number(fitMult.toFixed(2)),
    note: `${fit}/100 match to the crop's temp / humidity / rain / light envelope`,
  });

  // 2. heat stress — sustained days above the crop's upper temp bound
  const tHi = crop.temp[2];
  const heatRef = mean((p) => p.temperature) ?? obs.temperature;
  const heatOver = Math.max(0, heatRef - (tHi - 3));
  const heatMult = clamp(1 - heatOver * 0.045, 0.55, 1);
  factors.push({
    label: "Heat stress",
    multiplier: Number(heatMult.toFixed(2)),
    note:
      heatOver > 0.5
        ? `outlook mean ${heatRef.toFixed(1)} °C is near / above the ${tHi} °C ceiling`
        : "within the crop's thermal range",
  });

  // 3. water balance — compares forecast rain against ET₀ demand.
  //    Paddy / fibre / cane crops tolerate standing water; upland crops don't.
  const rainTot = window ? window.reduce((a, b) => a + b.precipitation, 0) : obs.precipitation * 12;
  const et0Tot = window ? window.reduce((a, b) => a + b.et0 / 24, 0) : 4;
  const ratio = et0Tot > 0 ? rainTot / et0Tot : 1;
  const wetTolerant = ["rice", "jute", "sugarcane", "banana"].includes(crop.id);
  const wetCeiling = wetTolerant ? 8 : 3.2;
  const waterMult =
    ratio < 0.35
      ? clamp(0.62 + ratio, 0.55, 1) // dry — assumes partial irrigation
      : ratio > wetCeiling
        ? clamp(1 - (ratio - wetCeiling) * (wetTolerant ? 0.015 : 0.03), 0.62, 1) // waterlogging
        : 1;
  factors.push({
    label: "Water balance",
    multiplier: Number(waterMult.toFixed(2)),
    note: `${rainTot.toFixed(0)} mm rain vs ${et0Tot.toFixed(0)} mm ET₀ demand over the window${
      wetTolerant && ratio > 3.2 ? " — crop tolerates wet feet" : ""
    }`,
  });

  // 4. vapour-pressure deficit — transpiration / pollination stress
  const vpdRef = max((p) => p.vpd) ?? 1.2;
  const vpdMult = vpdRef > 2.2 ? clamp(1 - (vpdRef - 2.2) * 0.12, 0.7, 1) : 1;
  factors.push({
    label: "VPD stress",
    multiplier: Number(vpdMult.toFixed(2)),
    note: vpdRef > 2.2 ? `peak VPD ${vpdRef.toFixed(1)} kPa drives flower / fruit drop` : "transpiration demand normal",
  });

  // 5. wind — lodging / mechanical damage, mostly tall & broad-leaf crops
  const windRef = max((p) => p.windSpeed) ?? obs.windSpeed;
  const windSensitive = ["banana", "papaya", "maize", "sugarcane", "rice", "jute"].includes(crop.id);
  const windMult = windSensitive && windRef > 9 ? clamp(1 - (windRef - 9) * 0.03, 0.75, 1) : 1;
  factors.push({
    label: "Wind / lodging",
    multiplier: Number(windMult.toFixed(2)),
    note:
      windMult < 1
        ? `gusts to ${windRef.toFixed(0)} m/s risk lodging this crop`
        : "no lodging risk in the outlook",
  });

  const total = factors.reduce((m, f) => m * f.multiplier, 1);
  const estimate = potential * total;
  const pctOfPotential = Math.round((estimate / potential) * 100);

  // confidence: firmer with a forecast window and a clear fit signal
  const confidence = Math.round(
    clamp(46 + (window ? 22 : 0) + Math.abs(fit - 50) * 0.4, 40, 92)
  );
  const spread = estimate * (0.12 + (100 - confidence) / 300);

  return {
    crop,
    fitScore: fit,
    potential,
    estimate: Number(estimate.toFixed(estimate < 5 ? 2 : 1)),
    pctOfPotential,
    confidence,
    factors,
    band: [
      Number(Math.max(0, estimate - spread).toFixed(1)),
      Number((estimate + spread).toFixed(1)),
    ],
  };
}
