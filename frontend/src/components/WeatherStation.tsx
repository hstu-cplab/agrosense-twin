import React from "react";
import AnemometerArm from "./AnemometerArm";
import * as THREE from "three";

interface WeatherStationProps {
  windSpeed: number;
  temperature: number;
  humidity: number;
  precipitation: number;
}

const matWhite = new THREE.MeshStandardMaterial({ color: "#e8e8e8", metalness: 0.1, roughness: 0.6 });
const matSteel = new THREE.MeshStandardMaterial({ color: "#a0a8a0", metalness: 0.8, roughness: 0.3 });
const matSolar = new THREE.MeshStandardMaterial({ color: "#1a2d5a", metalness: 0.3, roughness: 0.5 });
const matSolarFr = new THREE.MeshStandardMaterial({ color: "#c8c8c8", metalness: 0.4, roughness: 0.4 });

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
      <mesh material={matWhite}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
      </mesh>
      {discs.map((d, i) => (
        <mesh key={i} position={[0, d.y, 0]} material={matWhite}>
          <cylinderGeometry args={[d.r, d.r * 0.9, 0.025, 16]} />
        </mesh>
      ))}
    </group>
  );
}

function RainGauge() {
  return (
    <group>
      <mesh material={matSteel}>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 24]} />
      </mesh>
      <mesh position={[0, 0.285, 0]} material={matSteel}>
        <cylinderGeometry args={[0.24, 0.22, 0.03, 24]} />
      </mesh>
      <mesh position={[0, -0.285, 0]} material={matSteel}>
        <cylinderGeometry args={[0.22, 0.20, 0.03, 24]} />
      </mesh>
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

function SolarPanel() {
  return (
    <group rotation={[-Math.PI / 8, 0, 0]}>
      <mesh material={matSolar}>
        <boxGeometry args={[0.72, 0.015, 0.52]} />
      </mesh>
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
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0.014, 0]} material={matSolarFr}>
          <boxGeometry args={[0.008, 0.01, 0.50]} />
        </mesh>
      ))}
      {[-0.16, 0, 0.16].map((z, i) => (
        <mesh key={`h${i}`} position={[0, 0.014, z]} material={matSolarFr}>
          <boxGeometry args={[0.70, 0.01, 0.008]} />
        </mesh>
      ))}
    </group>
  );
}

function JunctionBox() {
  return (
    <group position={[0.10, 0, 0.06]}>
      <mesh material={matWhite}>
        <boxGeometry args={[0.18, 0.26, 0.12]} />
      </mesh>
      <mesh position={[0, 0, 0.062]} material={matSolarFr}>
        <boxGeometry args={[0.16, 0.01, 0.005]} />
      </mesh>
      <mesh position={[0, 0, 0.063]} material={matSolarFr}>
        <boxGeometry args={[0.025, 0.025, 0.01]} />
      </mesh>
    </group>
  );
}

function BasePlate() {
  const boltPos = [
    [0.18, 0.18],
    [-0.18, 0.18],
    [0.18, -0.18],
    [-0.18, -0.18],
  ] as const;
  return (
    <group position={[0, -2.28, 0]}>
      <mesh material={matWhite}>
        <boxGeometry args={[0.44, 0.04, 0.44]} />
      </mesh>
      {boltPos.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.03, z]} material={matSteel}>
          <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function CrossArm({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh material={matWhite}>
        <boxGeometry args={[1.4, 0.04, 0.04]} />
      </mesh>
      <mesh material={matWhite}>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
      </mesh>
    </group>
  );
}

export default function WeatherStation({
  windSpeed,
  temperature,
  humidity,
  precipitation,
}: WeatherStationProps) {
  return (
    <group rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0, 0]} material={matWhite}>
        <boxGeometry args={[0.08, 4.6, 0.08]} />
      </mesh>
      <mesh position={[0, 2.55, 0]} material={matWhite}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 10]} />
      </mesh>
      <group position={[0, 2.9, 0]}>
        <SolarPanel />
      </group>
      <CrossArm y={0.7} />
      <group position={[0, 1.08, 0]}>
        <RainGauge />
      </group>
      <group position={[-0.62, 0.85, 0]}>
        <RadiationShield />
      </group>
      <group position={[0.62, 0.88, 0]}>
        <AnemometerArm windSpeed={windSpeed} />
      </group>
      <JunctionBox />
      <BasePlate />
    </group>
  );
}
