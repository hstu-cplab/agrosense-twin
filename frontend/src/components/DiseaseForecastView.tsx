import React, { useMemo } from "react";
import { Bug, TrendingUp, Info, ArrowRight } from "lucide-react";
import { WeatherData, SystemSettings } from "../types";
import { useTwin, useEffectiveObservation } from "../twin/TwinProvider";
import { CROPS, CropId, evaluateCrop, RuleEvaluation } from "../diseaseRules";
import { CROP_BY_ID } from "../twin/cropCatalog";
import { ForecastPoint } from "../twin/forecast";
import { usePalette, Palette } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/I18nProvider";
import LayerBadge from "./twin/LayerBadge";
import DiseaseRiskView from "./DiseaseRiskView";

interface Props {
  weather: WeatherData;
  settings: SystemSettings;
}

/** ForecastPoint → the shape the rule engine evaluates. */
function toWeather(p: ForecastPoint): WeatherData {
  return {
    windSpeed: p.windSpeed,
    precipitation: p.precipitation,
    temperature: p.temperature,
    humidity: p.humidity,
    light: p.light,
    pressure: p.pressure,
    cloudCover: Math.round(Math.max(0, Math.min(100, 100 - p.light))),
  };
}

function favourable(evals: RuleEvaluation[]): number {
  return evals.filter((e) => e.status === "favourable").length;
}

const HORIZONS = [0, 6, 12, 24, 48];

function riskColor(n: number, total: number, pal: Palette): string {
  const r = total ? n / total : 0;
  if (r >= 0.4) return pal.red;
  if (r > 0) return pal.amber;
  return pal.green;
}

export default function DiseaseForecastView({ weather, settings }: Props) {
  const { forecast, source } = useTwin();
  const obs = useEffectiveObservation();
  const pal = usePalette();
  const { t, lang } = useI18n();

  const rows = useMemo(() => {
    const base = obs ?? weather;
    return CROPS.map((c) => {
      const now = evaluateCrop(c.id, base as WeatherData);
      const total = now.length;
      const series = HORIZONS.map((h) => {
        if (h === 0) return { h, fav: favourable(now), total };
        const pt =
          forecast.find((p) => Math.abs(p.hoursAhead - h) < 0.75) ??
          forecast[Math.min(forecast.length - 1, h - 1)];
        if (!pt) return { h, fav: favourable(now), total };
        return { h, fav: favourable(evaluateCrop(c.id, toWeather(pt))), total };
      });
      const trend = series[series.length - 1].fav - series[0].fav;
      return { crop: c, series, total, trend };
    });
  }, [obs, weather, forecast]);

  const cropLabel = (id: CropId) => {
    const p = CROP_BY_ID[id];
    return p ? (lang === "bn" ? p.bnName : p.name) : id;
  };

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hair pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bug className="w-5 h-5 text-accent" />
            <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
              {t("Disease Forecast")}
            </h1>
            <LayerBadge layer="model" variant="full" />
          </div>
          <p className="text-sm text-ink-muted max-w-2xl">
            {t(
              "How disease favourability moves over the next 48 hours — the rule engine is evaluated against the forward model roll-out, not just the current reading."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-fill border border-hair-strong rounded-lg">
          <TrendingUp className="w-3.5 h-3.5 text-c-sky" />
          <span className="font-mono text-xs text-c-sky font-bold uppercase tracking-wider">
            {source === "simulation" ? t("Modelled outlook") : t("Trend outlook")}
          </span>
        </div>
      </header>

      {/* forecast matrix */}
      <section className="bg-surface border border-hair rounded-xl p-4 card-elev overflow-x-auto">
        <h3 className="font-headline text-xs font-bold text-ink-strong uppercase tracking-widest mb-3">
          {t("Favourability outlook")}
        </h3>
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
              <th className="text-left pb-2 font-semibold">{t("Crop")}</th>
              {HORIZONS.map((h) => (
                <th key={h} className="pb-2 font-semibold text-center">
                  {h === 0 ? t("Now") : `+${h}h`}
                </th>
              ))}
              <th className="pb-2 font-semibold text-center">{t("Trend")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ crop, series, total, trend }) => (
              <tr key={crop.id} className="border-t border-hair">
                <td className="py-2.5 text-sm font-semibold text-ink">{cropLabel(crop.id)}</td>
                {series.map((s) => (
                  <td key={s.h} className="py-2.5 text-center">
                    <span
                      className="inline-flex items-center justify-center w-8 h-7 rounded-md font-mono text-xs font-bold"
                      style={{
                        color: riskColor(s.fav, total, pal),
                        backgroundColor: `${riskColor(s.fav, total, pal)}1e`,
                      }}
                      title={`${s.fav} / ${total} ${t("favourable")}`}
                    >
                      {s.fav}
                    </span>
                  </td>
                ))}
                <td className="py-2.5 text-center">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: trend > 0 ? pal.red : trend < 0 ? pal.green : pal.inkMuted }}
                  >
                    {trend > 0 ? `▲ +${trend}` : trend < 0 ? `▼ ${trend}` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-ink-muted font-mono mt-3">
          {t("Cell = number of transcribed diseases whose weather thresholds are met at that horizon.")}{" "}
          {forecast.length === 0 && t("(forecast roll-out still warming up)")}
        </p>
      </section>

      <div className="flex items-center gap-2 text-ink-muted text-xs font-mono uppercase tracking-widest">
        <span className="h-px flex-1 bg-hair" />
        <ArrowRight className="w-3 h-3" />
        {t("Current rule detail")}
        <span className="h-px flex-1 bg-hair" />
      </div>

      {/* full deterministic rule engine for the current reading */}
      <DiseaseRiskView weather={weather} settings={settings} />

      <div className="flex items-start gap-3 bg-c-sky/8 border border-c-sky/25 rounded-xl p-4">
        <Info className="w-4 h-4 text-c-sky flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-muted leading-relaxed">
          {t(
            "Favourable means the weather suits that pathogen — not that infection is occurring. Actual incidence also needs inoculum, a susceptible cultivar and leaf wetness the station cannot see. Use the outlook to time scouting and preventive sprays, then confirm in-field."
          )}
        </p>
      </div>
    </div>
  );
}
