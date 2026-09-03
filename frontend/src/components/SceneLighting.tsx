import React from "react";

interface SceneLightingProps {
  temperature: number;
  condition: string;
  /** dusk / night — tints the light cool but never lets the model go dark */
  night?: boolean;
}

/**
 * Lighting for the twin viewport. This is an instrument view, not a
 * photoreal render, so the mast is always clearly lit — day/night and
 * weather only tint and modulate it within a readable floor.
 */
export default function SceneLighting({ temperature, condition, night }: SceneLightingProps) {
  const c = condition.toLowerCase();
  const isRainy = c.includes("rain") || c.includes("cloud");
  const isClear = c.includes("clear") || c.includes("sun");

  const ambientColor = night
    ? "#bcd0f0"
    : temperature > 35
      ? "#ffe8cc"
      : temperature < 15
        ? "#cce0ff"
        : "#ffffff";

  // keep a high floor so the geometry is always legible
  const ambientInt = night ? 0.85 : isRainy ? 0.75 : isClear ? 1.0 : 0.9;
  const keyInt = night ? 0.7 : isRainy ? 0.7 : isClear ? 1.25 : 0.95;
  const keyColor = night ? "#cdd9f5" : isClear ? "#fff5e0" : "#e8eeff";

  return (
    <>
      <hemisphereLight
        color={night ? "#9fb4dc" : "#ffffff"}
        groundColor={night ? "#2a3348" : "#6b6152"}
        intensity={night ? 0.7 : 0.55}
      />
      <ambientLight color={ambientColor} intensity={ambientInt} />
      <directionalLight
        color={keyColor}
        intensity={keyInt}
        position={[6, 9, 5]}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* fill from the opposite side so no face is pure black */}
      <directionalLight color={night ? "#7f93c4" : "#7f9bd6"} intensity={0.45} position={[-5, 3, -4]} />
      {/* soft rim from behind */}
      <directionalLight color="#ffffff" intensity={0.25} position={[0, 4, -6]} />
    </>
  );
}
