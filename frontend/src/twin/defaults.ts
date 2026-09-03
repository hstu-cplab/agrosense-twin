import { NormalizedObservation } from "./types";

/** Neutral observation used before the first twin tick lands. */
export const DEFAULT_WEATHER: NormalizedObservation = {
  windSpeed: 0,
  windDirection: 0,
  precipitation: 0,
  temperature: 0,
  humidity: 0,
  light: 0,
  pressure: 0,
  cloudCover: 0,
  solarIrradiance: 0,
  condition: "Clear",
  dewPoint: 0,
  timestamp: Date.now(),
  provenance: {
    calibrationApplied: [],
    imputedFields: [],
    rejectedOutliers: [],
    smoothingWindow: 0,
  },
};
