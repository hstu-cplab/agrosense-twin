**AgroSense Control** is a **digital twin** of the BRAC Nursery weather station at
Nilphamari, Bangladesh. It carries every station sample through the full
five-layer twin stack — physical asset → data acquisition → integration &
processing → model & simulation → visualization & control — and renders that
orchestration live.

The system replaces guesswork with live sensor data, a virtual replica, derived
physics and transparent crop analytics — enabling faster, data-backed decisions
for planting, irrigation and hazard response.

---

## Key Features

- **Top-tab navigation** — Architecture · Dashboard · Sensors · 3D Twin · Yield
  Forecast · Disease Forecast, with settings / profile / theme / language as
  icons in the top-right. Each tab carries its `L1`–`L5` layer badge.
- **Twin Architecture tab** — Live orchestration of all five layers: per-layer
  throughput, latency, health, transform log and the payload handed between
  stages on every tick, with an end-to-end trace and residual-drift meter.
- **Physical-Layer simulator + 96 h forward roll-out** — A physically-plausible
  environment generator (diurnal cycle, rain cells, wind gusts, barometric
  drift, solar model, fault injection) that also runs *forward* from a cloned
  state to give the twin a real 96-hour forecast. Runs with **no Firebase** via
  *Simulation Mode*.
- **Yield Forecast tab** — Attainable-yield estimate (t/ha) for all 16 crops:
  `potential × fit^0.55 × Π(stress terms)`, where the stress terms (heat, water
  balance vs ET₀, VPD, lodging) read the forward roll-out. Hero pick, per-crop
  multiplier breakdown, confidence band and a 7-day environmental outlook — each
  crop with a real photo.
- **Disease Forecast tab** — The deterministic rule engine evaluated against the
  forward roll-out: a Now / +6 h / +12 h / +24 h / +48 h favourability matrix per
  crop with a trend arrow, above the full current-reading rule detail.
- **3D Digital Twin** — `three.js` replica of the mast plus a crop field that
  reacts to suitability, wind and heat; derived physics (dew point, heat index,
  VPD, ET₀, solar load, comfort); a +15/+30/+60 min forecast; twin↔asset
  residuals and a fidelity score; and **what-if scenario sliders** that flow
  through the physics, 3D scene and crop scores.
- **Data Acquisition panel** — The raw edge frame on the Sensor Telemetry tab:
  RSSI, link latency, packet loss, battery and all seven raw channels with QA.
- **Firebase Authentication**, **Operations Configuration** (units, polling,
  calibration offsets that feed Layer 3) and **Operator Profile** — retained.
- **Light / dark theme** — professional light theme is the default; toggle in the
  header (persisted per browser, `?theme=light|dark` to force). All data-viz
  colours, the 3D canvas and charts are theme-aware via a token system
  (`src/index.css` + `src/theme/ThemeProvider.tsx`).
- **Bangla (বাংলা) language mode** — full-app toggle in the header
  (`?lang=en|bn`); navigation, headers, labels, status, KPIs and crop names are
  bilingual. Strings live in `src/i18n/bn.ts`; untranslated strings fall back to
  English.

---

## Hardware

### Sensor Array

| Sensor | Purpose | Image |
|--------|---------|-------|
| **Wind Speed Sensor** | Measures surface wind velocity for upper-atmosphere monitoring | <img src="images/wind speed sensor.jpeg" width="220"> |
| **Rain Bucket Sensor** | 200mm tipping-bucket aperture for precipitation accumulation | <img src="images/rain bucket sensor.jpeg" width="220"> |
| **Humidity Sensor** | Air relative humidity and thermal air reading | <img src="images/himidity sensor.jpeg" width="220"> |

### Complete Stand Setup

<p align="center">
  <img src="images/complete stand setup.jpeg" alt="Complete Sensor Stand Setup" width="600">
</p>

---

## Circuit Diagram

<p align="center">
  <img src="images/circuit image by camera.jpeg" alt="Circuit Diagram" width="700">
</p>

<p align="center">
  <i>Figure: Wiring and microcontroller connectivity for the sensor array.</i>
</p>

---

## Folder Structure

