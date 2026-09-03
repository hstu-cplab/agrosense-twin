import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RadioTower,
  Antenna,
  GitMerge,
  Box,
  LayoutDashboard,
  Activity,
  ChevronDown,
  Cpu,
  Timer,
  Gauge,
  ArrowDown,
  Layers,
} from "lucide-react";
import { useTwin } from "../twin/TwinProvider";
import { usePalette } from "../theme/ThemeProvider";
import { useT } from "../i18n/I18nProvider";
import { TWIN_LAYERS } from "../twin/layers";
import { LayerId, LayerHealth, StageTelemetry } from "../twin/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "radio-tower": RadioTower,
  antenna: Antenna,
  "git-merge": GitMerge,
  box: Box,
  "layout-dashboard": LayoutDashboard,
};

const HEALTH_STYLE: Record<LayerHealth, { label: string; cls: string }> = {
  nominal: { label: "Nominal", cls: "text-accent bg-accent/10 border-accent/30" },
  degraded: { label: "Degraded", cls: "text-c-amber bg-c-amber/10 border-c-amber/30" },
  offline: { label: "Offline", cls: "text-c-red bg-c-red/10 border-c-red/30" },
};

function fmt(v: string | number): string {
  return typeof v === "number" ? (Number.isInteger(v) ? `${v}` : v.toFixed(2)) : v;
}

