import React from "react";
import { CropProfile } from "../twin/cropCatalog";

/* ------------------------------------------------------------------ *
 *  Bundled, theme-matched vector illustrations — one scene per crop
 *  "art kind". Fully offline, deterministic, and consistent across the
 *  Crop Intelligence and Disease Risk tabs. Swap `image`/`imageCredit`
 *  onto CropProfile and add an <img> above this to layer real photos.
 * ------------------------------------------------------------------ */

interface CropImageProps {
  crop: CropProfile;
  className?: string;
  /** 0-100 — dims / desaturates the scene when the crop is a poor fit */
  vitality?: number;
  rounded?: boolean;
}

export default function CropImage({
  crop,
  className = "",
  vitality = 100,
  rounded = true,
}: CropImageProps) {
  const { sky, ground, plant, accent, kind } = crop.art;
  const id = crop.id;
  const dim = Math.max(0.35, Math.min(1, vitality / 100));

  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label={`${crop.name} illustration`}
      className={`${className} ${rounded ? "rounded-lg" : ""}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky} stopOpacity={0.9} />
          <stop offset="100%" stopColor={sky} stopOpacity={0.35} />
        </linearGradient>
        <linearGradient id={`gnd-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ground} />
          <stop offset="100%" stopColor="#2c3a22" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="160" height="120" fill="#0d1a13" />
      <g opacity={0.5 + dim * 0.5}>
        <rect x="0" y="0" width="160" height="84" fill={`url(#sky-${id})`} />
        <circle cx="132" cy="26" r="12" fill={accent} opacity={0.35} />
        <rect x="0" y="72" width="160" height="48" fill={`url(#gnd-${id})`} />
        <path d="M0 74 Q40 68 80 74 T160 72 V84 H0 Z" fill={ground} opacity={0.6} />
      </g>

      <g style={{ opacity: dim }}>
        <Scene kind={kind} plant={plant} accent={accent} ground={ground} />
      </g>

      {vitality < 55 && (
        <g opacity={0.6}>
          <rect x="0" y="0" width="160" height="120" fill="#0d1a13" opacity={0.35} />
          <path
            d="M118 12 l8 8 M126 12 l-8 8"
            stroke="#f9a03f"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}

function Row({
  children,
  count = 5,
  y = 96,
  spread = 150,
}: {
  children: (i: number, x: number) => React.ReactNode;
  count?: number;
  y?: number;
  spread?: number;
}) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = 12 + (i / (count - 1)) * spread * 0.92;
    items.push(
      <g key={i} transform={`translate(${x} ${y})`}>
        {children(i, x)}
      </g>
    );
  }
  return <>{items}</>;
}