```
Brac-Weather-Station/
├── frontend/                    # the deployable app (Vite + React 19 + TS)
│   ├── index.html · package.json · tsconfig.json · vite.config.ts
│   ├── vercel.json              # Vercel build config
│   ├── .env.example             # optional VITE_FIREBASE_* overrides
│   └── src/
│       ├── App.tsx · main.tsx · index.css
│       ├── firebase.ts · auth.ts · firestore.ts · types.ts · mockData.ts · diseaseRules.ts
│       ├── theme/               # ThemeProvider (light/dark tokens, usePalette)
│       ├── i18n/                # I18nProvider + bn.ts (Bangla dictionary)
│       ├── twin/                # the 5-layer twin core (see ARCHITECTURE.md)
│       │   ├── layers.ts · physicalLayer.ts · pipeline.ts · derivations.ts
│       │   ├── forecast.ts · yieldModel.ts · cropCatalog.ts · TwinProvider.tsx
│       └── components/
│           ├── ArchitectureView · DashboardView · SensorReadingsView
│           ├── DigitalTwinView · YieldForecastView · DiseaseForecastView
│           ├── SettingsView · ProfileView · LoginView
│           ├── StationCanvas · WeatherStation · SceneLighting · CropField · …  (3D)
│           └── CropPhoto · CropImage · twin/LayerBadge
├── backend/crop_model_artifacts/   # retained kNN model files + notes
├── images/                          # photos used in this README
├── firestore.rules
├── Forecast.xlsx                    # source data for the disease thresholds
└── README.md · ARCHITECTURE.md · PROJECT_PRESENTATION.md · DEPLOYMENT.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS 4 |
| **Authentication** | Firebase Auth (Email/Password) |
| **Database** | Cloud Firestore (User Profiles) |
| **Weather Data** | Cloud Firestore (`sensor_readings`) |
| **Icons** | Lucide React |
| **Animations** | Motion (Framer Motion) |
| **3D / Twin core** | three.js, @react-three/fiber + drei |
| **Twin orchestration** | `frontend/src/twin/` — layers, simulator, pipeline, derivations, crop catalogue, context |
| **Theming** | CSS-variable token system (`src/index.css`) + `src/theme/ThemeProvider.tsx` (`usePalette()` for charts) |
| **i18n** | `src/i18n/` — English-keyed dictionary, `useT()` / `useI18n()` |
| **Crop imagery** | Wikimedia Commons photos (`twin/cropCatalog.ts` → `CROP_PHOTOS`) with SVG-illustration fallback (`components/CropPhoto.tsx`) |
| **Backend/ML** | Python, scikit-learn (kNN artifacts — retained; suitability engine used in-app) |

---

## Twin orchestration modules (`frontend/src/twin/`)

| Module | Layer | Role |
|--------|-------|------|
| `layers.ts` | — | Static description of the 5 layers + tab→layer map |
| `physicalLayer.ts` | L1 | Synthetic environment + Firestore→raw-frame adapter |
| `pipeline.ts` | L2–L5 | `runPipeline()` — acquire → integrate → model → visualize, with per-stage telemetry |
| `forecast.ts` | L4 | `simulateForecast()` — forward model roll-out + daily summaries |
| `derivations.ts` | L4 | Psychrometric / agro-met physics (dew point, VPD, ET₀, …) |
| `cropCatalog.ts` | L4 | 16-crop catalogue + photos + transparent suitability scoring |
| `yieldModel.ts` | L4 | `estimateYield()` — attainable-yield estimate with stress terms |
| `TwinProvider.tsx` | L5 | Tick loop, Firestore/simulator source, forecast, `useTwin()` context, what-if |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
cd frontend
npm install
```

### Firebase (optional)

The app **ships with a working demo Firebase project baked in**, so it runs and
builds with no configuration. **Simulation Mode** needs nothing at all.

To use your own project, set the `VITE_FIREBASE_*` variables (`frontend/.env` or
Vercel env vars) — see `frontend/.env.example` — then enable Email/Password auth,
create a Firestore database, and deploy `firestore.rules`.

### Run Development Server

```bash
npm run dev
```

Then either sign in, or click **Enter Simulation Mode** (or open
`http://localhost:3000/?sim=1`) to run the full twin stack with no Firebase.
Deep-link a tab with `?tab=architecture` (also `dashboard`, `sensors`,
`digitaltwin`, `yield`, `disease`), force a theme with `?theme=light|dark`, and
a language with `?lang=en|bn`.

### Build for Production

```bash
npm run build          # → frontend/dist/
npm run preview        # serve the build at http://localhost:4173
```

### Deploy

Push the whole repo to GitHub and import it on Vercel with **Root Directory =
`frontend`** — full walkthrough in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Lint / Type Check

```bash
npm run lint
```

---

## Demo

<p align="center">
  <img src="images/demo video screen cast.gif" alt="AgroSense Control Demo Walkthrough" width="800">
</p>

---

## Status

| Module | Status |
|--------|--------|
| **Twin Architecture** | Active — live 5-layer orchestration |
| **Physical-Layer simulator / Simulation Mode** | Active |
| **Login / Signup** | Active — Firebase Auth + Firestore |
| **Weather Feed** | Active — Firestore `sensor_readings`, auto-fallback to simulator |
| **Sensor Telemetry + Acquisition frame** | Active |
| **3D Digital Twin + physics + forecast + what-if** | Active |
| **Crop Intelligence (suitability + images)** | Active — trapezoid envelope engine |
| **Crop Disease Risk** | Active — deterministic rules + crop imagery |
| **Operations Config** | Active — calibration offsets feed Layer 3 |
| **Operator Profile** | Active — Firestore-backed with update sync |

---

## Roadmap

- Connect physical sensor array via MQTT / serial bridge
- Retrain crop/yield model on curated field datasets
- Activate anomaly-detection model for automated alerts
- Add multi-operator role management
- Deploy SMS gateway for field team notifications

---

<p align="center">
  <b>AgroSense Control</b> — Smarter Decisions for Sustainable Agriculture
</p>
