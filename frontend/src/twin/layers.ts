import { TwinLayer, LayerId } from "./types";

/**
 * The five functional layers of the digital-twin stack, as wired into this
 * project. Each `components` entry points at a real module / view in the app.
 */
export const TWIN_LAYERS: TwinLayer[] = [
  {
    id: "physical",
    index: 1,
    name: "Physical Layer",
    tagline: "The real asset + instrumentation",
    description:
      "The BRAC Nursery weather mast at Nilphamari — anemometer, wind vane, tipping-bucket rain gauge, radiation-shielded thermistor/hygrometer, pyranometer and barometer mounted on the cross-arm, powered by a solar panel and battery.",
    responsibilities: [
      "Expose real-world state through calibrated instruments",
      "Latch samples on the microcontroller at the sensing interval",
      "Report power, firmware and self-test status",
    ],
    components: ["twin/physicalLayer.ts", "3D Digital Twin geometry", "images/complete stand setup.jpeg"],
    tech: ["ESP32 / Arduino", "Davis-style sensor array", "Solar + LiFePO₄"],
    color: "#f97316",
    icon: "radio-tower",
  },
  {
    id: "acquisition",
    index: 2,
    name: "Data Acquisition Layer",
    tagline: "Edge, radio & gateway transport",
    description:
      "Edge firmware frames each sample, timestamps it, attaches link diagnostics (RSSI, latency, packet loss) and forwards it over LoRaWAN / GSM-MQTT to the field gateway, which relays to Firestore.",
    responsibilities: [
      "Package raw channels into transmit frames",
      "Buffer during link loss and back-fill on reconnect",
      "Carry transport QoS metrics with every frame",
    ],
    components: ["twin/pipeline.ts · acquire()", "Sensor Telemetry tab", "firestore.ts"],
    tech: ["LoRaWAN", "MQTT", "Firestore ingest"],
    color: "#22d3ee",
    icon: "antenna",
  },
  {
    id: "integration",
    index: 3,
    name: "Integration & Processing Layer",
    tagline: "Normalise, calibrate, validate, store",
    description:
      "Middleware converts units to SI, applies calibration offsets, runs range/spike validation, imputes short gaps, smooths with a moving window and derives channels (cloud cover, dew point) before persisting the clean time-series.",
    responsibilities: [
      "Unit normalisation + calibration offset application",
      "Outlier rejection and gap imputation",
      "Derived-channel synthesis and time-series persistence",
    ],
    components: ["twin/pipeline.ts · integrate()", "Command Dashboard trends", "sensor_readings (Firestore)"],
    tech: ["Time-series store", "Firestore", "Rolling-window filters"],
    color: "#a78bfa",
    icon: "git-merge",
  },
  {
    id: "model",
    index: 4,
    name: "Model & Simulation Layer",
    tagline: "The digital core",
    description:
      "The virtual replica: 3D station geometry driven by live telemetry, a physics engine deriving dew point, VPD, ET₀, heat index and solar load, a short-horizon forecaster, and analytics models for crop suitability and disease-favourability.",
    responsibilities: [
      "Mirror physical state in 3D and derived physics",
      "Forecast the next interval and score twin↔asset fidelity",
      "Run crop-suitability and disease-risk analytics",
    ],
    components: ["3D Digital Twin tab", "twin/derivations.ts", "twin/cropCatalog.ts", "diseaseRules.ts"],
    tech: ["three.js / R3F", "Physics derivations", "kNN artifacts + suitability engine"],
    color: "#4ade80",
    icon: "box",
  },
  {
    id: "visualization",
    index: 5,
    name: "Visualization & Control Layer",
    tagline: "Human + autonomous interaction",
    description:
      "Dashboards, gauges, the 3D viewport, crop intelligence and alerting surfaces where operators read the twin and push decisions (calibration, crop lock-in, notifications) back toward the field.",
    responsibilities: [
      "Render twin state as dashboards, gauges and 3D",
      "Raise threshold alerts and status badges",
      "Capture operator decisions and configuration",
    ],
    components: ["Command Dashboard", "Crop Intelligence", "Architecture tab", "Configuration"],
    tech: ["React 19", "Tailwind 4", "Motion"],
    color: "#38bdf8",
    icon: "layout-dashboard",
  },
];

export const LAYER_BY_ID: Record<LayerId, TwinLayer> = TWIN_LAYERS.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<LayerId, TwinLayer>
);

/** Which layer a given app tab primarily lives in. */
export const TAB_LAYER: Record<string, LayerId> = {
  architecture: "visualization",
  dashboard: "visualization",
  sensors: "acquisition",
  digitaltwin: "model",
  yield: "model",
  disease: "model",
  settings: "visualization",
  profile: "visualization",
};
