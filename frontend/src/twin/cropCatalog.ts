import { NormalizedObservation } from "./types";

/* ------------------------------------------------------------------ *
 *  Crop catalogue + transparent suitability engine.
 *
 *  The shipped kNN artifact (backend/crop_model_artifacts) trained at
 *  ~chance accuracy on a low-separability dataset, so instead of a
 *  black-box call we score each crop by how well the *current* station
 *  observation sits inside that crop's agronomic envelope. Every number
 *  is inspectable in the UI.
 * ------------------------------------------------------------------ */

export type Range = [min: number, ideal: number, max: number];

export interface CropProfile {
  id: string;
  name: string;
  bnName: string;
  family: string;
  season: string;
  durationDays: number;
  /** agronomic envelopes: [hard-min, ideal, hard-max] */
  temp: Range;      // °C, mean air temp
  humidity: Range;  // % RH
  rainfall: Range;  // mm over the assessment window (hourly proxy here)
  light: Range;     // % of clear-sky irradiance
  note: string;
  /** dominant + accent colours for the generated illustration */
  art: { sky: string; ground: string; plant: string; accent: string; kind: CropArtKind };
}

type CropArtKind =
  | "grain"      // rice / wheat — seed head on a stalk
  | "cob"        // maize
  | "cane"       // sugarcane / jute — tall segmented stalk
  | "legume"     // lentil / chickpea — bushy with pods
  | "tuber"      // potato — leafy top + tuber
  | "flower"     // mustard — yellow florets
  | "fruit-tree" // mango / banana / papaya
  | "vine";      // tomato / chilli / cucumber / watermelon

