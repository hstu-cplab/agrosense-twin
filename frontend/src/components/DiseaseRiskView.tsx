import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  Thermometer,
  Droplets,
  CloudRain,
  Cloud,
} from "lucide-react";
import { WeatherData, SystemSettings } from "../types";
import CropPhoto from "./CropPhoto";
import LayerBadge from "./twin/LayerBadge";
import { CROP_BY_ID } from "../twin/cropCatalog";
import { useT } from "../i18n/I18nProvider";
import { usePalette, Palette } from "../theme/ThemeProvider";
import {
  CROPS,
  CropId,
  RuleEvaluation,
  UNEVALUABLE_LABELS,
  UNEVALUABLE_REASONS,
  evaluateCrop,
  DiseaseRule,
  Window,
} from "../diseaseRules";

interface DiseaseRiskViewProps {
  weather: WeatherData;
  settings: SystemSettings;
}

const STATUS_STYLES: Record<
  RuleEvaluation["status"],
  { label: string; chip: string; border: string }
> = {
  favourable: {
    label: "Conditions favourable",
    chip: "bg-c-red/15 text-c-red border-c-red/30",
    border: "border-l-c-red",
  },
  not_favourable: {
    label: "Not favourable",
    chip: "bg-accent/10 text-accent border-accent/25",
    border: "border-l-accent/40",
  },
  insufficient_data: {
    label: "Cannot assess",
    chip: "bg-fill text-ink-muted border-hair-strong",
    border: "border-l-hair-strong",
  },
};

function getCropScore(evaluations: RuleEvaluation[]): number {
  const evaluable = evaluations.filter(
    (e) => e.status !== "insufficient_data"
  );
  if (evaluable.length === 0) return 0;
  let total = 0;
  let met = 0;
  for (const e of evaluable) {
    total += e.met.length + e.unmet.length;
    met += e.met.length;
  }
  return total === 0 ? 0 : Math.round((met / total) * 100);
}

function scoreColor(score: number, p: Palette): string {
  if (score >= 66) return p.red;
  if (score >= 33) return p.amber;
  return p.green;
}

function InputChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-elev border border-hair rounded-lg px-3 py-2">
      {icon}
      <div className="min-w-0">
        <span className="block font-mono text-[9px] text-ink-muted uppercase tracking-wider">
          {label}
        </span>
        <span className="block font-headline text-sm font-bold text-ink-strong">{value}</span>
      </div>
    </div>
  );
}

