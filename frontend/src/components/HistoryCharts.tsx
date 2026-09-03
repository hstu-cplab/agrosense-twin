import React, { useRef, useEffect } from "react";
import { WeatherData } from "../types";
import { usePalette } from "../theme/ThemeProvider";

const HISTORY_LENGTH = 24;

interface HistoryChartsProps {
  weather: WeatherData;
  windKmh: number;
}

function useRingBuffer(value: number, size = 24) {
  const buf = useRef<number[]>([]);
  const [snapshot, setSnapshot] = React.useState<number[]>([]);

  useEffect(() => {
    buf.current = [...buf.current, value].slice(-size);
    setSnapshot([...buf.current]);
  }, [value, size]);

  return snapshot;
}

function Sparkline({
  values,
  color,
  label,
  unit,
}: {
  values: number[];
  color: string;
  label: string;
  unit: string;
}) {
  if (values.length < 2) return null;

  const w = 200;
  const h = 48;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const d = `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const gid = `hgrad-${label.replace(/\W/g, "")}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="text-ink-muted font-medium">
          {values[values.length - 1]?.toFixed(1)}
          {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${d} L ${w},${h} L 0,${h} Z`}
          fill={`url(#${gid})`}
        />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function HistoryCharts({ weather, windKmh }: HistoryChartsProps) {
  const pal = usePalette();
  const tempHistory = useRingBuffer(weather.temperature);
  const windHistory = useRingBuffer(windKmh);
  const humidHistory = useRingBuffer(weather.humidity);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-fill border border-hair-strong">
      <p className="col-span-full text-xs font-medium text-ink-muted uppercase tracking-wider">
        Last 24 readings
      </p>
      <Sparkline values={tempHistory} color={pal.orange} label="Temperature" unit="°C" />
      <Sparkline values={windHistory} color={pal.cyan} label="Wind Speed" unit=" km/h" />
      <Sparkline values={humidHistory} color={pal.blue} label="Humidity" unit="%" />
    </div>
  );
}