export const CROP_CATALOG: CropProfile[] = [
  {
    id: "rice", name: "Rice (Aman)", bnName: "ধান", family: "Poaceae",
    season: "Jun – Nov (Aman)", durationDays: 145,
    temp: [20, 29, 38], humidity: [60, 85, 100], rainfall: [2, 9, 30], light: [35, 70, 100],
    note: "Wet-season staple; tolerates standing water and high humidity.",
    art: { sky: "#bfe3c8", ground: "#6f9e5c", plant: "#e8d36b", accent: "#c9a227", kind: "grain" },
  },
  {
    id: "jute", name: "Jute (Tossa)", bnName: "পাট", family: "Malvaceae",
    season: "Mar – Aug", durationDays: 120,
    temp: [24, 31, 40], humidity: [60, 82, 95], rainfall: [3, 8, 22], light: [45, 78, 100],
    note: "Warm-humid fibre crop; needs pre-monsoon showers then heat.",
    art: { sky: "#cfe8d8", ground: "#5f8f4e", plant: "#7fae4d", accent: "#4c7a37", kind: "cane" },
  },
  {
    id: "maize", name: "Maize", bnName: "ভুট্টা", family: "Poaceae",
    season: "Nov – Apr (Rabi)", durationDays: 130,
    temp: [16, 26, 35], humidity: [40, 62, 85], rainfall: [0, 3, 12], light: [55, 82, 100],
    note: "Rabi cereal; high light demand, sensitive to waterlogging.",
    art: { sky: "#d8ecc9", ground: "#7a9c4f", plant: "#e7c14b", accent: "#3f7d2f", kind: "cob" },
  },
  {
    id: "wheat", name: "Wheat", bnName: "গম", family: "Poaceae",
    season: "Nov – Mar", durationDays: 110,
    temp: [10, 20, 28], humidity: [35, 55, 75], rainfall: [0, 2, 8], light: [50, 78, 100],
    note: "Cool-season grain; heat above 28 °C at grain-fill cuts yield.",
    art: { sky: "#e5ecc6", ground: "#9a8b4e", plant: "#e4cf7a", accent: "#b8953c", kind: "grain" },
  },
  {
    id: "potato", name: "Potato", bnName: "আলু", family: "Solanaceae",
    season: "Nov – Feb", durationDays: 95,
    temp: [8, 18, 26], humidity: [50, 70, 90], rainfall: [0, 2, 9], light: [45, 70, 95],
    note: "Cool nights drive tuber bulking; hates frost and heat.",
    art: { sky: "#dcebd0", ground: "#8a6f4b", plant: "#4f8a3d", accent: "#c9a05a", kind: "tuber" },
  },
  {
    id: "mustard", name: "Mustard", bnName: "সরিষা", family: "Brassicaceae",
    season: "Oct – Jan", durationDays: 90,
    temp: [10, 21, 30], humidity: [40, 58, 78], rainfall: [0, 1, 6], light: [50, 76, 100],
    note: "Short-duration oilseed slotted between rice crops.",
    art: { sky: "#e7edc5", ground: "#7f9a4d", plant: "#f2c53d", accent: "#d99b1e", kind: "flower" },
  },
  {
    id: "lentil", name: "Lentil", bnName: "মসুর", family: "Fabaceae",
    season: "Oct – Feb", durationDays: 105,
    temp: [12, 22, 30], humidity: [35, 55, 75], rainfall: [0, 1, 6], light: [50, 75, 100],
    note: "Pulse crop; drought-hardy, fixes nitrogen, dislikes wet feet.",
    art: { sky: "#e3ebc8", ground: "#8f9a55", plant: "#6d9a4c", accent: "#b7a94e", kind: "legume" },
  },
  {
    id: "chickpea", name: "Chickpea", bnName: "ছোলা", family: "Fabaceae",
    season: "Oct – Feb", durationDays: 110,
    temp: [14, 24, 32], humidity: [30, 50, 70], rainfall: [0, 1, 5], light: [55, 80, 100],
    note: "Rabi pulse for dry, receding-moisture fields.",
    art: { sky: "#e6eccb", ground: "#96a05a", plant: "#7aa64e", accent: "#c1b05a", kind: "legume" },
  },
  {
    id: "sugarcane", name: "Sugarcane", bnName: "আখ", family: "Poaceae",
    season: "Feb – Mar (plant)", durationDays: 330,
    temp: [20, 30, 40], humidity: [55, 78, 95], rainfall: [2, 7, 20], light: [50, 82, 100],
    note: "Long-duration; loves heat, humidity and steady moisture.",
    art: { sky: "#cfe8d4", ground: "#5d8a4a", plant: "#8fb85a", accent: "#4a7038", kind: "cane" },
  },
  {
    id: "banana", name: "Banana", bnName: "কলা", family: "Musaceae",
    season: "Year-round", durationDays: 300,
    temp: [18, 28, 38], humidity: [60, 80, 95], rainfall: [2, 6, 18], light: [45, 75, 100],
    note: "Perennial; wind above 8 m/s shreds leaves and topples mats.",
    art: { sky: "#cfe9d6", ground: "#5f8f4f", plant: "#3f7d33", accent: "#e6c24a", kind: "fruit-tree" },
  },
  {
    id: "mango", name: "Mango", bnName: "আম", family: "Anacardiaceae",
    season: "Flower Dec – Feb", durationDays: 3650,
    temp: [15, 27, 40], humidity: [40, 60, 85], rainfall: [0, 2, 10], light: [55, 85, 100],
    note: "Orchard tree; dry, clear spells set flowers, rain spreads anthracnose.",
    art: { sky: "#dbebc7", ground: "#6f8f4c", plant: "#356b2c", accent: "#e8a53a", kind: "fruit-tree" },
  },
  {
    id: "papaya", name: "Papaya", bnName: "পেঁপে", family: "Caricaceae",
    season: "Year-round", durationDays: 300,
    temp: [18, 27, 36], humidity: [55, 72, 90], rainfall: [1, 4, 12], light: [50, 80, 100],
    note: "Fast fruiting but waterlogging rots the collar within days.",
    art: { sky: "#d9ead0", ground: "#6b9350", plant: "#3d7a34", accent: "#e9992f", kind: "fruit-tree" },
  },
  {
    id: "chili", name: "Chilli", bnName: "মরিচ", family: "Solanaceae",
    season: "Oct – Mar", durationDays: 150,
    temp: [18, 26, 35], humidity: [45, 65, 85], rainfall: [0, 2, 9], light: [50, 80, 100],
    note: "Warm-season spice; flowers drop under heat + wet foliage.",
    art: { sky: "#e0ebc9", ground: "#7a9a4f", plant: "#3f7d33", accent: "#d63a2f", kind: "vine" },
  },
  {
    id: "tomato", name: "Tomato", bnName: "টমেটো", family: "Solanaceae",
    season: "Oct – Feb", durationDays: 120,
    temp: [15, 24, 32], humidity: [45, 65, 85], rainfall: [0, 2, 8], light: [50, 80, 100],
    note: "Cool-dry set; nights above 24 °C or RH above 85 % abort fruit.",
    art: { sky: "#e2ecca", ground: "#7f9a50", plant: "#3f7d33", accent: "#e0402e", kind: "vine" },
  },
  {
    id: "cucumber", name: "Cucumber", bnName: "শসা", family: "Cucurbitaceae",
    season: "Feb – Apr / Jun – Aug", durationDays: 70,
    temp: [18, 27, 35], humidity: [55, 72, 92], rainfall: [1, 4, 14], light: [45, 75, 100],
    note: "Quick cucurbit; humid warmth speeds vines but also mildew.",
    art: { sky: "#dcecc9", ground: "#749650", plant: "#3f7d33", accent: "#6fae3e", kind: "vine" },
  },
  {
    id: "watermelon", name: "Watermelon", bnName: "তরমুজ", family: "Cucurbitaceae",
    season: "Jan – Apr", durationDays: 90,
    temp: [20, 29, 38], humidity: [35, 55, 75], rainfall: [0, 1, 6], light: [60, 88, 100],
    note: "Dry riverbed crop; needs heat, sun and low humidity to sugar up.",
    art: { sky: "#e6edc7", ground: "#9a8f52", plant: "#3f7d33", accent: "#3f8f3a", kind: "vine" },
  },
];

