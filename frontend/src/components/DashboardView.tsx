import React, { useState, useEffect, useRef, useCallback } from "react";
import { Wind, CloudRain, Thermometer, Droplets, Sun, Gauge, AlertTriangle, Database } from "lucide-react";
import { WeatherData, SystemSettings } from "../types";
import { formatTemperature, formatWindSpeed, formatPrecipitation, formatPressure } from "../mockData";
import { fetchSensorReadings, readingToChartPoint, ChartPoint, describeFirestoreError } from "../firestore";
import { PipelineHistoryPoint } from "../twin/pipeline";
import { usePalette } from "../theme/ThemeProvider";
import { useT } from "../i18n/I18nProvider";

interface DashboardViewProps {
  weather: WeatherData;
  settings: SystemSettings;
  onNavigateToTab: (tab: string) => void;
  twinHistory?: PipelineHistoryPoint[];
}

const CHART_HEIGHT = 200;

function generateTimeLabels(hours: number): string[] {
  if (hours <= 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return [
      `${mins}m`,
      `${Math.round(mins * 0.75)}m`,
      `${Math.round(mins * 0.5)}m`,
      `${Math.round(mins * 0.25)}m`,
      "Now",
    ];
  }
  return [
    `${hours}h`,
    `${Math.round(hours * 0.75)}h`,
    `${Math.round(hours * 0.5)}h`,
    `${Math.round(hours * 0.25)}h`,
    "Now",
  ];
}

