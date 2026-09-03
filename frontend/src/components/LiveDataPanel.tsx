import React, { useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "motion/react";
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Sun,
} from "lucide-react";
import { WeatherData } from "../types";

interface LiveDataPanelProps {
  weather: WeatherData;
  windKmh: number;
  condition: string;
}

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  warning?: boolean;
  glowColor?: string;
}

function AnimatedValue({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    motionValue.set(value);
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v * 100) / 100));
    return unsub;
  }, [value, motionValue, spring]);

  return <span>{display}</span>;
}

function SensorCard({ label, value, unit, icon: Icon, warning, glowColor }: SensorCardProps) {
  const isWarning = !!warning;
  return (
    <motion.div
      animate={
        isWarning
          ? {
              boxShadow: [
                `0 0 0px ${glowColor || "rgba(251,191,36,0.0)"}`,
                `0 0 18px ${glowColor || "rgba(251,191,36,0.45)"}`,
                `0 0 0px ${glowColor || "rgba(251,191,36,0.0)"}`,
              ],
            }
          : {}
      }
      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
      className={`bg-surface border rounded-lg p-3 flex items-center gap-3 ${
        isWarning ? "border-orange-500/60" : "border-hair"
      }`}
    >
      <div className={`p-2 rounded-md ${isWarning ? "bg-orange-500/15" : "bg-fill"}`}>
        <Icon className={`w-4 h-4 ${isWarning ? "text-orange-300" : "text-ink-muted"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-ink-muted font-bold">
          {label}
        </p>
        <p className="text-sm font-semibold text-ink-strong font-mono">
          <AnimatedValue value={value} /> <span className="text-ink-muted">{unit}</span>
        </p>
      </div>
    </motion.div>
  );
}

export default function LiveDataPanel({ weather, windKmh, condition }: LiveDataPanelProps) {
  const temp = weather.temperature ?? 0;
  const humidity = weather.humidity ?? 0;
  const pressure = weather.pressure ?? 0;
  const precipitation = weather.precipitation ?? 0;

  return (
    <div className="bg-surface border border-hair rounded-xl p-4 space-y-3">
      <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-1">
        Live Telemetry
      </h3>
      <SensorCard
        label="Temperature"
        value={temp}
        unit="°C"
        icon={Thermometer}
        warning={temp > 38}
        glowColor={temp > 38 ? "rgba(239,68,68,0.5)" : undefined}
      />
      <SensorCard
        label="Humidity"
        value={humidity}
        unit="%"
        icon={Droplets}
        warning={humidity > 80}
        glowColor="rgba(56,189,248,0.45)"
      />
      <SensorCard
        label="Wind Speed"
        value={windKmh}
        unit="km/h"
        icon={Wind}
        warning={windKmh > 40}
        glowColor="rgba(251,191,36,0.5)"
      />
      <SensorCard
        label="Pressure"
        value={pressure}
        unit="hPa"
        icon={Gauge}
      />
      <SensorCard
        label="Precipitation"
        value={precipitation}
        unit="mm"
        icon={CloudRain}
        warning={precipitation > 0}
        glowColor="rgba(96,165,250,0.45)"
      />
      <SensorCard
        label="Solar Irradiance"
        value={weather.light}
        unit="%"
        icon={Sun}
      />
      <div className="pt-2 border-t border-hair">
        <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
          Condition: {condition}
        </p>
      </div>
    </div>
  );
}