function Scene({
  kind,
  plant,
  accent,
  ground,
}: {
  kind: CropProfile["art"]["kind"];
  plant: string;
  accent: string;
  ground: string;
}) {
  const stalk = "#4a7a3a";
  switch (kind) {
    case "grain":
      return (
        <Row count={6}>
          {(i) => (
            <g>
              <path d={`M0 0 Q${i % 2 ? 3 : -3} -22 0 -40`} stroke={stalk} strokeWidth="2" fill="none" />
              <g transform="translate(0 -40)">
                {[0, 5, 10, 15].map((o) => (
                  <g key={o} transform={`translate(0 ${o})`}>
                    <ellipse cx="-3" cy="0" rx="2.6" ry="1.5" fill={plant} />
                    <ellipse cx="3" cy="0" rx="2.6" ry="1.5" fill={plant} />
                  </g>
                ))}
                <path d="M0 -4 L0 -16" stroke={accent} strokeWidth="1" />
              </g>
            </g>
          )}
        </Row>
      );
    case "cob":
      return (
        <Row count={4}>
          {() => (
            <g>
              <path d="M0 0 L0 -46" stroke={stalk} strokeWidth="2.6" />
              <path d="M0 -14 Q-16 -18 -22 -6" stroke={plant} strokeWidth="3" fill="none" />
              <path d="M0 -24 Q16 -30 22 -16" stroke={plant} strokeWidth="3" fill="none" />
              <ellipse cx="4" cy="-30" rx="4.5" ry="10" fill={accent} />
              <path d="M4 -40 q6 -6 3 -12" stroke={accent} strokeWidth="1.5" fill="none" />
            </g>
          )}
        </Row>
      );
    case "cane":
      return (
        <Row count={6}>
          {() => (
            <g>
              <path d="M0 0 L0 -56" stroke={plant} strokeWidth="3.4" />
              {[-14, -26, -38, -50].map((o) => (
                <line key={o} x1="-2" y1={o} x2="2" y2={o} stroke={accent} strokeWidth="1.4" />
              ))}
              <path d="M0 -56 q-14 -6 -20 -18" stroke={plant} strokeWidth="2.4" fill="none" />
              <path d="M0 -56 q14 -6 20 -18" stroke={plant} strokeWidth="2.4" fill="none" />
              <path d="M0 -50 q-16 2 -22 -8" stroke={plant} strokeWidth="2.4" fill="none" />
            </g>
          )}
        </Row>
      );
    case "legume":
      return (
        <Row count={6}>
          {() => (
            <g>
              <path d="M0 0 Q-6 -12 0 -22 Q6 -12 0 0" fill={plant} />
              <circle cx="-6" cy="-14" r="4" fill={plant} />
              <circle cx="6" cy="-16" r="4" fill={plant} />
              <circle cx="0" cy="-24" r="4.5" fill={plant} />
              <ellipse cx="-8" cy="-8" rx="4.5" ry="2" fill={accent} transform="rotate(-20 -8 -8)" />
              <ellipse cx="7" cy="-6" rx="4.5" ry="2" fill={accent} transform="rotate(25 7 -6)" />
            </g>
          )}
        </Row>
      );
    case "tuber":
      return (
        <Row count={5}>
          {() => (
            <g>
              <path d="M0 0 L0 -18" stroke={stalk} strokeWidth="2" />
              <circle cx="-6" cy="-20" r="6" fill={plant} />
              <circle cx="6" cy="-22" r="6" fill={plant} />
              <circle cx="0" cy="-28" r="6.5" fill={plant} />
              <ellipse cx="-4" cy="6" rx="6" ry="4" fill={accent} />
              <ellipse cx="6" cy="9" rx="5" ry="3.4" fill={accent} />
            </g>
          )}
        </Row>
      );
    case "flower":
      return (
        <Row count={7}>
          {() => (
            <g>
              <path d="M0 0 L0 -26" stroke={stalk} strokeWidth="1.8" />
              <path d="M0 -12 q-8 -2 -10 -10" stroke={plant} strokeWidth="2" fill="none" />
              {[[-4, -24], [4, -26], [0, -32], [-6, -30], [6, -32]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.6" fill={accent} />
              ))}
            </g>
          )}
        </Row>
      );
    case "fruit-tree":
      return (
        <Row count={3} spread={130}>
          {() => (
            <g>
              <path d="M0 4 L0 -30" stroke="#6b4a2f" strokeWidth="5" />
              <circle cx="0" cy="-42" r="20" fill={plant} />
              <circle cx="-14" cy="-34" r="12" fill={plant} opacity={0.9} />
              <circle cx="15" cy="-36" r="12" fill={plant} opacity={0.9} />
              <circle cx="-6" cy="-30" r="3.4" fill={accent} />
              <circle cx="8" cy="-46" r="3.4" fill={accent} />
              <circle cx="0" cy="-52" r="3.4" fill={accent} />
            </g>
          )}
        </Row>
      );
    case "vine":
    default:
      return (
        <Row count={5}>
          {() => (
            <g>
              <path d="M0 2 L-2 -34" stroke={stalk} strokeWidth="2.4" />
              <path d="M0 -8 q-10 -4 -12 -14" stroke={plant} strokeWidth="3" fill="none" />
              <path d="M-1 -20 q10 -4 12 -14" stroke={plant} strokeWidth="3" fill="none" />
              <circle cx="-10" cy="-6" r="3.6" fill={accent} />
              <circle cx="9" cy="-16" r="3.6" fill={accent} />
              <circle cx="-2" cy="-30" r="4" fill={accent} />
            </g>
          )}
        </Row>
      );
  }
}