/**
 * Real crop photographs — Wikimedia Commons (public-domain / CC), hot-linked
 * from the stable upload CDN. `<CropPhoto>` falls back to the bundled SVG
 * illustration if any of these fail to load or the viewer is offline.
 */
export const CROP_PHOTOS: Record<string, string> = {
  rice: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Rice_field_and_country_house_bangladesh.JPG/960px-Rice_field_and_country_house_bangladesh.JPG",
  jute: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Jute_field.jpg/960px-Jute_field.jpg",
  maize: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Cornfield_in_South_Africa.jpg/960px-Cornfield_in_South_Africa.jpg",
  wheat: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Wheat_close-up.JPG/960px-Wheat_close-up.JPG",
  potato: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Potato_and_cross_section.jpg/960px-Potato_and_cross_section.jpg",
  mustard: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Mustard_field_near_Chandigarh.jpg/960px-Mustard_field_near_Chandigarh.jpg",
  lentil: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/3_types_of_lentil.jpg/960px-3_types_of_lentil.jpg",
  chickpea: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/CSIRO_ScienceImage_3223_Chickpeas_in_glasshouse.jpg/960px-CSIRO_ScienceImage_3223_Chickpeas_in_glasshouse.jpg",
  sugarcane: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Sugarcane_field_in_Salem.jpg/960px-Sugarcane_field_in_Salem.jpg",
  banana: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Bananas_white_background_DS.jpg/960px-Bananas_white_background_DS.jpg",
  mango: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Mango_-_single.jpg/960px-Mango_-_single.jpg",
  papaya: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Papaya_cross_section_BNC.jpg/960px-Papaya_cross_section_BNC.jpg",
  chili: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Capsicum_annuum_fruits_IMGP0049.jpg/960px-Capsicum_annuum_fruits_IMGP0049.jpg",
  tomato: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Bright_red_tomato_and_cross_section02.jpg/960px-Bright_red_tomato_and_cross_section02.jpg",
  cucumber: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Cucumis_sativus0.jpg",
  watermelon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Watermelon_cross_BNC.jpg/960px-Watermelon_cross_BNC.jpg",
};

export const CROP_BY_ID: Record<string, CropProfile> = CROP_CATALOG.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, CropProfile>
);

/* ----------------------- suitability engine --------------------- */

