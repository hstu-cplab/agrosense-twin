import React, { useMemo, useState } from "react";
import {
  Wheat,
  TrendingUp,
  Trophy,
  Info,
  Droplets,
  Thermometer,
  CloudRain,
  Sun,
  Gauge,
  CalendarDays,
} from "lucide-react";
import { useTwin, useEffectiveObservation } from "../twin/TwinProvider";
import { CROP_CATALOG } from "../twin/cropCatalog";
import { estimateYield, YieldEstimate } from "../twin/yieldModel";
import { summariseDays } from "../twin/forecast";
import { usePalette, Palette } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/I18nProvider";
import CropPhoto from "./CropPhoto";
import LayerBadge from "./twin/LayerBadge";

function pctColor(p: number, pal: Palette): string {
  if (p >= 62) return pal.green;
  if (p >= 48) return pal.lime;
  if (p >= 34) return pal.amber;
  return pal.red;
}

export default function YieldForecastView() {
  const { state, forecast, source } = useTwin();
  const obs = useEffectiveObservation();
  const pal = usePalette();
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<string>("rice");

  const days = useMemo(
    () => (forecast.length ? summariseDays(forecast, forecast[0].atMs - 3_600_000) : []),
    [forecast]
  );

  const estimates = useMemo<YieldEstimate[]>(() => {
    if (!obs) return [];
    return CROP_CATALOG.map((c) => estimateYield(c, obs, forecast)).sort(
      (a, b) => b.pctOfPotential - a.pctOfPotential
    );
  }, [obs, forecast]);

  if (!state || !obs) {
    return (
      <div className="text-center text-ink-muted py-20 font-mono text-sm">
        {t("Waiting for the first twin observation…")}
      </div>
    );
  }

  const top = estimates[0];
  const sel = estimates.find((e) => e.crop.id === selected) ?? top;
  const cropName = (c: { name: string; bnName: string }) => (lang === "bn" ? c.bnName : c.name);
  const horizonH = forecast.length ? Math.round(forecast[forecast.length - 1].hoursAhead) : 0;

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hair pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wheat className="w-5 h-5 text-accent" />
            <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
              {t("Yield Forecast")}
            </h1>
            <LayerBadge layer="model" variant="full" />
          </div>
          <p className="text-sm text-ink-muted max-w-2xl">
            {t(
              "Attainable-yield estimate for every crop, driven by the {h}-hour forward model roll-out — environmental fit, heat, water balance, VPD and lodging risk."
            ).replace("{h}", String(horizonH || 48))}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-fill border border-hair-strong rounded-lg">
          <TrendingUp className="w-3.5 h-3.5 text-c-sky" />
          <span className="font-mono text-xs text-c-sky font-bold uppercase tracking-wider">
            {source === "simulation" ? t("Modelled outlook") : t("Trend outlook")}
          </span>
        </div>
      </header>

      {/* 7-day environmental outlook */}
      <section className="bg-surface border border-hair rounded-xl p-4 card-elev">
        <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-c-sky" />
          {t("Environmental outlook")}
        </h3>
        {days.length ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {days.map((d) => (
              <div key={d.dayOffset} className="bg-surface-2 border border-hair rounded-lg p-2.5 text-center">
                <div className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">{t(d.label)}</div>
                <div className="font-headline text-sm font-bold text-ink-strong mt-1">
                  {d.tMax}° <span className="text-ink-faint font-normal">/ {d.tMin}°</span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-1 font-mono text-[9px] text-c-blue">
                  <CloudRain className="w-2.5 h-2.5" />
                  {d.rainTotal} mm
                </div>
                <div className="font-mono text-[9px] text-ink-faint mt-0.5">ET₀ {d.et0Total}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted font-mono">{t("Building the forecast roll-out…")}</p>
        )}
      </section>

      {/* hero */}
      <section className="bg-surface border border-accent/30 rounded-2xl overflow-hidden card-elev">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-72 flex-shrink-0 relative">
            <CropPhoto crop={top.crop} vitality={top.pctOfPotential} rounded={false} className="w-full h-48 md:h-full" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-elev/90 backdrop-blur px-2.5 py-1 rounded-lg border border-hair">
              <Trophy className="w-3.5 h-3.5 text-c-amber" />
              <span className="font-mono text-[10px] font-bold text-ink-strong uppercase tracking-wider">
                {t("Best expected yield")}
              </span>
            </div>
          </div>
          <div className="flex-1 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-headline text-2xl font-bold text-ink-strong">
                  {cropName(top.crop)}{" "}
                  <span className="text-ink-faint text-lg">{lang === "bn" ? top.crop.name : top.crop.bnName}</span>
                </h2>
                <p className="text-xs text-ink-muted font-mono mt-0.5">
                  {top.crop.family} · {top.crop.season}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-headline text-3xl font-bold text-ink-strong">
                  {top.estimate}
                  <span className="text-sm text-ink-muted font-mono"> t/ha</span>
                </div>
                <div className="font-mono text-[10px]" style={{ color: pctColor(top.pctOfPotential, pal) }}>
                  {top.pctOfPotential}% {t("of potential")} ({top.potential} t/ha)
                </div>
                <div className="font-mono text-[9px] text-ink-faint mt-0.5">
                  {t("range")} {top.band[0]}–{top.band[1]} · {top.confidence}% {t("conf")}
                </div>
              </div>
            </div>
            <FactorTable est={top} pal={pal} t={t} />
          </div>
        </div>
      </section>

      {/* crop selector + ranking */}
      <section>
        <div className="flex items-center gap-1 bg-surface-2 border border-hair rounded-lg p-1 overflow-x-auto">
          {estimates.slice(0, 8).map((e) => (
            <button
              key={e.crop.id}
              onClick={() => setSelected(e.crop.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex-shrink-0 ${
                sel.crop.id === e.crop.id
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-ink-muted hover:text-ink-strong hover:bg-fill"
              }`}
            >
              {cropName(e.crop)}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <div className="bg-surface border border-hair rounded-xl overflow-hidden card-elev">
            <CropPhoto crop={sel.crop} vitality={sel.pctOfPotential} rounded={false} className="w-full h-40" />
            <div className="p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-headline text-lg font-bold text-ink-strong">{cropName(sel.crop)}</h3>
                <span className="font-headline text-xl font-bold text-ink-strong">
                  {sel.estimate}
                  <span className="text-xs text-ink-muted font-mono"> t/ha</span>
                </span>
              </div>
              <div className="w-full h-2 bg-fill rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${sel.pctOfPotential}%`, backgroundColor: pctColor(sel.pctOfPotential, pal) }}
                />
              </div>
              <p className="font-mono text-[10px] text-ink-muted">
                {sel.pctOfPotential}% {t("of the")} {sel.potential} t/ha {t("attainable ceiling")}
              </p>
              <p className="text-xs text-ink-muted leading-relaxed pt-1">{sel.crop.note}</p>
            </div>
          </div>

          <div className="bg-surface border border-hair rounded-xl p-4 card-elev">
            <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3">
              {t("Yield multiplier breakdown")}
            </h3>
            <FactorTable est={sel} pal={pal} t={t} expanded />
          </div>
        </div>
      </section>

      {/* full ranking bars */}
      <section className="bg-surface border border-hair rounded-xl p-4 card-elev">
        <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3">
          {t("All crops · expected vs potential")}
        </h3>
        <div className="space-y-1.5">
          {estimates.map((e) => (
            <button
              key={e.crop.id}
              onClick={() => setSelected(e.crop.id)}
              className="w-full flex items-center gap-3 group"
            >
              <span className="w-24 text-left text-xs font-semibold text-ink truncate">{cropName(e.crop)}</span>
              <div className="flex-1 h-4 bg-fill rounded relative overflow-hidden">
                <div
                  className="h-4 rounded transition-all"
                  style={{ width: `${e.pctOfPotential}%`, backgroundColor: pctColor(e.pctOfPotential, pal) }}
                />
              </div>
              <span className="w-20 text-right font-mono text-[11px] text-ink-strong font-bold">
                {e.estimate} <span className="text-ink-faint font-normal">t/ha</span>
              </span>
              <span className="w-10 text-right font-mono text-[10px]" style={{ color: pctColor(e.pctOfPotential, pal) }}>
                {e.pctOfPotential}%
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 bg-c-sky/8 border border-c-sky/25 rounded-xl p-4">
        <Info className="w-4 h-4 text-c-sky flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-muted leading-relaxed">
          {t(
            "Yield ≈ potential × fit^0.55 × Π(stress terms). Stress terms read the forward roll-out's mean heat, rain-vs-ET₀ balance, peak VPD and peak wind. This is decision-support, not a calibrated crop-growth model — treat the range, not the point value, as the answer."
          )}
        </p>
      </div>
    </div>
  );
}

function FactorTable({
  est,
  pal,
  t,
  expanded,
}: {
  est: YieldEstimate;
  pal: Palette;
  t: (s: string) => string;
  expanded?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {est.factors.map((f) => {
        const pct = Math.round(f.multiplier * 100);
        const c = f.multiplier >= 0.95 ? pal.green : f.multiplier >= 0.8 ? pal.amber : pal.red;
        return (
          <div key={f.label} className="flex items-center gap-3">
            <span className="w-28 text-[11px] text-ink-muted flex-shrink-0">{t(f.label)}</span>
            <div className="flex-1 h-2 bg-fill rounded overflow-hidden">
              <div className="h-2 rounded" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: c }} />
            </div>
            <span className="w-10 text-right font-mono text-[10px] font-bold" style={{ color: c }}>
              ×{f.multiplier}
            </span>
          </div>
        );
      })}
      {expanded && (
        <ul className="pt-2 space-y-1 border-t border-hair mt-2">
          {est.factors.map((f) => (
            <li key={f.label} className="text-[10px] text-ink-muted leading-snug">
              <span className="font-semibold text-ink">{t(f.label)}:</span> {f.note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
