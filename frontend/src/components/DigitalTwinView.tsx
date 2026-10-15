import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Gauge,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  TrendingUp,
  Activity,
  Sprout,
  ChevronDown,
  Check,
  Layers,
} from "lucide-react";
import StationCanvas from "./StationCanvas";
import TwinStatusBar from "./TwinStatusBar";
import HistoryCharts from "./HistoryCharts";
import LayerBadge from "./twin/LayerBadge";
import { useTwin, useEffectiveObservation } from "../twin/TwinProvider";
import { derivePhysics } from "../twin/derivations";
import { usePalette } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/I18nProvider";
import { rankCrops, CROP_CATALOG, assessCrop } from "../twin/cropCatalog";

export default function DigitalTwinView() {
  const { state, scenario, setScenario, source } = useTwin();
  const obs = useEffectiveObservation();
  const { t, lang } = useI18n();
  const pal = usePalette();

  const [selectedCropId, setSelectedCropId] = useState<string>("auto");
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  const ranked = useMemo(() => (obs ? rankCrops(obs) : []), [obs]);
  const topFit = ranked[0];

  const activeCrop = useMemo(() => {
    if (selectedCropId === "auto") return topFit?.crop ?? CROP_CATALOG[0];
    if (selectedCropId === "mixed") return null;
    return CROP_CATALOG.find((c) => c.id === selectedCropId) ?? topFit?.crop ?? CROP_CATALOG[0];
  }, [selectedCropId, topFit]);

  const activeScore = useMemo(() => {
    if (!obs) return 70;
    if (selectedCropId === "auto") return topFit?.score ?? 70;
    if (selectedCropId === "mixed") {
      return Math.round(
        CROP_CATALOG.reduce((sum, c) => sum + assessCrop(c, obs).score, 0) / CROP_CATALOG.length
      );
    }
    return activeCrop ? assessCrop(activeCrop, obs).score : 70;
  }, [selectedCropId, activeCrop, topFit, obs]);

  const active3dCropId = selectedCropId === "auto" ? (topFit?.crop.id ?? "rice") : selectedCropId;

  if (!state || !obs) {
    return (
      <div className="text-center text-ink-muted py-20 font-mono text-sm">
        {t("Spinning up the virtual replica…")}
      </div>
    );
  }

  const physics = scenario.enabled ? derivePhysics(obs) : state.physics;
  const windKmh = obs.windSpeed * 3.6;

  const resetScenario = () =>
    setScenario({
      ...scenario,
      enabled: false,
      temperature: state.observation.temperature,
      humidity: state.observation.humidity,
      windSpeed: state.observation.windSpeed,
      precipitation: state.observation.precipitation,
      light: state.observation.light,
    });

  return (
    <div className="space-y-5 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-hair pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
              {t("3D Digital Twin")}
            </h1>
            <LayerBadge layer="model" variant="full" />
          </div>
          <p className="text-sm text-ink-muted">
            {t(
              source === "simulation"
                ? "Virtual replica of the BRAC Nursery mast — geometry, derived physics and a short-horizon forecast, all driven by the simulator feed."
                : "Virtual replica of the BRAC Nursery mast — geometry, derived physics and a short-horizon forecast, all driven by the live feed."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-fill border border-hair-strong rounded-lg">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-xs text-accent font-bold uppercase tracking-wider">
            {t("Fidelity")} {state.fidelityPct}%
          </span>
        </div>
      </header>

      <TwinStatusBar timestamp={obs.timestamp ?? state.updatedAt} />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column: Crop Selector + 3D Viewport */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Interactive Crop Selection & 3D Canopy Controller */}
          <div className="bg-surface border border-hair rounded-xl p-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-wider">
                      {t("3D Field Crop Model")}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-fill border border-hair text-ink-muted">
                      {selectedCropId === "auto"
                        ? t("Auto: Top Suitability")
                        : selectedCropId === "mixed"
                        ? t("Polyculture")
                        : activeCrop?.family}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    {selectedCropId === "mixed"
                      ? t("Interactive polyculture nursery field with mixed crop varieties")
                      : `${activeCrop ? (lang === "bn" ? activeCrop.bnName : activeCrop.name) : ""} · ${activeCrop?.note ?? ""}`}
                  </p>
                </div>
              </div>

              {/* Suitability score badge & Dropdown toggle */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold"
                  style={{
                    backgroundColor:
                      activeScore >= 70
                        ? `${pal.green}18`
                        : activeScore >= 45
                        ? `${pal.amber}18`
                        : `${pal.red}18`,
                    borderColor:
                      activeScore >= 70
                        ? `${pal.green}40`
                        : activeScore >= 45
                        ? `${pal.amber}40`
                        : `${pal.red}40`,
                    color: activeScore >= 70 ? pal.green : activeScore >= 45 ? pal.amber : pal.red,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {activeScore}% {t("Suitability")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPickerOpen(!isPickerOpen)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-ink-strong bg-fill hover:bg-fill-strong border border-hair rounded-lg transition-colors cursor-pointer"
                >
                  <span>
                    {t("All Crops")} ({CROP_CATALOG.length})
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isPickerOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Quick-selection ribbon with popular crops */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCropId("auto")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all flex-shrink-0 cursor-pointer ${
                  selectedCropId === "auto"
                    ? "bg-accent text-white font-bold shadow-xs"
                    : "bg-fill hover:bg-fill-strong text-ink border border-hair"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {t("Auto")} (
                  {topFit?.crop ? (lang === "bn" ? topFit.crop.bnName : topFit.crop.name) : "Best"}
                  )
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCropId("mixed")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all flex-shrink-0 cursor-pointer ${
                  selectedCropId === "mixed"
                    ? "bg-accent text-white font-bold shadow-xs"
                    : "bg-fill hover:bg-fill-strong text-ink border border-hair"
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{t("Mixed Nursery")}</span>
              </button>

              {[
                { id: "rice", label: "Rice", bn: "ধান" },
                { id: "maize", label: "Maize", bn: "ভুট্টা" },
                { id: "wheat", label: "Wheat", bn: "গম" },
                { id: "mustard", label: "Mustard", bn: "সরিষা" },
                { id: "jute", label: "Jute", bn: "পাট" },
                { id: "sugarcane", label: "Sugarcane", bn: "আখ" },
                { id: "potato", label: "Potato", bn: "আলু" },
                { id: "tomato", label: "Tomato", bn: "টমেটো" },
                { id: "chili", label: "Chilli", bn: "মরিচ" },
                { id: "banana", label: "Banana", bn: "কলা" },
                { id: "lentil", label: "Lentil", bn: "মসুর" },
                { id: "watermelon", label: "Watermelon", bn: "তরমুজ" },
              ].map((c) => {
                const isSel = selectedCropId === c.id;
                const cropObj = CROP_CATALOG.find((x) => x.id === c.id);
                const score = cropObj && obs ? assessCrop(cropObj, obs).score : null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCropId(c.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all flex-shrink-0 cursor-pointer ${
                      isSel
                        ? "bg-accent text-white font-bold shadow-xs"
                        : "bg-fill hover:bg-fill-strong text-ink border border-hair"
                    }`}
                  >
                    <span>{lang === "bn" ? c.bn : c.label}</span>
                    {score !== null && (
                      <span
                        className={`font-mono text-[9px] px-1 py-0.5 rounded ${
                          isSel ? "bg-white/25 text-white" : "bg-surface text-ink-muted"
                        }`}
                      >
                        {score}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Expandable full catalog dropdown grid */}
            {isPickerOpen && (
              <div className="mt-3 pt-3 border-t border-hair grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {CROP_CATALOG.map((crop) => {
                  const score = obs ? assessCrop(crop, obs).score : 0;
                  const isSel = selectedCropId === crop.id;
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => {
                        setSelectedCropId(crop.id);
                        setIsPickerOpen(false);
                      }}
                      className={`flex flex-col p-2 text-left rounded-lg border transition-all cursor-pointer ${
                        isSel
                          ? "border-accent bg-accent/10"
                          : "border-hair bg-fill hover:bg-fill-strong"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-ink-strong truncate">
                          {lang === "bn" ? crop.bnName : crop.name}
                        </span>
                        {isSel && <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1">
                        <span className="truncate">{crop.season}</span>
                        <span
                          className="font-mono font-bold"
                          style={{
                            color: score >= 70 ? pal.green : score >= 45 ? pal.amber : pal.red,
                          }}
                        >
                          {score}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3D Canvas Viewport */}
          <StationCanvas
            data={obs}
            vitality={activeScore}
            cropId={active3dCropId}
          />

          <p className="text-center text-ink-muted text-xs mt-1 font-mono">
            Drag to rotate · Scroll to zoom · 3D View:{" "}
            <span className="text-ink-strong font-semibold">
              {selectedCropId === "mixed"
                ? "Mixed Polyculture Nursery"
                : activeCrop
                ? lang === "bn"
                  ? activeCrop.bnName
                  : activeCrop.name
                : "Crop"}
            </span>{" "}
            ({activeScore}% Suitability)
          </p>
        </div>

        {/* Right Column: What-if Simulation & Derived Physics */}
        <div className="lg:w-80 flex-shrink-0 space-y-3">
          {/* what-if */}
          <div className="bg-surface border border-hair rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-c-amber" />
                {t("What-if simulation")}
              </h3>
              {scenario.enabled && (
                <button
                  onClick={resetScenario}
                  className="flex items-center gap-1 text-[9px] font-mono text-ink-muted hover:text-ink-strong uppercase cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> {t("Live")}
                </button>
              )}
            </div>
            <div className="space-y-3">
              <Slider
                label={t("Temp")}
                unit="°C"
                min={0}
                max={48}
                step={0.5}
                value={scenario.temperature}
                onChange={(v) => setScenario({ ...scenario, temperature: v, enabled: true })}
              />
              <Slider
                label={t("Humidity")}
                unit="%"
                min={0}
                max={100}
                step={1}
                value={scenario.humidity}
                onChange={(v) => setScenario({ ...scenario, humidity: v, enabled: true })}
              />
              <Slider
                label={t("Wind")}
                unit="m/s"
                min={0}
                max={30}
                step={0.5}
                value={scenario.windSpeed}
                onChange={(v) => setScenario({ ...scenario, windSpeed: v, enabled: true })}
              />
              <Slider
                label={t("Rain")}
                unit="mm"
                min={0}
                max={40}
                step={0.5}
                value={scenario.precipitation}
                onChange={(v) => setScenario({ ...scenario, precipitation: v, enabled: true })}
              />
              <Slider
                label={t("Solar")}
                unit="%"
                min={0}
                max={100}
                step={1}
                value={scenario.light}
                onChange={(v) => setScenario({ ...scenario, light: v, enabled: true })}
              />
            </div>
            {scenario.enabled && (
              <p className="mt-3 text-[10px] text-c-amber font-mono leading-relaxed">
                {t("Overriding the live feed — 3D scene, physics and crop scores reflect this scenario.")}
              </p>
            )}
          </div>

          {/* derived physics */}
          <div className="bg-surface border border-hair rounded-xl p-4">
            <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              {t("Derived physics")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Derived
                label={t("Dew point")}
                value={`${physics.dewPoint} °C`}
                icon={<Droplets className="w-3 h-3" />}
              />
              <Derived
                label={t("Feels like")}
                value={`${physics.feelsLike} °C`}
                icon={<Thermometer className="w-3 h-3" />}
              />
              <Derived
                label={t("Heat index")}
                value={`${physics.heatIndex} °C`}
                icon={<Thermometer className="w-3 h-3" />}
              />
              <Derived
                label={t("Wind chill")}
                value={`${physics.windChill} °C`}
                icon={<Wind className="w-3 h-3" />}
              />
              <Derived
                label="VPD"
                value={`${physics.vpd} kPa`}
                icon={<Gauge className="w-3 h-3" />}
                warn={physics.vpd > 2.2}
              />
              <Derived
                label="ET₀"
                value={`${physics.et0} mm/d`}
                icon={<Sun className="w-3 h-3" />}
              />
              <Derived
                label={t("Abs. humidity")}
                value={`${physics.absoluteHumidity} g/m³`}
                icon={<Droplets className="w-3 h-3" />}
              />
              <Derived
                label={t("Solar load")}
                value={`${physics.solarLoad} W/m²`}
                icon={<Sun className="w-3 h-3" />}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-hair">
              <div className="flex justify-between text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                <span>{t("Comfort index")}</span>
                <span className="text-ink-strong font-bold">{physics.comfortIndex}/100</span>
              </div>
              <div className="w-full h-1.5 bg-fill rounded">
                <div
                  className="h-1.5 rounded"
                  style={{
                    width: `${physics.comfortIndex}%`,
                    backgroundColor:
                      physics.comfortIndex > 60
                        ? pal.green
                        : physics.comfortIndex > 35
                        ? pal.amber
                        : pal.red,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* forecast + residuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-hair rounded-xl p-4">
          <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-c-sky" />
            {t("Twin forecast")}
            {scenario.enabled && (
              <span className="text-[9px] text-c-amber font-mono">(paused — scenario active)</span>
            )}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {state.forecast.map((f) => (
              <div key={f.horizonMin} className="bg-elev rounded-lg p-3 text-center">
                <div className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                  +{f.horizonMin}m
                </div>
                <div className="font-headline text-xl font-bold text-ink-strong mt-1">
                  {f.temperature}°
                </div>
                <div className="font-mono text-[9px] text-ink-muted mt-0.5">{f.humidity}% RH</div>
                <div className="font-mono text-[8px] text-c-sky mt-1">{f.confidence}% conf</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-hair rounded-xl p-4">
          <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-c-violet" />
            {t("Twin ↔ asset residuals")}
          </h3>
          {state.residuals.length > 0 ? (
            <div className="space-y-2.5">
              {state.residuals.map((r) => (
                <div key={r.field}>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-ink-muted capitalize">{r.field}</span>
                    <span className="text-ink-muted">
                      pred {r.predicted} · meas {r.measured} ·{" "}
                      <span
                        className={Math.abs(r.driftPct) > 70 ? "text-c-red" : "text-ink-strong"}
                      >
                        {r.residual >= 0 ? "+" : ""}
                        {r.residual}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-1 bg-fill rounded mt-1">
                    <div
                      className="h-1 rounded"
                      style={{
                        width: `${Math.min(100, r.driftPct)}%`,
                        backgroundColor: r.driftPct > 70 ? pal.red : pal.violet,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-ink-muted font-mono">Residual baseline warming up…</p>
          )}
        </div>
      </div>

      <HistoryCharts weather={obs} windKmh={windKmh} />
    </div>
  );
}

function Slider({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wide">{label}</span>
        <span className="font-mono text-[10px] text-c-amber font-bold">
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-fill-strong rounded-lg appearance-none cursor-pointer accent-c-amber"
      />
    </div>
  );
}

function Derived({
  label,
  value,
  icon,
  warn,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className={`bg-elev rounded-lg p-2 border ${warn ? "border-c-red/30" : "border-hair"}`}>
      <div className="flex items-center gap-1 font-mono text-[8px] text-ink-muted uppercase tracking-wider">
        <span className={warn ? "text-c-red" : "text-accent"}>{icon}</span>
        {label}
      </div>
      <div
        className={`font-headline text-sm font-bold mt-0.5 ${warn ? "text-c-red" : "text-ink-strong"}`}
      >
        {value}
      </div>
    </div>
  );
}