export interface FactorScore {
  key: "temp" | "humidity" | "rainfall" | "light";
  label: string;
  value: number;
  range: Range;
  score: number; // 0-100
  verdict: "ideal" | "acceptable" | "marginal" | "hostile";
}

export interface CropAssessment {
  crop: CropProfile;
  score: number; // 0-100 weighted
  rank: number;
  factors: FactorScore[];
  headline: string;
  limiting: FactorScore | null;
}

const WEIGHTS: Record<FactorScore["key"], number> = {
  temp: 0.34,
  humidity: 0.24,
  rainfall: 0.24,
  light: 0.18,
};

const LABELS: Record<FactorScore["key"], string> = {
  temp: "Air temperature",
  humidity: "Relative humidity",
  rainfall: "Rainfall (window)",
  light: "Solar irradiance",
};

/**
 * Membership score 0-100 for one factor against its [min, ideal, max] envelope.
 *
 * - temp / humidity: symmetric window — both ends are hard limits.
 * - rainfall: a ceiling constraint. Excess rain (waterlogging, disease) is the
 *   real risk; a dry instant is not penalised hard because irrigation and soil
 *   storage buffer it, so the low side only eases to a 70 floor.
 * - light: a soft target — the twin can't see tomorrow's sun, so a dim reading
 *   (e.g. night, overcast) eases only to a 55 floor rather than to zero.
 */
function factorScore(key: FactorScore["key"], value: number, range: Range): FactorScore {
  const [min, ideal, max] = range;
  let s: number;

  if (key === "rainfall") {
    if (value <= ideal) {
      const lowFloor = 70;
      s = value >= min
        ? 100 - ((ideal - value) / Math.max(1, ideal - min)) * (100 - lowFloor - 12)
        : lowFloor;
    } else if (value >= max) {
      s = 0;
    } else {
      s = ((max - value) / Math.max(1, max - ideal)) * 100;
    }
  } else if (key === "light") {
    const lowFloor = 55;
    if (value >= ideal && value <= max) s = 100 - ((value - ideal) / Math.max(1, max - ideal)) * 20;
    else if (value > max) s = Math.max(0, 80 - (value - max) * 4);
    else s = lowFloor + (Math.max(0, value - min) / Math.max(1, ideal - min)) * (100 - lowFloor);
  } else {
    if (value <= min || value >= max) s = 0;
    else if (value === ideal) s = 100;
    else if (value < ideal) s = ((value - min) / (ideal - min)) * 100;
    else s = ((max - value) / (max - ideal)) * 100;
  }

  s = Math.max(0, Math.min(100, Math.round(s)));
  const verdict: FactorScore["verdict"] =
    s >= 80 ? "ideal" : s >= 55 ? "acceptable" : s >= 30 ? "marginal" : "hostile";
  return { key, label: LABELS[key], value: Math.round(value * 10) / 10, range, score: s, verdict };
}

export function assessCrop(crop: CropProfile, o: NormalizedObservation): Omit<CropAssessment, "rank"> {
  const factors: FactorScore[] = [
    factorScore("temp", o.temperature, crop.temp),
    factorScore("humidity", o.humidity, crop.humidity),
    factorScore("rainfall", o.precipitation, crop.rainfall),
    factorScore("light", o.light, crop.light),
  ];
  const score = Math.round(
    factors.reduce((sum, f) => sum + f.score * WEIGHTS[f.key], 0)
  );
  const limiting = [...factors].sort((a, b) => a.score - b.score)[0];
  const headline =
    score >= 78
      ? "Strongly suited to current conditions"
      : score >= 58
        ? "Workable — watch the limiting factor"
        : score >= 35
          ? "Marginal — conditions are off-window"
          : "Not advisable right now";
  return { crop, score, factors, headline, limiting: limiting.score < 80 ? limiting : null };
}

export function rankCrops(o: NormalizedObservation): CropAssessment[] {
  return CROP_CATALOG.map((c) => assessCrop(c, o))
    .sort((a, b) => b.score - a.score)
    .map((a, i) => ({ ...a, rank: i + 1 }));
}
