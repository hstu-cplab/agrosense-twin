import { WeatherData } from "./types";















export type CropId = "rice" | "maize" | "wheat" | "sugarcane";

export const CROPS: { id: CropId; label: string }[] = [
  { id: "rice", label: "Rice" },
  { id: "maize", label: "Maize" },
  { id: "wheat", label: "Wheat" },
  { id: "sugarcane", label: "Sugarcane" },
];

                                                                           
export interface Window {
  min?: number;
  max?: number;
}

                                                                  
export type UnevaluableCriterion =
  | "growth_stage"
  | "night_temp"
  | "day_length"
  | "leaf_wetness"
  | "exposure_hours"
  | "qualitative_humidity"
  | "rainfall_pattern";

export const UNEVALUABLE_LABELS: Record<UnevaluableCriterion, string> = {
  growth_stage: "Growth stage",
  night_temp: "Night temperature band",
  day_length: "Day length",
  leaf_wetness: "Leaf wetness duration",
  exposure_hours: "Required exposure hours",
  qualitative_humidity: "Humidity threshold",
  rainfall_pattern: "Rainfall pattern",
};

export const UNEVALUABLE_REASONS: Record<UnevaluableCriterion, string> = {
  growth_stage: "Requires an operator-supplied sowing date.",
  night_temp: "Requires day/night minima from accumulated history.",
  day_length: "Not yet computed from site latitude and date.",
  leaf_wetness: "Requires hours of continuous canopy wetness.",
  exposure_hours: "Requires how long the condition has persisted.",
  qualitative_humidity: 'Source records only "high", with no numeric threshold.',
  rainfall_pattern: 'Source records a pattern ("recent", "irregular"), not a value.',
};

export interface DiseaseRule {
  id: string;
  crop: CropId;
  disease: string;
                                            
  airTemp?: Window;
                                     
  humidity?: Window;
                             
  rainfall?: Window;
                                    
  requiresCloud?: boolean;
  unevaluable: UnevaluableCriterion[];
                                                                          
  source: string;
                                                                 
  caveat?: string;
}

                                                                    
export const CLOUD_COVER_THRESHOLD = 70;

export const DISEASE_RULES: DiseaseRule[] = [
                                                                               
                                                                              
                                                           
  {
    id: "rice-blast",
    crop: "rice",
    disease: "Blast",
    airTemp: { min: 25, max: 30 },
    unevaluable: ["night_temp", "day_length"],
    source: "Rice!A3 — day 25–30 °C, night 16–20 °C, day length 10 h, night 10 h, stage Any",
  },
  {
    id: "rice-brown-spot",
    crop: "rice",
    disease: "Brown Spot",
    airTemp: { min: 28, max: 30 },
    humidity: { min: 90 },
    requiresCloud: true,
    unevaluable: ["rainfall_pattern"],
    source: "Rice!A4 — day 28–30 °C, humidity 0.90%, cloudy, recent rainfall, stage Any",
    caveat:
      "Source cell Rice!I4 holds 0.009 under a percent format, rendering as 0.90%. Corrected to 90% here: brown spot requires high humidity, and 0.9% would make the rule permanently true.",
  },
  {
    id: "rice-bacterial-blight",
    crop: "rice",
    disease: "Bacterial blight",
    airTemp: { min: 28, max: 30 },
    humidity: { min: 70, max: 90 },
    rainfall: { min: 30 },
    requiresCloud: true,
    unevaluable: ["growth_stage"],
    source: "Rice!A5 — day 28–30 °C, humidity 70–90%, cloudy, rainfall >30 mm, seedling to flowering",
    caveat:
      "The >30 mm figure has no stated accumulation period. It is compared against the current hourly rainfall, which is stricter than the source likely intended.",
  },
  {
    id: "rice-damping-off",
    crop: "rice",
    disease: "Damping off",
    airTemp: { min: 28, max: 30 },
    humidity: { min: 90 },
    requiresCloud: true,
    unevaluable: ["growth_stage", "rainfall_pattern"],
    source: "Rice!A6 — day 28–30 °C, humidity >90%, cloudy, irregular rainfall, seedling to tillering",
  },
  {
    id: "rice-sheath-blight",
    crop: "rice",
    disease: "Sheath Blight",
    airTemp: { min: 28, max: 32 },
    humidity: { min: 85 },
    requiresCloud: true,
    unevaluable: ["growth_stage"],
    source: "Rice!A7 — day 28–32 °C, humidity >85%, cloudy, tillering to reproductive",
  },
  {
    id: "rice-false-smut",
    crop: "rice",
    disease: "False Smut",
    airTemp: { min: 22, max: 27 },
    humidity: { min: 70 },
    requiresCloud: true,
    unevaluable: ["growth_stage"],
    source: "Rice!A8 — day 22–27 °C, humidity >70%, cloudy, panicle to flowering",
  },

                                                                               
  {
    id: "maize-downy-mildew",
    crop: "maize",
    disease: "Downy mildew",
    unevaluable: ["qualitative_humidity", "exposure_hours"],
    source: 'Maize!A3 — humidity "high", time "6=18". No temperature given.',
    caveat:
      'No numeric criterion of any kind is present, so this rule can never be evaluated. The "6=18" notation is also unresolved.',
  },
  {
    id: "maize-leaf-blight",
    crop: "maize",
    disease: "Leaf blight",
    airTemp: { min: 18, max: 27 },
    unevaluable: ["qualitative_humidity", "exposure_hours"],
    source: 'Maize!A4 — 18–27 °C, humidity "high humid", 6 h',
  },
  {
    id: "maize-gray-leaf-spot",
    crop: "maize",
    disease: "Gray leaf spot",
    airTemp: { min: 25, max: 32.5 },
    humidity: { min: 90 },
    unevaluable: ["exposure_hours"],
    source: "Maize!A5 — 25–32.5 °C, R.H >90, 12 h",
  },
  {
    id: "maize-stalk-rot",
    crop: "maize",
    disease: "Stalk rot",
    airTemp: { min: 18, max: 35 },
    humidity: { min: 90 },
    unevaluable: [],
    source: "Maize!A6 — 18–35 °C, R.H >90",
  },
  {
    id: "maize-seedling-rot",
    crop: "maize",
    disease: "Seedling rot",
    airTemp: { min: 30 },
    unevaluable: [],
    source: 'Maize!A7 — ">30" recorded in the High temp. column, no low temp.',
    caveat:
      'Interpreted as "above 30 °C". The value sits in the High temp. column, which structurally implies an upper bound, but ">30" reads as a lower bound. Needs confirmation.',
  },
  {
    id: "maize-common-rust",
    crop: "maize",
    disease: "Common rust",
    airTemp: { min: 16, max: 24 },
    humidity: { min: 95 },
    unevaluable: ["exposure_hours"],
    source: "Maize!A8 — 16–24 °C, R.H >95, 6 h",
  },

                                                                               
  {
    id: "wheat-blast",
    crop: "wheat",
    disease: "Blast",
    airTemp: { min: 18, max: 20 },
    unevaluable: ["qualitative_humidity", "leaf_wetness"],
    source: 'Wheat!A3 — 18–20 °C, R.H "high", 40 wetness hours',
  },
  {
    id: "wheat-leaf-rust",
    crop: "wheat",
    disease: "Leaf rust",
    unevaluable: [],
    source: "Wheat!A4 — name only; every threshold column is empty.",
    caveat: "The source row carries no data, so no risk can be assessed.",
  },

                                                                               
  {
    id: "sugarcane-smut",
    crop: "sugarcane",
    disease: "Smut",
    airTemp: { min: 25, max: 30 },
    humidity: { min: 70, max: 80 },
    unevaluable: ["growth_stage"],
    source: 'Sugarcane!A3 — 25–30 °C, R.H ">70-80", tillering, "Warm and Humid"',
    caveat: 'The ">70-80" notation is read as the 70–80% band.',
  },
  {
    id: "sugarcane-red-rot",
    crop: "sugarcane",
    disease: "Red rot",
    airTemp: { min: 29.4, max: 31 },
    humidity: { min: 90 },
    unevaluable: [],
    source: "Sugarcane!A4 — 29.4–31 °C, R.H 90%",
  },
  {
    id: "sugarcane-wilt",
    crop: "sugarcane",
    disease: "Wilt",
    airTemp: { min: 30, max: 35 },
    humidity: { min: 50, max: 60 },
    unevaluable: [],
    source: 'Sugarcane!A5 — 30–35 °C, R.H ">50-60"',
    caveat: 'The ">50-60" notation is read as the 50–60% band.',
  },
];

                                                                                

