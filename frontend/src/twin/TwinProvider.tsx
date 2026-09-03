import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalibrationOffsets } from "../types";
import {
  fetchLatestSensorReading,
  describeFirestoreError,
  STATION_ID,
} from "../firestore";
import { auth } from "../firebase";
import {
  createPhysicalState,
  stepPhysicalLayer,
  firestoreReadingToRawFrame,
  PhysicalLayerState,
} from "./physicalLayer";
import { runPipeline, PipelineHistoryPoint } from "./pipeline";
import { TwinState, TwinSource } from "./types";
import { simulateForecast, ForecastPoint } from "./forecast";

interface TwinContextValue {
  state: TwinState | null;
  history: PipelineHistoryPoint[];
  source: TwinSource;
  /** true when Firestore was requested but we fell back to simulation */
  simulatedFallback: boolean;
  firestoreError: string | null;
  lastTickMs: number;
  /** multi-day forward model roll-out (hourly points, ~48 h) */
  forecast: ForecastPoint[];
  /** operator override applied on top of the live observation (what-if) */
  scenario: ScenarioOverride;
  setScenario: (s: ScenarioOverride) => void;
}

export interface ScenarioOverride {
  enabled: boolean;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  light: number;
}

const HISTORY_CAP = 240;

const TwinContext = createContext<TwinContextValue | null>(null);

interface TwinProviderProps {
  active: boolean;
  pollingRate: number;
  calibration: CalibrationOffsets;
  /** demo / simulation mode — never touch Firestore */
  forceSimulation: boolean;
  children: React.ReactNode;
}

export function TwinProvider({
  active,
  pollingRate,
  calibration,
  forceSimulation,
  children,
}: TwinProviderProps) {
  const [state, setState] = useState<TwinState | null>(null);
  const [source, setSource] = useState<TwinSource>(
    forceSimulation ? "simulation" : "firestore"
  );
  const [simulatedFallback, setSimulatedFallback] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [lastTickMs, setLastTickMs] = useState(0);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [scenario, setScenario] = useState<ScenarioOverride>({
    enabled: false,
    temperature: 28,
    humidity: 75,
    windSpeed: 3,
    precipitation: 0,
    light: 60,
  });

  const historyRef = useRef<PipelineHistoryPoint[]>([]);
  const [history, setHistory] = useState<PipelineHistoryPoint[]>([]);
  const physStateRef = useRef<PhysicalLayerState>(createPhysicalState());
  const forecastCounterRef = useRef(0);
  const calibrationRef = useRef(calibration);
  calibrationRef.current = calibration;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const tick = async () => {
      const now = Date.now();
      let raw;
      let tickSource: TwinSource = "simulation";

      if (forceSimulation) {
        raw = stepPhysicalLayer(physStateRef.current, now);
        tickSource = "simulation";
      } else {
        try {
          const reading = auth.currentUser
            ? await fetchLatestSensorReading(STATION_ID)
            : null;
          if (cancelled) return;
          if (reading && now - reading.ts < 3_600_000) {
            raw = firestoreReadingToRawFrame(reading);
            tickSource = "firestore";
            setFirestoreError(null);
            setSimulatedFallback(false);
          } else {
            raw = stepPhysicalLayer(physStateRef.current, now);
            tickSource = "simulation";
            setSimulatedFallback(true);
            if (!reading) {
              setFirestoreError(
                "No recent Firestore reading — twin is running on the Physical-Layer simulator."
              );
            }
          }
        } catch (err) {
          if (cancelled) return;
          raw = stepPhysicalLayer(physStateRef.current, now);
          tickSource = "simulation";
          setSimulatedFallback(true);
          setFirestoreError(describeFirestoreError(err));
        }
      }

      if (cancelled || !raw) return;
      setSource(tickSource);

      const twin = runPipeline({
        raw,
        source: tickSource,
        calibration: calibrationRef.current,
        history: historyRef.current,
        now,
      });

      const point: PipelineHistoryPoint = {
        ts: twin.observation.timestamp,
        temperature: twin.observation.temperature,
        humidity: twin.observation.humidity,
        windSpeed: twin.observation.windSpeed,
        pressure: twin.observation.pressure,
        light: twin.observation.light,
        precipitation: twin.observation.precipitation,
      };
      historyRef.current = [...historyRef.current, point].slice(-HISTORY_CAP);
      setHistory(historyRef.current);
      setState(twin);
      setLastTickMs(now);

      // refresh the forward model roll-out roughly every 3rd tick
      forecastCounterRef.current += 1;
      if (forecastCounterRef.current % 3 === 1) {
        setForecast(
          simulateForecast(physStateRef.current, now, {
            hours: 96,
            stepMinutes: 60,
            calibration: calibrationRef.current,
          })
        );
      }
    };

    tick();
    const everyMs = Math.max(2, Math.min(60, pollingRate)) * 1000;
    const id = setInterval(tick, everyMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active, pollingRate, forceSimulation]);

  const value = useMemo<TwinContextValue>(
    () => ({
      state,
      history,
      source,
      simulatedFallback,
      firestoreError,
      lastTickMs,
      forecast,
      scenario,
      setScenario,
    }),
    [state, history, source, simulatedFallback, firestoreError, lastTickMs, forecast, scenario]
  );

  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>;
}

export function useTwin(): TwinContextValue {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error("useTwin must be used inside <TwinProvider>");
  return ctx;
}

/** Observation with any active what-if scenario override folded in. */
export function useEffectiveObservation() {
  const { state, scenario } = useTwin();
  return useMemo(() => {
    if (!state) return null;
    if (!scenario.enabled) return state.observation;
    return {
      ...state.observation,
      temperature: scenario.temperature,
      humidity: scenario.humidity,
      windSpeed: scenario.windSpeed,
      precipitation: scenario.precipitation,
      light: scenario.light,
      solarIrradiance: Math.round((scenario.light / 100) * 1000),
      cloudCover: Math.round(Math.max(0, Math.min(100, 100 - scenario.light))),
    };
  }, [state, scenario]);
}
