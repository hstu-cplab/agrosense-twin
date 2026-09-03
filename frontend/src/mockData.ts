import { SystemSettings, OperatorProfile, Crop } from "./types";





export const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" fill="#12251b"/>' +
      '<circle cx="32" cy="25" r="11" fill="#4ade80" fill-opacity="0.55"/>' +
      '<path d="M8 64c0-13.25 10.75-24 24-24s24 10.75 24 24z" fill="#4ade80" fill-opacity="0.55"/>' +
      "</svg>"
  );

export const INITIAL_SETTINGS: SystemSettings = {
  unitSystem: "metric",
  timezone: "UTC (Coordinated Universal Time)",
  pollingRate: 10,
  theme: "dark",
  notifications: {
    smsAlerts: true,
    emailReports: true,
    maintenanceReminders: false,
  },
  calibration: {
    anemometerBaseline: 0.02,
    barometerOffset: -0.1,
    hygrometerDrift: 2.4,
  },
  calibrationStatus: {
    anemometer: "optimal",
    barometer: "optimal",
    hygrometer: "requires_attention",
  },
};

export const INITIAL_PROFILE: OperatorProfile = {
  name: "Dr. Elias Vance",
  role: "Lead Meteorologist",
  contact: "+880 1711-000000",
  upazilla: "Brac Nursery",
  zila: "Nilphamari",
  address: "Brac Nursery, Nilphamari",
  email: "elias.vance@example.com",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGy9qdaP099MffCFFTv58ivQf7bTW3ESUGU5do4rtW6RR_bR6M-ymWlI5xLQrtg9Tdjz8WYHNA983OmxDwhWArkpBc7vJL2ItNxkOTU6SD_kvpo60L72ua_qp-UeSNmce-VFAlqSFZCJcUoX67EdmsDsjYu9tpqq_nvHWhLURlxvNOUQfQFpxjuH7uxaaW8f32meyLGwUOYink-K2VFC_Z5n8SUYKQyuE9QxaLEs7gGxryH03KxI2UfXM5bk-OWbz8gBogCxdNUM",
};

export function formatTemperature(celsius: number, system: "metric" | "imperial"): string {
  if (system === "imperial") {
    const f = (celsius * 1.8 + 32).toFixed(1);
    return `${f} °F`;
  }
  return `${celsius.toFixed(1)} °C`;
}

export function formatWindSpeed(mps: number, system: "metric" | "imperial"): string {
  if (system === "imperial") {
    const mph = (mps * 2.23694).toFixed(1);
    return `${mph} mph`;
  }
  return `${mps.toFixed(1)} m/s`;
}

export function formatPrecipitation(mm: number, system: "metric" | "imperial"): string {
  if (system === "imperial") {
    const inches = (mm * 0.0393701).toFixed(2);
    return `${inches} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatPressure(hpa: number, system: "metric" | "imperial"): string {
  if (system === "imperial") {
    const inhg = (hpa * 0.02953).toFixed(2);
    return `${inhg} inHg`;
  }
  return `${hpa.toFixed(0)} hPa`;
}

export function getCropRecommendations(temp: number, moisture: number): { primary: Crop; alternatives: Crop[] } {
  if (temp < 18) {
    const score = Math.min(100, Math.max(40, Math.floor(100 - Math.abs(moisture - 45))));
    return {
      primary: {
        id: "wheat",
        name: "Winter Wheat",
        matchScore: score,
        details: `Current telemetry models indicate optimal conditions for Winter Wheat. Stable soil temperatures of ${temp.toFixed(1)}°C and incoming precipitation patterns align with the required germination window.`,
        description: "Excellent crop selection for cool and moderately moist soils. Germinates reliably under these settings.",
        suitabilityBullets: [
          `Soil moisture is currently at ${moisture.toFixed(0)}%, ideal for initial root establishment.`,
          "Forecasted drop in ambient temperature matches vernalization requirements.",
        ],
      },
      alternatives: [
        {
          id: "maize",
          name: "Maize",
          matchScore: Math.max(10, Math.round(90 - Math.abs(temp - 25) * 4)),
          details: "Sub-optimal temperature forecasted.",
          description: "Prefers warmer growing periods.",
          suitabilityBullets: [],
        },
        {
          id: "soybeans",
          name: "Soybeans",
          matchScore: Math.max(10, Math.round(moisture - 5)),
          details: "Current soil moisture is reasonable but suboptimal.",
          description: "Requires consistent moist soils.",
          suitabilityBullets: [],
        },
        {
          id: "sorghum",
          name: "Sorghum",
          matchScore: Math.max(5, Math.round(moisture / 2)),
          details: "Not recommended for current cold season conditions.",
          description: "Thrives in warm, dry climates.",
          suitabilityBullets: [],
        },
      ],
    };
  } else {
    const score = Math.min(100, Math.max(40, Math.floor(100 - Math.abs(moisture - 55))));
    return {
      primary: {
        id: "maize",
        name: "Maize (Corn)",
        matchScore: score,
        details: `Warm soil temperatures of ${temp.toFixed(1)}°C are highly optimal for rapid Maize seed germination. Higher solar irradiance supports rapid early stage photosynthesis.`,
        description: "An excellent crop selection for warm thermal windows and medium precipitation rates.",
        suitabilityBullets: [
          `Telemetry reports soil temperature is warm, promoting early thermal germination.`,
          `Relative crop moisture index matches seedbed specifications nicely.`,
        ],
      },
      alternatives: [
        {
          id: "soybeans",
          name: "Soybeans",
          matchScore: Math.min(95, Math.round(moisture * 1.2)),
          details: "Strong growth potential under bright weather.",
          description: "Very favorable warm weather profiles.",
          suitabilityBullets: [],
        },
        {
          id: "wheat",
          name: "Winter Wheat",
          matchScore: Math.max(10, Math.round(60 - Math.abs(temp - 12) * 2)),
          details: "Temperature warm; risk of premature header shoot.",
          description: "Suffers under sustained heat waves.",
          suitabilityBullets: [],
        },
        {
          id: "sorghum",
          name: "Sorghum",
          matchScore: Math.min(98, Math.round(100 - Math.abs(moisture - 25))),
          details: "Highly resilient option in dry soil conditions.",
          description: "Extremely drought-tolerant option for summer fields.",
          suitabilityBullets: [],
        },
      ],
    };
  }
}