export type RiskStatus = "favourable" | "not_favourable" | "insufficient_data";

export interface CriterionResult {
  label: string;
  detail: string;
  met: boolean;
}

export interface RuleEvaluation {
  rule: DiseaseRule;
  status: RiskStatus;
  met: CriterionResult[];
  unmet: CriterionResult[];
  unevaluable: UnevaluableCriterion[];
}

function formatWindow(w: Window, unit: string): string {
  if (w.min !== undefined && w.max !== undefined) return `${w.min}–${w.max} ${unit}`;
  if (w.min !== undefined) return `≥ ${w.min} ${unit}`;
  if (w.max !== undefined) return `≤ ${w.max} ${unit}`;
  return `any ${unit}`;
}

function inWindow(value: number, w: Window): boolean {
  if (w.min !== undefined && value < w.min) return false;
  if (w.max !== undefined && value > w.max) return false;
  return true;
}

export function evaluateRule(rule: DiseaseRule, weather: WeatherData): RuleEvaluation {
  const met: CriterionResult[] = [];
  const unmet: CriterionResult[] = [];

  const check = (ok: boolean, label: string, detail: string) => {
    (ok ? met : unmet).push({ label, detail, met: ok });
  };

  if (rule.airTemp) {
    check(
      inWindow(weather.temperature, rule.airTemp),
      "Air temperature",
      `needs ${formatWindow(rule.airTemp, "°C")} · now ${weather.temperature.toFixed(1)} °C`
    );
  }
  if (rule.humidity) {
    check(
      inWindow(weather.humidity, rule.humidity),
      "Relative humidity",
      `needs ${formatWindow(rule.humidity, "%")} · now ${weather.humidity.toFixed(0)} %`
    );
  }
  if (rule.rainfall) {
    check(
      inWindow(weather.precipitation, rule.rainfall),
      "Rainfall",
      `needs ${formatWindow(rule.rainfall, "mm")} · now ${weather.precipitation.toFixed(1)} mm`
    );
  }
  if (rule.requiresCloud) {
    check(
      weather.cloudCover >= CLOUD_COVER_THRESHOLD,
      "Cloud cover",
      `needs ≥ ${CLOUD_COVER_THRESHOLD} % · now ${weather.cloudCover.toFixed(0)} %`
    );
  }

  let status: RiskStatus;
  if (met.length + unmet.length === 0) {
    status = "insufficient_data";
  } else if (unmet.length === 0) {
    status = "favourable";
  } else {
    status = "not_favourable";
  }

  return { rule, status, met, unmet, unevaluable: rule.unevaluable };
}

export function evaluateCrop(crop: CropId, weather: WeatherData): RuleEvaluation[] {
  return DISEASE_RULES.filter((rule) => rule.crop === crop).map((rule) =>
    evaluateRule(rule, weather)
  );
}