function CropScoreCurve({
  scores,
  activeCrop,
}: {
  scores: { id: CropId; label: string; score: number }[];
  activeCrop: CropId;
}) {
  const pal = usePalette();
  const w = 400;
  const h = 160;
  const pad = { left: 36, right: 20, top: 24, bottom: 32 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const points = scores.map((s, i) => ({
    x: pad.left + (scores.length > 1 ? (i / (scores.length - 1)) * plotW : plotW / 2),
    y: pad.top + plotH - (s.score / 100) * plotH,
    score: s.score,
    label: s.label,
    active: s.id === activeCrop,
    color: scoreColor(s.score, pal),
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x;
    const cp1x = p0.x + dx * 0.4;
    const cp1y = p0.y;
    const cp2x = p1.x - dx * 0.4;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const last = points[points.length - 1];
  const areaD = `${d} L ${last.x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`;

  return (
    <div className="bg-surface border border-hair rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline text-xs font-semibold text-ink-strong tracking-widest uppercase">
          Composite Disease Risk Score
        </h3>
        <div className="flex items-center gap-3">
          {[
            { label: "Low", color: pal.green },
            { label: "Med", color: pal.amber },
            { label: "High", color: pal.red },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[9px] text-ink-muted font-mono">{l.label}</span>
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.green} stopOpacity="0.25" />
            <stop offset="100%" stopColor={pal.green} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => (
          <line
            key={v}
            x1={pad.left}
            y1={pad.top + plotH - (v / 100) * plotH}
            x2={w - pad.right}
            y2={pad.top + plotH - (v / 100) * plotH}
            stroke={pal.hair}
            strokeWidth="1"
          />
        ))}
        <path d={areaD} fill="url(#scoreGrad)" />
        <path d={d} fill="none" stroke={pal.green} strokeWidth="2.5" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            {p.active && (
              <circle cx={p.x} cy={p.y} r="12" fill={p.color} opacity="0.15" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={p.active ? 5 : 3.5}
              fill={p.active ? p.color : pal.surface}
              stroke={p.color}
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={h - 10}
              textAnchor="middle"
              className="text-[9px] fill-ink-muted font-mono"
            >
              {p.label}
            </text>
            <text
              x={p.x}
              y={p.y - (p.active ? 14 : 12)}
              textAnchor="middle"
              className="text-[9px] fill-ink-strong font-mono font-bold"
            >
              {p.score}%
            </text>
          </g>
        ))}
        {[0, 50, 100].map((v) => (
          <text
            key={v}
            x={pad.left - 6}
            y={pad.top + plotH - (v / 100) * plotH + 3}
            textAnchor="end"
            className="text-[8px] fill-ink-muted font-mono"
          >
            {v}
          </text>
        ))}
      </svg>
      <p className="text-[9px] text-ink-muted font-mono mt-2 text-center">
        Score = % of disease-favourability criteria currently met. Higher = greater disease risk.
      </p>
    </div>
  );
}

function ThresholdCurve({
  label,
  currentValue,
  window,
  unit,
}: {
  label: string;
  currentValue: number;
  window: Window;
  unit: string;
}) {
  const pal = usePalette();
  const w = 140;
  const h = 56;

  let lo = window.min ?? currentValue - 15;
  let hi = window.max ?? currentValue + 15;
  if (lo === hi) {
    lo -= 10;
    hi += 10;
  }
  const span = hi - lo || 1;

  const pad = 8;
  const pw = w - pad * 2;
  const ph = h - pad * 2;

  const n = 60;
  const pts: { x: number; y: number; fav: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const val = lo + (i / n) * span;
    let fav = 1;
    if (window.min !== undefined) {
      fav *= 1 / (1 + Math.exp(-4 * ((val - window.min) / (span * 0.12))));
    }
    if (window.max !== undefined) {
      fav *= 1 / (1 + Math.exp(4 * ((val - window.max) / (span * 0.12))));
    }
    pts.push({
      x: pad + (i / n) * pw,
      y: pad + ph - fav * ph,
      fav,
    });
  }

  const d = pts
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const areaD = `${d} L ${pts[pts.length - 1].x} ${pad + ph} L ${pts[0].x} ${pad + ph} Z`;

  let currentFav = 1;
  if (window.min !== undefined) {
    currentFav *= 1 / (1 + Math.exp(-4 * ((currentValue - window.min) / (span * 0.12))));
  }
  if (window.max !== undefined) {
    currentFav *= 1 / (1 + Math.exp(4 * ((currentValue - window.max) / (span * 0.12))));
  }
  const currentX = pad + ((currentValue - lo) / span) * pw;
  const currentY = pad + ph - currentFav * ph;
  const isFavourable = currentFav > 0.5;
  const curveColor = isFavourable ? pal.green : pal.red;
  const gid = `grad-${label.replace(/\W/g, "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={curveColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={curveColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {window.min !== undefined && window.max !== undefined && (
        <rect
          x={pad + ((window.min - lo) / span) * pw}
          y={pad}
          width={((window.max - window.min) / span) * pw}
          height={ph}
          fill={curveColor}
          opacity={0.08}
        />
      )}
      <path d={areaD} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={curveColor} strokeWidth="1.5" />
      <line
        x1={currentX}
        y1={pad}
        x2={currentX}
        y2={pad + ph}
        stroke={curveColor}
        strokeWidth="1"
        opacity={0.5}
        strokeDasharray="2 2"
      />
      <circle cx={currentX} cy={currentY} r="3" fill={curveColor} />
      <text
        x={w - 2}
        y={h - 2}
        textAnchor="end"
        className="text-[8px] fill-ink-muted font-mono"
      >
        {currentValue.toFixed(0)}
        {unit}
      </text>
    </svg>
  );
}

function RuleThresholds({ rule, weather }: { rule: DiseaseRule; weather: WeatherData }) {
  const thresholds = [
    rule.airTemp && {
      label: "Air Temp",
      value: weather.temperature,
      window: rule.airTemp,
      unit: "°C",
    },
    rule.humidity && {
      label: "Humidity",
      value: weather.humidity,
      window: rule.humidity,
      unit: "%",
    },
    rule.rainfall && {
      label: "Rainfall",
      value: weather.precipitation,
      window: rule.rainfall,
      unit: "mm",
    },
  ].filter(Boolean) as {
    label: string;
    value: number;
    window: Window;
    unit: string;
  }[];

  if (thresholds.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-hair">
      <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider font-bold">
        Threshold Curves
      </span>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {thresholds.map((t) => (
          <div key={t.label} className="flex flex-col items-center">
            <ThresholdCurve
              label={t.label}
              currentValue={t.value}
              window={t.window}
              unit={t.unit}
            />
            <span className="text-[9px] text-ink-muted font-mono mt-1">
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleCard({ evaluation, weather }: { evaluation: RuleEvaluation; weather: WeatherData }) {
  const { rule, status, met, unmet, unevaluable } = evaluation;
  const style = STATUS_STYLES[status];
  const [showSource, setShowSource] = useState(false);

  return (
    <div
      className={`bg-surface border border-hair border-l-4 ${style.border} rounded-xl p-4 space-y-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-headline text-sm font-bold text-ink-strong">{rule.disease}</h3>
        <span
          className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${style.chip}`}
        >
          {style.label}
        </span>
      </div>

      {(met.length > 0 || unmet.length > 0) && (
        <ul className="space-y-1.5">
          {met.map((c) => (
            <li key={c.label} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-c-red flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-ink">
                <span className="font-semibold">{c.label}</span>
                <span className="text-ink-muted"> — {c.detail}</span>
              </span>
            </li>
          ))}
          {unmet.map((c) => (
            <li key={c.label} className="flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 text-ink-faint flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-ink-muted">
                <span className="font-semibold">{c.label}</span>
                <span> — {c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {unevaluable.length > 0 && (
        <div className="border-t border-hair pt-2.5 space-y-1.5">
          <span className="font-mono text-[9px] text-c-amber uppercase tracking-wider font-bold">
            {unevaluable.length} criteri{unevaluable.length === 1 ? "on" : "a"} not verified
          </span>
          {unevaluable.map((key) => (
            <div key={key} className="flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-c-amber/70 flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-ink-muted leading-relaxed">
                <span className="font-semibold text-ink-muted">{UNEVALUABLE_LABELS[key]}</span>
                {" — "}
                {UNEVALUABLE_REASONS[key]}
              </span>
            </div>
          ))}
        </div>
      )}

      {rule.caveat && (
        <div className="flex items-start gap-2 bg-c-amber/5 border border-c-amber/15 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-c-amber flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-ink-muted leading-relaxed">{rule.caveat}</span>
        </div>
      )}

      <button
        onClick={() => setShowSource((v) => !v)}
        className="font-mono text-[9px] text-ink-muted hover:text-accent uppercase tracking-wider transition-colors"
      >
        {showSource ? "Hide source row" : "Show source row"}
      </button>
      {showSource && (
        <p className="font-mono text-[10px] text-ink-muted bg-elev border border-hair rounded p-2.5 leading-relaxed break-words">
          {rule.source}
        </p>
      )}
      <RuleThresholds rule={rule} weather={weather} />
    </div>
  );
}

export default function DiseaseRiskView({ weather }: DiseaseRiskViewProps) {
  const t = useT();
  const [crop, setCrop] = useState<CropId>("rice");

  const evaluations = useMemo(() => evaluateCrop(crop, weather), [crop, weather]);

  const allEvaluations = useMemo(() => {
    const result: Record<CropId, RuleEvaluation[]> = {
      rice: evaluateCrop("rice", weather),
      maize: evaluateCrop("maize", weather),
      wheat: evaluateCrop("wheat", weather),
      sugarcane: evaluateCrop("sugarcane", weather),
    };
    return result;
  }, [weather]);

  const cropScores = useMemo(
    () =>
      CROPS.map((c) => ({
        id: c.id,
        label: c.label,
        score: getCropScore(allEvaluations[c.id]),
      })),
    [allEvaluations]
  );

  const favourable = evaluations.filter((e) => e.status === "favourable");
  const unassessable = evaluations.filter((e) => e.status === "insufficient_data");

                                                                                 
  const ordered = useMemo(() => {
    const rank: Record<RuleEvaluation["status"], number> = {
      favourable: 0,
      not_favourable: 1,
      insufficient_data: 2,
    };
    return [...evaluations].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [evaluations]);

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">{t("Crop Disease Risk")}</h1>
            <LayerBadge layer="model" variant="full" />
          </div>
          <p className="text-sm text-ink-muted">
            {t("Deterministic threshold rules evaluated against live station telemetry.")}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-fill border border-hair-strong rounded-lg">
          <ShieldAlert className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono text-xs text-accent font-bold uppercase tracking-wider">
            Rule engine · {evaluations.length} rules
          </span>
        </div>
      </header>

      {/* Scope disclaimer. This engine reports favourability, never diagnosis. */}
      <div className="flex items-start gap-3 bg-c-sky/5 border border-c-sky/20 rounded-xl p-4">
        <Info className="w-4 h-4 text-c-sky flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-muted leading-relaxed">
          A rule marked <span className="text-c-red font-semibold">favourable</span> means the
          weather currently suits that disease. It is <span className="font-semibold">not</span> a
          diagnosis and not a forecast of occurrence — actual incidence also depends on inoculum
          presence, cultivar resistance, prior crop and spray history, none of which this station
          observes. Station readings are taken at instrument height and run drier than the crop
          canopy. Confirm in-field before acting.
        </p>
      </div>

      {/* Live inputs feeding the rules */}
      <section className="bg-surface border border-hair rounded-xl p-5 space-y-4">
        <h3 className="font-headline text-sm font-semibold text-ink-strong tracking-widest uppercase border-b border-hair pb-2">
          Evaluated Inputs
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <InputChip
            icon={<Thermometer className="w-4 h-4 text-accent flex-shrink-0" />}
            label="Air temperature"
            value={`${weather.temperature.toFixed(1)} °C`}
          />
          <InputChip
            icon={<Droplets className="w-4 h-4 text-c-cyan flex-shrink-0" />}
            label="Relative humidity"
            value={`${weather.humidity.toFixed(0)} %`}
          />
          <InputChip
            icon={<CloudRain className="w-4 h-4 text-c-blue flex-shrink-0" />}
            label="Rainfall"
            value={`${weather.precipitation.toFixed(1)} mm`}
          />
          <InputChip
            icon={<Cloud className="w-4 h-4 text-c-violet flex-shrink-0" />}
            label="Cloud cover"
            value={`${weather.cloudCover.toFixed(0)} %`}
          />
        </div>
        <p className="text-[10px] text-ink-muted leading-relaxed">
          Growth stage, day length, night temperature bands and leaf wetness duration are not yet
          derived, so rules depending on them are reported as partially verified.
        </p>
      </section>

      <CropScoreCurve scores={cropScores} activeCrop={crop} />

      {/* Crop selector */}
      <div className="flex items-center gap-1 bg-elev border border-hair rounded-lg p-1 w-full sm:w-auto sm:inline-flex overflow-x-auto">
        {CROPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCrop(c.id)}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex-shrink-0 ${
              crop === c.id
                ? "bg-accent text-on-accent shadow-md"
                : "text-ink-muted hover:text-ink-strong hover:bg-fill"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Selected crop context */}
      {CROP_BY_ID[crop] && (
        <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-hair rounded-xl overflow-hidden">
          <div className="sm:w-56 flex-shrink-0">
            <CropPhoto
              crop={CROP_BY_ID[crop]}
              vitality={Math.max(20, 100 - favourable.length * 22)}
              rounded={false}
              className="w-full h-36 sm:h-full"
            />
          </div>
          <div className="p-4 flex-1 space-y-1.5">
            <h3 className="font-headline text-lg font-bold text-ink-strong">
              {CROP_BY_ID[crop].name}{" "}
              <span className="text-ink-muted text-sm">{CROP_BY_ID[crop].bnName}</span>
            </h3>
            <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              {CROP_BY_ID[crop].family} · {CROP_BY_ID[crop].season}
            </p>
            <p className="text-xs text-ink-muted leading-relaxed">{CROP_BY_ID[crop].note}</p>
            <p
              className={`text-xs font-mono font-bold pt-1 ${
                favourable.length > 0 ? "text-c-red" : "text-accent"
              }`}
            >
              {favourable.length > 0
                ? `${favourable.length} disease${favourable.length === 1 ? "" : "s"} finding conditions favourable`
                : "No disease favourability triggered by current telemetry"}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`font-mono text-xs font-bold px-3 py-1.5 rounded-lg border ${
            favourable.length > 0
              ? "bg-c-red/10 text-c-red border-c-red/30"
              : "bg-accent/10 text-accent border-accent/25"
          }`}
        >
          {favourable.length} of {evaluations.length} favourable
        </span>
        {unassessable.length > 0 && (
          <span className="font-mono text-xs text-ink-muted bg-fill border border-hair-strong px-3 py-1.5 rounded-lg">
            {unassessable.length} cannot be assessed
          </span>
        )}
      </div>

      {/* Rule cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ordered.map((evaluation) => (
          <RuleCard key={evaluation.rule.id} evaluation={evaluation} weather={weather} />
        ))}
      </section>
    </div>
  );
}