function generatePath(values: number[], minVal: number, maxVal: number, width: number, height: number, padLeft: number, padRight: number, padTop: number, padBottom: number): string {
  if (values.length < 2) return "";
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const range = maxVal - minVal || 1;

  const points = values.map((val, i) => {
    const x = padLeft + (i / (values.length - 1)) * plotWidth;
    const y = padTop + plotHeight - ((val - minVal) / range) * plotHeight;
    return { x, y };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` Q ${cpx} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

interface MetricChartProps {
  data: ChartPoint[];
  color: string;
  getValue: (d: ChartPoint) => number;
  formatValue: (v: number) => string;
  label: string;
  unit: string;
  rangeHours: number;
}

function MetricChart({ data, color, getValue, formatValue, label, rangeHours }: MetricChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const values = data.map(getValue);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const dataRange = dataMax - dataMin || 1;
  const yLabels = [0, 1, 2, 3, 4].map((i) => dataMin + dataRange * (i / 4));

  const padLeft = 55;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 20;
  const svgWidth = 1000;
  const svgHeight = CHART_HEIGHT;

  const path = generatePath(values, dataMin, dataMax, svgWidth, svgHeight, padLeft, padRight, padTop, padBottom);
  const gid = `grad-${label.replace(/\W/g, "")}`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setHoverX(x);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

   const hoveredIndex = hoverX !== null ? Math.min(Math.max(0, Math.round(hoverX * (data.length - 1))), data.length - 1) : null;
  const hoveredValue = hoveredIndex !== null ? values[hoveredIndex] : null;

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-hair rounded-xl p-4 shadow-md flex flex-col items-center justify-center" style={{ height: `${CHART_HEIGHT + 48}px` }}>
        <div className="text-center text-ink-muted">
          <span className="material-symbols-outlined text-2xl mb-1 opacity-40">database</span>
          <p className="font-headline text-xs">No recorded readings</p>
          <p className="font-mono text-[9px] mt-0.5">Data persists as parameters arrive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-hair rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase">
          {label}
        </h3>
        {hoveredValue !== null && (
          <span className="font-mono text-xs text-ink-strong font-semibold ml-auto">
            {formatValue(hoveredValue)}
          </span>
        )}
      </div>
      <div
        ref={chartRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full bg-elev border border-hair rounded-lg overflow-hidden cursor-crosshair select-none"
        style={{ height: `${CHART_HEIGHT}px` }}
      >
        <div className="absolute left-2 top-2 bottom-6 flex flex-col justify-between font-mono text-[9px] text-ink-muted pointer-events-none z-10">
          {yLabels.reverse().map((val, i) => (
            <span key={i} className="text-right">
              {val.toFixed(1)}
            </span>
          ))}
        </div>

        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {path && (
            <>
              <path
                d={`${path} L ${svgWidth - padRight} ${svgHeight - padBottom} L ${padLeft} ${svgHeight - padBottom} Z`}
                fill={`url(#${gid})`}
                className="opacity-30"
              />
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="2"
                className="opacity-90"
              />
            </>
          )}
          {hoverX !== null && (
            <line
              x1={`${hoverX * 100}%`}
              y1="0"
              x2={`${hoverX * 100}%`}
              y2="100%"
              stroke={color}
              strokeWidth="1"
              className="opacity-50"
            />
          )}
          {hoveredIndex !== null && (
            <circle
              cx={`${(hoveredIndex / (data.length - 1)) * 100}%`}
              cy={`${padTop + (svgHeight - padTop - padBottom) - ((hoveredValue - dataMin) / dataRange) * (svgHeight - padTop - padBottom)}`}
              r="4"
              fill={color}
              className="opacity-90"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          )}
        </svg>
      </div>
      <div className="flex justify-between mt-1 font-mono text-[9px] text-ink-faint px-1">
        {generateTimeLabels(rangeHours).map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function twinHistoryToChartPoints(points: PipelineHistoryPoint[]): ChartPoint[] {
  return points.map((p) => ({
    time: new Date(p.ts),
    wind: p.windSpeed,
    precipitation: p.precipitation,
    temp: p.temperature,
    humidity: p.humidity,
    light: p.light,
    pressure: p.pressure,
  }));
}

export default function DashboardView({
  weather,
  settings,
  onNavigateToTab,
  twinHistory = [],
}: DashboardViewProps) {
  const [liveStamp, setLiveStamp] = useState("");
  const [timeRange, setTimeRange] = useState(24);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [usingTwinBuffer, setUsingTwinBuffer] = useState(false);
  const palette = usePalette();
  const t = useT();

  const loadReadings = useCallback(async () => {
    setLoading(true);
    try {
      const readings = await fetchSensorReadings(timeRange);
      if (readings.length === 0 && twinHistory.length > 1) {
        setChartData(twinHistoryToChartPoints(twinHistory));
        setUsingTwinBuffer(true);
      } else {
        setChartData(readings.map(readingToChartPoint));
        setUsingTwinBuffer(false);
      }
      setReadError(null);
    } catch (err) {
      console.error("Failed to load sensor readings from Firestore", err);
      if (twinHistory.length > 1) {
        setChartData(twinHistoryToChartPoints(twinHistory));
        setUsingTwinBuffer(true);
        setReadError(null);
      } else {
        setReadError(describeFirestoreError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange, twinHistory]);

  useEffect(() => {
    loadReadings();
    const interval = setInterval(loadReadings, 15000);
    return () => clearInterval(interval);
  }, [loadReadings]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const str = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
      setLiveStamp(str);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hair pb-4">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-ink-strong mb-1">{t("Welcome back, Operator")}</h1>
          <p className="font-mono text-sm text-ink-muted flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-accent">
              location_on
            </span>
            {t("Location: Brac Nursery")}</p>
        </div>
        <div className="text-left md:text-right">
          <div className="font-mono text-base font-medium text-accent" id="live-time">
            {liveStamp || "Connecting..."}
          </div>
          <div className="text-xs text-c-green font-semibold tracking-wide uppercase mt-1 flex items-center md:justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-c-green animate-pulse"></span>{t("System Nominal")}</div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group transition-all duration-300 shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Wind className="w-16 h-16 text-accent" />
          </div>
          <div>
            <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase mb-2">{t("Surface Wind")}</h3>
            <div className="font-headline text-5xl font-semibold text-ink-strong flex items-baseline gap-1">
              {formatWindSpeed(weather.windSpeed, settings.unitSystem).split(" ")[0]}
              <span className="font-mono text-sm font-semibold text-accent ml-1">
                {formatWindSpeed(weather.windSpeed, settings.unitSystem).split(" ")[1]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#4ade80]"></div>
            <span className="font-mono text-xs text-accent">Status: Normal</span>
          </div>
        </div>

        <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group transition-all duration-300 shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <CloudRain className="w-16 h-16 text-c-amber" />
          </div>
          <div>
            <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase mb-2">{t("Precipitation")}</h3>
            <div className="font-headline text-5xl font-semibold text-ink-strong flex items-baseline gap-1">
              {formatPrecipitation(weather.precipitation, settings.unitSystem).split(" ")[0]}
              <span className="font-mono text-sm font-semibold text-c-amber ml-1">
                {formatPrecipitation(weather.precipitation, settings.unitSystem).split(" ")[1]}
              </span>
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="px-2 py-0.5 rounded bg-c-amber/20 border border-c-amber/30">
              <span className="font-mono text-[10px] uppercase font-bold text-c-amber tracking-wider">
                Status: Warning
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group transition-all duration-300 shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Thermometer className="w-16 h-16 text-accent" />
          </div>
          <div>
            <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase mb-2">{t("Atmosphere")}</h3>
            <div className="font-headline text-5xl font-semibold text-ink-strong flex items-baseline gap-1">
              {formatTemperature(weather.temperature, settings.unitSystem).split(" ")[0]}
              <span className="font-headline text-xl text-ink-muted ml-1">
                {formatTemperature(weather.temperature, settings.unitSystem).split(" ")[1]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#4ade80]"></div>
            <span className="font-mono text-xs text-accent">Status: Normal</span>
          </div>
        </div>

        <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group transition-all duration-300 shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Droplets className="w-16 h-16 text-c-cyan" />
          </div>
          <div>
            <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase mb-2">{t("Humidity")}</h3>
            <div className="font-headline text-5xl font-semibold text-ink-strong flex items-baseline gap-1">
              {weather.humidity.toFixed(1)}
              <span className="font-mono text-sm font-semibold text-c-cyan ml-1">%</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-c-cyan shadow-[0_0_8px_#22d3ee]"></div>
            <span className="font-mono text-xs text-c-cyan">Status: Normal</span>
          </div>
        </div>

        <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group transition-all duration-300 shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Sun className="w-16 h-16 text-c-amber" />
          </div>
          <div>
            <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase mb-2">{t("Solar Irradiance")}</h3>
            <div className="font-headline text-5xl font-semibold text-ink-strong flex items-baseline gap-1">
              {Math.round(weather.light)}
              <span className="font-mono text-sm font-semibold text-c-amber ml-1">%</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-c-amber shadow-[0_0_8px_#fbbf24]"></div>
            <span className="font-mono text-xs text-c-amber">Status: Normal</span>
          </div>
        </div>

        <div className="bg-surface hover:bg-surface border border-hair rounded-xl p-6 flex flex-col justify-between min-h-[140px] relative overflow-hidden group transition-all duration-300 shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Gauge className="w-16 h-16 text-c-violet" />
          </div>
          <div>
            <h3 className="font-headline text-xs text-ink-muted font-bold tracking-widest uppercase mb-2">{t("Barometric Pressure")}</h3>
            <div className="font-headline text-5xl font-semibold text-ink-strong flex items-baseline gap-1">
              {formatPressure(weather.pressure, settings.unitSystem).split(" ")[0]}
              <span className="font-mono text-sm font-semibold text-c-violet ml-1">
                {formatPressure(weather.pressure, settings.unitSystem).split(" ")[1]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-2 h-2 rounded-full bg-c-violet shadow-[0_0_8px_#a78bfa]"></div>
            <span className="font-mono text-xs text-c-violet">Status: Normal</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="font-headline text-lg font-medium text-ink-strong mb-0.5 flex items-center gap-2">
              <Database className="w-4 h-4 text-c-sky" />
              Telemetry: Last {timeRange}h Trend {usingTwinBuffer ? "(Twin buffer)" : "(Firestore)"}
            </h2>
            <p className="text-xs text-ink-muted">
              {usingTwinBuffer
                ? "Firestore has no history in range — showing the in-memory twin sample buffer from this session."
                : `Historical sensor curves persisted to Firestore for the last ${timeRange} hours.`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {loading && (
              <span className="font-mono text-[10px] text-c-sky bg-c-sky/10 px-2 py-0.5 rounded">
                Refreshing...
              </span>
            )}
            <span className="font-mono text-[10px] text-accent bg-accent/10 px-2.5 py-0.5 rounded-full font-bold">
              {chartData.length} pts
            </span>
            <div className="inline-flex items-center gap-0.5 bg-elev border border-hair rounded-lg p-0.5 text-xs">
              {[1, 6, 12, 24, 48].map((h) => (
                <button
                  key={h}
                  onClick={() => setTimeRange(h)}
                  className={`px-2.5 py-1 rounded font-mono font-bold transition-all ${
                    timeRange === h
                      ? "bg-accent text-on-accent shadow-md"
                      : "text-ink-muted hover:text-ink-strong hover:bg-fill"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {readError && (
          <div className="bg-c-red/10 border border-c-red/30 rounded-xl p-4 mb-2 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-c-red flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-c-red uppercase tracking-wider">
                Telemetry history unavailable
              </p>
              <p className="text-xs text-ink mt-0.5 leading-relaxed break-words">
                {readError}
              </p>
            </div>
          </div>
        )}

        {!readError && chartData.length === 0 && !loading && (
          <div className="bg-surface border border-hair rounded-xl p-6 text-center text-ink-muted mb-2">
            <p className="text-sm">No historical readings found for the last {timeRange} hours.</p>
            <p className="text-xs mt-1">Sensor parameters are persisted to Firestore in real-time as they arrive.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricChart
            data={chartData}
            color={palette.green}
            getValue={(d) => d.wind}
            formatValue={(v) => formatWindSpeed(v, settings.unitSystem)}
            label="Wind Speed"
            unit="m/s"
            rangeHours={timeRange}
          />
          <MetricChart
            data={chartData}
            color={palette.blue}
            getValue={(d) => d.temp}
            formatValue={(v) => formatTemperature(v, settings.unitSystem)}
            label="Temperature"
            unit="°C"
            rangeHours={timeRange}
          />
          <MetricChart
            data={chartData}
            color={palette.cyan}
            getValue={(d) => d.humidity}
            formatValue={(v) => `${v.toFixed(1)}%`}
            label="Humidity"
            unit="%"
            rangeHours={timeRange}
          />
          <MetricChart
            data={chartData}
            color={palette.amber}
            getValue={(d) => d.light}
            formatValue={(v) => `${Math.round(v)}%`}
            label="Solar Irradiance"
            unit="%"
            rangeHours={timeRange}
          />
          <MetricChart
            data={chartData}
            color={palette.violet}
            getValue={(d) => d.pressure}
            formatValue={(v) => formatPressure(v, settings.unitSystem)}
            label="Barometric Pressure"
            unit="hPa"
            rangeHours={timeRange}
          />
          <MetricChart
            data={chartData}
            color={palette.green}
            getValue={(d) => d.precipitation}
            formatValue={(v) => formatPrecipitation(v, settings.unitSystem)}
            label="Precipitation"
            unit="mm"
            rangeHours={timeRange}
          />
        </div>
      </section>

      <section className="bg-accent/10 border border-accent/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded tracking-wide uppercase">
            Threshold Rule Engine
          </span>
          <h3 className="font-headline text-lg font-semibold text-ink-strong mt-2 mb-1.5">{t("Crop Disease Risk")}</h3>
          <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
            Evaluates live temperature, humidity, rainfall and cloud cover against transcribed
            disease-favourability thresholds for rice, maize, wheat and sugarcane.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab("disease")}
          className="bg-accent hover:bg-accent text-on-accent font-bold py-2.5 px-5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider flex-shrink-0 whitespace-nowrap"
        >
          <span>{t("Open Risk Assessment")}</span>
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
        </button>
      </section>
    </div>
  );
}
