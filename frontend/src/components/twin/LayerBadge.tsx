import React from "react";
import { LayerId } from "../../twin/types";
import { LAYER_BY_ID } from "../../twin/layers";

interface LayerBadgeProps {
  layer: LayerId;
  variant?: "chip" | "dot" | "full";
  className?: string;
}

/** Small L1–L5 marker tying a tab / panel to its place in the twin stack. */
export default function LayerBadge({ layer, variant = "chip", className = "" }: LayerBadgeProps) {
  const l = LAYER_BY_ID[layer];
  if (!l) return null;

  if (variant === "dot") {
    return (
      <span
        title={l.name}
        className={`inline-block w-1.5 h-1.5 rounded-full ${className}`}
        style={{ backgroundColor: l.color }}
      />
    );
  }

  if (variant === "full") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${className}`}
        style={{ color: l.color, borderColor: `${l.color}55`, backgroundColor: `${l.color}14` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
        L{l.index} · {l.name.replace(/ Layer.*/, "")}
      </span>
    );
  }

  return (
    <span
      title={`Layer ${l.index} — ${l.name}`}
      className={`inline-flex items-center justify-center font-mono text-[8px] font-bold rounded px-1 py-0.5 border ${className}`}
      style={{ color: l.color, borderColor: `${l.color}55`, backgroundColor: `${l.color}14` }}
    >
      L{l.index}
    </span>
  );
}
