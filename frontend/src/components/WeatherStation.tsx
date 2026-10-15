import React from "react";
import AnemometerArm from "./AnemometerArm";
import * as THREE from "three";

interface WeatherStationProps {
  windSpeed: number;
  temperature: number;
  humidity: number;
  precipitation: number;
}

/* ---- Materials ---- */
const matWhite   = new THREE.MeshStandardMaterial({ color: "#e8e8e8", metalness: 0.1, roughness: 0.6 });
const matSteel   = new THREE.MeshStandardMaterial({ color: "#a0a8a0", metalness: 0.8, roughness: 0.3 });
const matSolar   = new THREE.MeshStandardMaterial({ color: "#1a2d5a", metalness: 0.3, roughness: 0.5 });
const matSolarFr = new THREE.MeshStandardMaterial({ color: "#c8c8c8", metalness: 0.4, roughness: 0.4 });
const matSolarGrid = new THREE.MeshStandardMaterial({ color: "#2a3d6a", metalness: 0.35, roughness: 0.45 });

/* ------------------------------------------------------------------ *
 *  Radiation Shield — the Stevenson-screen style housing for the
 *  temperature / humidity sensor (left arm in the reference photo).
 * ------------------------------------------------------------------ */
function RadiationShield() {
  const discs = [
    { y: 0.18, r: 0.16 },
    { y: 0.10, r: 0.15 },
    { y: 0.02, r: 0.14 },
    { y: -0.06, r: 0.13 },
    { y: -0.13, r: 0.12 },
    { y: -0.19, r: 0.11 },
  ];
  return (
    <group>
      {/* central pillar */}
      <mesh material={matWhite}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
      </mesh>
      {/* louvered discs */}
      {discs.map((d, i) => (
        <mesh key={i} position={[0, d.y, 0]} material={matWhite}>
          <cylinderGeometry args={[d.r, d.r * 0.9, 0.025, 16]} />
        </mesh>
      ))}
      {/* top cap */}
      <mesh position={[0, 0.22, 0]} material={matWhite}>
        <cylinderGeometry args={[0.06, 0.17, 0.04, 16]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Rain Gauge — stainless-steel tipping-bucket collector
 * ------------------------------------------------------------------ */
function RainGauge() {
  return (
    <group>
      {/* main bucket body */}
      <mesh material={matSteel}>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 24]} />
      </mesh>
      {/* rim */}
      <mesh position={[0, 0.285, 0]} material={matSteel}>
        <cylinderGeometry args={[0.24, 0.22, 0.03, 24]} />
      </mesh>
      {/* base */}
      <mesh position={[0, -0.285, 0]} material={matSteel}>
        <cylinderGeometry args={[0.22, 0.20, 0.03, 24]} />
      </mesh>
      {/* support feet */}
      {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.22, -0.22, Math.sin(a) * 0.22]}
          material={matWhite}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Solar Panel — detailed with cell grid, frame, and wiring channel
 * ------------------------------------------------------------------ */
function SolarPanel() {
  return (
    <group rotation={[-Math.PI / 8, 0, 0]}>
      {/* main panel body */}
      <mesh material={matSolar}>
        <boxGeometry args={[0.72, 0.015, 0.52]} />
      </mesh>
      {/* aluminium frame edges */}
      <mesh position={[0, 0.012, 0.26]} material={matSolarFr}>
        <boxGeometry args={[0.74, 0.025, 0.02]} />
      </mesh>
      <mesh position={[0, 0.012, -0.26]} material={matSolarFr}>
        <boxGeometry args={[0.74, 0.025, 0.02]} />
      </mesh>
      <mesh position={[0.37, 0.012, 0]} material={matSolarFr}>
        <boxGeometry args={[0.02, 0.025, 0.52]} />
      </mesh>
      <mesh position={[-0.37, 0.012, 0]} material={matSolarFr}>
        <boxGeometry args={[0.02, 0.025, 0.52]} />
      </mesh>
      {/* vertical gridlines (cell dividers) */}
      {[-0.24, -0.12, 0, 0.12, 0.24].map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0.014, 0]} material={matSolarFr}>
          <boxGeometry args={[0.006, 0.008, 0.50]} />
        </mesh>
      ))}
      {/* horizontal gridlines */}
      {[-0.2, -0.1, 0, 0.1, 0.2].map((z, i) => (
        <mesh key={`h${i}`} position={[0, 0.014, z]} material={matSolarFr}>
          <boxGeometry args={[0.70, 0.008, 0.006]} />
        </mesh>
      ))}
      {/* individual cell tint — subtle bluish rectangles */}
      {[-0.3, -0.18, -0.06, 0.06, 0.18, 0.30].map((x, ci) => (
        [-0.15, -0.05, 0.05, 0.15].map((z, ri) => (
          <mesh key={`cell${ci}_${ri}`} position={[x, 0.0085, z]} material={matSolarGrid}>
            <boxGeometry args={[0.1, 0.002, 0.08]} />
          </mesh>
        ))
      ))}
      {/* back panel bracket */}
      <mesh position={[0, -0.018, 0]} material={matSolarFr}>
        <boxGeometry args={[0.08, 0.02, 0.12]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Junction Box — the white electronics enclosure on the pole
 * ------------------------------------------------------------------ */
function JunctionBox() {
  return (
    <group position={[0.10, 0, 0.06]}>
      {/* main box */}
      <mesh material={matWhite}>
        <boxGeometry args={[0.18, 0.26, 0.12]} />
      </mesh>
      {/* lid seam */}
      <mesh position={[0, 0, 0.062]} material={matSolarFr}>
        <boxGeometry args={[0.16, 0.01, 0.005]} />
      </mesh>
      {/* latch */}
      <mesh position={[0, 0, 0.063]} material={matSolarFr}>
        <boxGeometry args={[0.025, 0.025, 0.01]} />
      </mesh>
      {/* cable gland at bottom */}
      <mesh position={[0, -0.14, 0]} material={matSteel}>
        <cylinderGeometry args={[0.015, 0.015, 0.025, 8]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Base Plate — ground-mounted footing with anchor bolts
 * ------------------------------------------------------------------ */
function BasePlate() {
  const boltPos = [
    [0.18, 0.18],
    [-0.18, 0.18],
    [0.18, -0.18],
    [-0.18, -0.18],
  ] as const;
  return (
    <group position={[0, -2.28, 0]}>
      {/* main plate */}
      <mesh material={matWhite}>
        <boxGeometry args={[0.44, 0.04, 0.44]} />
      </mesh>
      {/* gusset triangle */}
      <mesh position={[0, 0.08, 0]} material={matWhite}>
        <boxGeometry args={[0.08, 0.16, 0.08]} />
      </mesh>
      {/* bolts */}
      {boltPos.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.03, z]} material={matSteel}>
          <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Cross Arm — horizontal bracket holding sensors
 * ------------------------------------------------------------------ */
function CrossArm({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      {/* main arm */}
      <mesh material={matWhite}>
        <boxGeometry args={[1.4, 0.04, 0.04]} />
      </mesh>
      {/* centre clamp */}
      <mesh material={matWhite}>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
      </mesh>
      {/* support bracket flanges */}
      <mesh position={[0, -0.04, 0]} material={matWhite}>
        <boxGeometry args={[0.14, 0.025, 0.06]} />
      </mesh>
    </group>
  );
}

/* ================================================================== *
 *  WeatherStation — complete weather-station mast assembly.
 *
 *  Proportions have been adjusted to match the reference image:
 *  - Overall pole height shortened from 4.6 → 3.2 units
 *  - Solar panel sits at y ≈ 1.9 (was 2.9)
 *  - Cross arm at y ≈ 0.5 (was 0.7)
 *  - Sensors clustered closer to the cross arm
 * ================================================================== */
export default function WeatherStation({
  windSpeed,
  temperature,
  humidity,
  precipitation,
}: WeatherStationProps) {
  return (
    <group rotation={[0, Math.PI, 0]}>
      {/* main mast pole — shortened */}
      <mesh position={[0, -0.3, 0]} material={matWhite}>
        <boxGeometry args={[0.08, 3.6, 0.08]} />
      </mesh>

      {/* thinner extension tube for solar panel */}
      <mesh position={[0, 1.68, 0]} material={matWhite}>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 10]} />
      </mesh>

      {/* Solar Panel — lowered to match reference proportions */}
      <group position={[0, 1.95, 0]}>
        <SolarPanel />
      </group>

      {/* Cross arm with sensors — lowered slightly */}
      <CrossArm y={0.5} />

      {/* Rain gauge — centred on the cross arm */}
      <group position={[0, 0.88, 0]}>
        <RainGauge />
      </group>

      {/* Radiation shield (temp/humidity) — left arm */}
      <group position={[-0.62, 0.65, 0]}>
        <RadiationShield />
      </group>

      {/* Anemometer — right arm */}
      <group position={[0.62, 0.68, 0]}>
        <AnemometerArm windSpeed={windSpeed} />
      </group>

      {/* Junction / electronics box — lower on the mast */}
      <group position={[0, -0.25, 0]}>
        <JunctionBox />
      </group>

      {/* Base plate */}
      <BasePlate />
    </group>
  );
}