export default function ArchitectureView() {
  const { state, source, simulatedFallback, lastTickMs } = useTwin();
  const pal = usePalette();
  const t = useT();
  const [openId, setOpenId] = useState<LayerId>("model");

  const stageById = (id: LayerId): StageTelemetry | undefined =>
    state?.stages.find((s) => s.id === id);

  const openLayer = TWIN_LAYERS.find((l) => l.id === openId)!;
  const openStage = stageById(openId);

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-hair pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-accent" />
            <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
              {t("Twin Architecture")}
            </h1>
          </div>
          <p className="text-sm text-ink-muted max-w-2xl">
            {t(
              "Live orchestration of the five-layer digital-twin stack — every station sample is traced from the physical mast through acquisition, integration, the model core and the operator surface."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            label={t("Source")}
            value={source === "simulation" ? t("Simulator") : t("Firestore")}
            tone={source === "simulation" ? "amber" : "green"}
          />
          <Pill
            label={t("Twin health")}
            value={state ? t(HEALTH_STYLE[state.twinHealth].label) : "…"}
            tone={
              state?.twinHealth === "nominal"
                ? "green"
                : state?.twinHealth === "degraded"
                  ? "amber"
                  : "red"
            }
          />
          <Pill
            label={t("Fidelity")}
            value={state ? `${state.fidelityPct}%` : "…"}
            tone={(state?.fidelityPct ?? 0) >= 75 ? "green" : "amber"}
          />
          <Pill
            label={t("Last tick")}
            value={lastTickMs ? `${Math.max(0, Math.round((Date.now() - lastTickMs) / 1000))}s ago` : "…"}
            tone="slate"
          />
        </div>
      </header>

      {simulatedFallback && source === "simulation" && (
        <div className="rounded-xl border border-c-amber/25 bg-c-amber/8 px-4 py-3 text-xs text-ink-muted leading-relaxed">
          {t(
            "Firestore has no reading inside the last hour, so the Physical Layer is being driven by the on-device environment simulator. Layers 2–5 run identically on either source."
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* ---------------- layer stack ---------------- */}
        <div className="space-y-0">
          {TWIN_LAYERS.map((layer, i) => {
            const stage = stageById(layer.id);
            const Icon = ICONS[layer.icon] ?? Box;
            const isOpen = openId === layer.id;
            return (
              <div key={layer.id}>
                <motion.button
                  layout
                  onClick={() => setOpenId(layer.id)}
                  className={`w-full text-left rounded-xl border bg-surface p-4 transition-colors ${
                    isOpen ? "border-hair-strong" : "border-hair hover:border-hair-strong"
                  }`}
                  style={isOpen ? { boxShadow: `inset 3px 0 0 ${layer.color}` } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${layer.color}18`, border: `1px solid ${layer.color}44` }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: layer.color, backgroundColor: `${layer.color}18` }}
                        >
                          {t("LAYER")} {layer.index}
                        </span>
                        <h3 className="font-headline text-sm font-bold text-ink-strong">{t(layer.name)}</h3>
                        {stage && (
                          <span
                            className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${HEALTH_STYLE[stage.health].cls}`}
                          >
                            {t(HEALTH_STYLE[stage.health].label)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">{t(layer.tagline)}</p>

                      {stage && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-mono text-[10px] text-ink-muted">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" style={{ color: layer.color }} />
                            {stage.throughputPerMin}/min
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" style={{ color: layer.color }} />
                            {stage.durationMs} ms
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowDown className="w-3 h-3" style={{ color: layer.color }} />
                            {stage.inputCount}→{stage.outputCount}
                          </span>
                        </div>
                      )}

                      {stage && (
                        <ul className="mt-2 space-y-0.5">
                          {stage.messages.slice(0, isOpen ? 6 : 2).map((m, k) => (
                            <li
                              key={k}
                              className="text-[10px] text-ink-muted leading-snug flex gap-1.5"
                            >
                              <span style={{ color: layer.color }}>›</span>
                              <span className="break-words">{m}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-ink-faint flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-hair grid sm:grid-cols-2 gap-3">
                          <DetailList title={t("Responsibilities")} items={layer.responsibilities} color={layer.color} />
                          <div className="space-y-3">
                            <DetailList title={t("Wired components")} items={layer.components} color={layer.color} mono />
                            <div>
                              <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                                {t("Stack")}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {layer.tech.map((t) => (
                                  <span
                                    key={t}
                                    className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-fill text-ink-muted"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-ink-muted leading-relaxed mt-3">
                          {layer.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* animated connector */}
                {i < TWIN_LAYERS.length - 1 && (
                  <div className="relative h-8 flex justify-center">
                    <div className="w-px h-full bg-gradient-to-b from-hair-strong to-hair" />
                    <motion.div
                      key={`${state?.updatedAt ?? 0}-${i}`}
                      initial={{ top: 0, opacity: 0 }}
                      animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 0.9, ease: "easeIn" }}
                      className="absolute w-2 h-2 rounded-full -ml-[3.5px] left-1/2"
                      style={{ backgroundColor: layer.color, boxShadow: `0 0 8px ${layer.color}` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---------------- payload inspector ---------------- */}
        <div className="lg:sticky lg:top-20 h-fit space-y-3">
          <div className="rounded-xl border border-hair-strong bg-elev p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4" style={{ color: openLayer.color }} />
              <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest">
                {t(openLayer.name)} · {t("payload")}
              </h3>
            </div>

            {openStage ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <MiniStat label={t("Latency")} value={`${openStage.durationMs}ms`} />
                  <MiniStat label={t("Rate")} value={`${openStage.throughputPerMin}/m`} />
                  <MiniStat label="I/O" value={`${openStage.inputCount}/${openStage.outputCount}`} />
                </div>
                <div className="space-y-1">
                  {Object.entries(openStage.sample).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between font-mono text-[10px] border-b border-hair py-1"
                    >
                      <span className="text-ink-muted">{k}</span>
                      <span className="text-ink-strong font-semibold">{fmt(v)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-ink-muted">{t("Waiting for first twin tick…")}</p>
            )}
          </div>

          {state && (
            <div className="rounded-xl border border-hair-strong bg-elev p-4 space-y-2">
              <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-1">
                {t("End-to-end")}
              </h3>
              <RawKV k="Raw · thermistor" v={`${state.raw.channels.thermistor.raw} °C`} />
              <RawKV k="Acquired · link" v={`${state.acquired.rssiDbm} dBm / ${state.acquired.linkLatencyMs} ms`} />
              <RawKV
                k="Normalised · temp"
                v={`${state.observation.temperature} °C (${state.observation.provenance.calibrationApplied.length} cal)`}
              />
              <RawKV k="Model · dew point" v={`${state.physics.dewPoint} °C`} />
              <RawKV k="Model · ET₀" v={`${state.physics.et0} mm/day`} />
              <RawKV
                k="Forecast +60m"
                v={`${state.forecast[2]?.temperature ?? "–"} °C @ ${state.forecast[2]?.confidence ?? 0}%`}
              />
              <RawKV k="Twin fidelity" v={`${state.fidelityPct}%`} />
            </div>
          )}

          <div className="rounded-xl border border-hair-strong bg-elev p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-c-sky" />
              <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest">
                {t("Residual drift")}
              </h3>
            </div>
            {state && state.residuals.length > 0 ? (
              <div className="space-y-2">
                {state.residuals.map((r) => (
                  <div key={r.field}>
                    <div className="flex justify-between font-mono text-[10px] text-ink-muted">
                      <span>{r.field}</span>
                      <span className={r.driftPct > 70 ? "text-c-red" : "text-ink-strong"}>
                        {r.residual >= 0 ? "+" : ""}
                        {r.residual}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-fill rounded mt-1">
                      <div
                        className="h-1 rounded"
                        style={{
                          width: `${Math.min(100, r.driftPct)}%`,
                          backgroundColor: r.driftPct > 70 ? pal.red : pal.sky,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-ink-muted">{t("Baseline warming up…")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red" | "slate";
}) {
  const map = {
    green: "text-accent border-accent/30 bg-accent/10",
    amber: "text-c-amber border-c-amber/30 bg-c-amber/10",
    red: "text-c-red border-c-red/30 bg-c-red/10",
    slate: "text-ink-muted border-hair-strong bg-fill",
  } as const;
  return (
    <div className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] ${map[tone]}`}>
      <span className="opacity-60 uppercase tracking-wider">{label} </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function DetailList({
  title,
  items,
  color,
  mono,
}: {
  title: string;
  items: string[];
  color: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">{title}</span>
      <ul className="mt-1 space-y-1">
        {items.map((it) => (
          <li
            key={it}
            className={`text-[10px] text-ink-muted flex gap-1.5 leading-snug ${mono ? "font-mono" : ""}`}
          >
            <span style={{ color }}>•</span>
            <span className="break-words">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-fill rounded-lg p-2 text-center">
      <div className="font-mono text-[8px] text-ink-muted uppercase tracking-wider">{label}</div>
      <div className="font-headline text-xs font-bold text-ink-strong mt-0.5">{value}</div>
    </div>
  );
}

function RawKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between font-mono text-[10px] gap-3">
      <span className="text-ink-muted">{k}</span>
      <span className="text-ink-strong font-semibold text-right">{v}</span>
    </div>
  );
}
