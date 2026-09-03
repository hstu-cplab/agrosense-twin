import React from "react";
import { Wind, CloudRain, Sun, Compass, Activity, Thermometer, Database, Antenna, Radio, BatteryMedium } from "lucide-react";
import { WeatherData, SystemSettings } from "../types";
import {
  formatTemperature,
  formatWindSpeed,
  formatPrecipitation,
  formatPressure,
} from "../mockData";
import LiveDataPanel from "./LiveDataPanel";
import LayerBadge from "./twin/LayerBadge";
import { useTwin } from "../twin/TwinProvider";
import { useT } from "../i18n/I18nProvider";

interface SensorReadingsViewProps {
  weather: WeatherData;
  settings: SystemSettings;
}

export default function SensorReadingsView({
  weather,
  settings,
}: SensorReadingsViewProps) {
  const { state, source } = useTwin();
  const t = useT();
  const windUnit = settings.unitSystem === "metric" ? "m/s" : "mph";
  const rainUnit = settings.unitSystem === "metric" ? "mm" : "in";

  const displayWindSpeed = settings.unitSystem === "imperial" ? weather.windSpeed * 2.23694 : weather.windSpeed;
  const displayRainHeight = settings.unitSystem === "imperial" ? weather.precipitation * 0.0393701 : weather.precipitation;

  const maxWindDisplayValue = settings.unitSystem === "imperial" ? 80 : 35;
  const pcpPercent = Math.min(100, Math.max(0, (displayRainHeight / (settings.unitSystem === "imperial" ? 1.5 : 40)) * 100));

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const windPercent = Math.min(100, Math.max(0, (displayWindSpeed / maxWindDisplayValue) * 100));
  const strokeDashoffset = circumference - (windPercent / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
              {t("Sensor Telemetry & Gauge Arrays")}</h1>
            <LayerBadge layer="acquisition" variant="full" />
          </div>
          <p className="text-sm text-ink-muted">
            {t("Physical instrument channels and the edge acquisition frame that carries them.")}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-fill border border-hair-strong rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
          <span className="font-mono text-xs text-accent font-bold uppercase tracking-wider">
            Station Status: Synchronized
          </span>
        </div>
      </div>

      {/* Data Acquisition Layer — the edge frame carrying these channels */}
      {state && (
        <section className="bg-surface border border-hair rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-headline text-sm font-semibold text-ink-strong tracking-widest uppercase flex items-center gap-2">
              <Antenna className="w-4 h-4 text-c-cyan" />
              Acquisition Frame {state.acquired.frameId}
            </h3>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              {source === "simulation" ? "LoRaWAN · gw-nilphamari-01" : "Firestore ingest"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AcqStat icon={<Radio className="w-3.5 h-3.5" />} label="Signal" value={`${state.acquired.rssiDbm} dBm`} />
            <AcqStat icon={<Activity className="w-3.5 h-3.5" />} label="Link latency" value={`${state.acquired.linkLatencyMs} ms`} />
            <AcqStat icon={<CloudRain className="w-3.5 h-3.5" />} label="Packet loss" value={`${state.acquired.packetLossPct}%`} />
            <AcqStat icon={<BatteryMedium className="w-3.5 h-3.5" />} label="Battery" value={`${state.raw.batteryV} V`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(state.raw.channels).map(([name, ch]) => (
              <div
                key={name}
                className={`bg-elev border rounded-lg px-3 py-2 ${
                  ch.quality === "ok" ? "border-hair" : "border-c-amber/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">{name}</span>
                  <span
                    className={`font-mono text-[8px] uppercase font-bold ${
                      ch.quality === "ok" ? "text-accent" : "text-c-amber"
                    }`}
                  >
                    {ch.quality}
                  </span>
                </div>
                <div className="font-headline text-sm font-bold text-ink-strong mt-0.5">
                  {ch.raw} <span className="text-[10px] text-ink-muted">{ch.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {state.acquired.qaFlags.length > 0 && (
            <p className="font-mono text-[10px] text-c-amber leading-relaxed">
              QA: {state.acquired.qaFlags.join(" · ")}
            </p>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-hair rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-lg">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-hair-strong fill-none"
                strokeWidth="10"
              />
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-accent fill-none transition-all duration-500"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <Compass className="w-6 h-6 text-accent animate-spin-slow mb-1" />
              <div className="font-headline text-3xl font-bold text-ink-strong">
                {displayWindSpeed.toFixed(1)}
              </div>
              <div className="font-mono text-[10px] text-ink-muted">
                {windUnit}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <span className="text-[10px] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                SENSOR: SENS-ANEMO-04
              </span>
              <h3 className="font-headline text-lg font-semibold text-ink-strong mt-2">
                Wind Velocity & Azimuth
              </h3>
              <p className="text-xs text-ink-muted">
                Calculates upper-atmosphere velocity via rotating cups calibrated at standard levels.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-hair pt-4">
              <div className="bg-surface-2 p-2.5 rounded-lg border border-hair">
                <span className="font-mono text-[10px] text-ink-muted block uppercase">MIN RANGE</span>
                <span className="font-mono text-sm font-semibold text-ink-strong">
                  {settings.unitSystem === "metric" ? "0.2 m/s" : "0.4 mph"}
                </span>
              </div>
              <div className="bg-surface-2 p-2.5 rounded-lg border border-hair">
                <span className="font-mono text-[10px] text-ink-muted block uppercase">CEILING GUST</span>
                <span className="font-mono text-sm font-semibold text-c-red">
                  {formatWindSpeed(weather.windSpeed * 1.45, settings.unitSystem)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-hair rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-lg">
          <div className="bg-elev border border-hair p-4 rounded-xl flex items-end gap-3 h-44 w-full md:w-36 justify-center">
            <div className="relative w-8 h-32 bg-fill-strong rounded-lg overflow-hidden border border-hair-strong">
              <div
                className="absolute bottom-0 left-0 right-0 bg-blue-500/80 transition-all duration-1000 ease-in-out"
                style={{ height: `${pcpPercent}%` }}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-400 opacity-60 animate-pulse"></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-blue-400 text-3xl">water_drop</span>
              <div className="font-headline text-xl font-bold text-ink-strong mt-1">
                {displayRainHeight.toFixed(1)}
              </div>
              <div className="font-mono text-[10px] text-ink-muted">
                {rainUnit}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                SENSOR: SENS-RAIN-11
              </span>
              <h3 className="font-headline text-lg font-semibold text-ink-strong mt-2">
                Precipitation Bucket Volume
              </h3>
              <p className="text-xs text-ink-muted">
                Measures collection accumulation inside our 200mm tipping-bucket aperture.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-hair pt-4">
              <div className="bg-surface-2 p-2.5 rounded-lg border border-hair">
                <span className="font-mono text-[10px] text-ink-muted block uppercase">LAST 12h</span>
                <span className="font-mono text-sm font-semibold text-ink-strong">
                  {formatPrecipitation(weather.precipitation * 0.4, settings.unitSystem)}
                </span>
              </div>
              <div className="bg-surface-2 p-2.5 rounded-lg border border-hair">
                <span className="font-mono text-[10px] text-ink-muted block uppercase">STATION CAP</span>
                <span className="font-mono text-sm font-semibold text-ink-strong">
                  {settings.unitSystem === "metric" ? "100.0 mm" : "4.00 in"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveDataPanel
            weather={weather}
            windKmh={weather.windSpeed * 3.6}
            condition={weather.condition ?? ""}
          />
        </div>
        <div className="bg-surface border border-hair rounded-xl p-5 flex flex-col justify-center">
          <h3 className="font-headline text-sm font-semibold text-ink-strong tracking-widest uppercase mb-3">{t("Station Health")}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Anemometer</span>
              <span className="text-xs font-mono font-bold text-accent">OPTIMAL</span>
            </div>
            <div className="w-full bg-fill rounded-full h-1.5">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: "92%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Hygrometer</span>
              <span className="text-xs font-mono font-bold text-accent">OPTIMAL</span>
            </div>
            <div className="w-full bg-fill rounded-full h-1.5">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: "88%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Barometer</span>
              <span className="text-xs font-mono font-bold text-c-amber">RECALIBRATING</span>
            </div>
            <div className="w-full bg-fill rounded-full h-1.5">
              <div className="bg-c-amber h-1.5 rounded-full" style={{ width: "64%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-semibold text-ink-strong">
          Bento Array: Auxiliary Systems
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded bg-cyan-500/10">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="font-mono text-[10px] text-ink-muted">SENS-HYGRO-01</span>
            </div>
            <span className="text-xs text-ink-muted font-bold uppercase tracking-wide block">Relative Humidity</span>
            <div className="font-headline text-3xl font-extrabold text-ink-strong mt-1">
              {weather.humidity.toFixed(1)}<span className="text-sm font-mono text-cyan-400 ml-0.5">%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-accent text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>Optimal Comfort Level</span>
            </div>
          </div>

          <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded bg-accent/10">
                <Thermometer className="w-5 h-5 text-accent" />
              </div>
              <span className="font-mono text-[10px] text-ink-muted">SENS-TEMP-99</span>
            </div>
            <span className="text-xs text-ink-muted font-bold uppercase tracking-wide block">Thermal Air Reading</span>
            <div className="font-headline text-3xl font-extrabold text-ink-strong mt-1">
              {formatTemperature(weather.temperature, settings.unitSystem)}
            </div>
            <div className={`flex items-center gap-1.5 mt-4 text-xs font-semibold ${weather.temperature > 30 ? "text-c-amber" : "text-cyan-400"}`}>
              <span className="material-symbols-outlined text-[14px]">
                {weather.temperature > 30 ? "arrow_upward" : "arrow_downward"}
              </span>
              <span>{weather.temperature > 30 ? "High Heat Alert" : "Cool Season Baseline"}</span>
            </div>
          </div>

          <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded bg-c-amber/10">
                <Sun className="w-5 h-5 text-c-amber" />
              </div>
              <span className="font-mono text-[10px] text-ink-muted">SENS-LUX-03</span>
            </div>
            <span className="text-xs text-ink-muted font-bold uppercase tracking-wide block">Solar Irradiance</span>
            <div className="font-headline text-3xl font-extrabold text-ink-strong mt-1">
              {Math.round(weather.light)}<span className="text-sm font-mono text-c-amber ml-0.5">%</span>
            </div>
            <p className="text-[10px] text-ink-muted mt-4 leading-normal">
              Spectral analysis validates photo-active photosynthetic radiation status.
            </p>
          </div>

          <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded bg-purple-500/10">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <span className="font-mono text-[10px] text-ink-muted">SENS-BARO-12</span>
            </div>
            <span className="text-xs text-ink-muted font-bold uppercase tracking-wide block">Atmosphere Pressure</span>
            <div className="font-headline text-3xl font-extrabold text-ink-strong mt-1">
              {formatPressure(weather.pressure, settings.unitSystem)}
            </div>
            <p className="text-[10px] text-ink-muted mt-4 leading-normal">
              Barometric index is calibrated with respect to geographic elevation offsets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AcqStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-elev border border-hair rounded-lg px-3 py-2 flex items-center gap-2.5">
      <span className="text-c-cyan">{icon}</span>
      <div className="min-w-0">
        <span className="block font-mono text-[9px] text-ink-muted uppercase tracking-wider">{label}</span>
        <span className="block font-headline text-sm font-bold text-ink-strong">{value}</span>
      </div>
    </div>
  );
}
