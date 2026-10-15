import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CropFieldProps {
  /** 0-100 crop suitability / health — drives colour and height */
  vitality: number;
  /** m/s — drives sway amplitude */
  windSpeed: number;
  temperature: number;
}

/* ---- layout ---- */
const COLS = 10;
const ROWS = 8;
const SPACING = 0.38;
const CLEAR_RADIUS = 0.55;

/* materials are created per-component via useMemo or inline JSX */

/* ------------------------------------------------------------------ *
 *  Single Rice Plant — tapered stem with 3-5 blade leaves and a
 *  drooping panicle (grain cluster) at the top.
 * ------------------------------------------------------------------ */
function RicePlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color.clone().lerp(new THREE.Color("#5a7a3a"), 0.3),
    roughness: 0.75,
    side: THREE.DoubleSide,
  }), [color]);

  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    side: THREE.DoubleSide,
  }), [color]);

  const grainMat = useMemo(() => {
    const v = color.clone().lerp(new THREE.Color("#e4cf7a"), 0.65);
    return new THREE.MeshStandardMaterial({ color: v, roughness: 0.6 });
  }, [color]);

  const leafCount = 3 + Math.floor(phase * 2.5) % 3;
  const h = height;

  return (
    <group>
      {/* main stem — tapered cylinder */}
      <mesh material={stemMat}>
        <cylinderGeometry args={[0.008, 0.014, h, 6]} />
      </mesh>

      {/* blade leaves at various heights */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const leafY = h * (0.25 + (i / leafCount) * 0.55);
        const angle = (i * 137.5 * Math.PI) / 180 + phase; // golden angle spread
        const leafLen = 0.12 + Math.random() * 0.08;
        const droop = 0.3 + Math.random() * 0.3;
        return (
          <group key={i} position={[0, leafY - h / 2, 0]} rotation={[0, angle, 0]}>
            <group rotation={[0, 0, droop]}>
              <mesh position={[leafLen / 2, 0, 0]} material={leafMat}>
                <boxGeometry args={[leafLen, 0.003, 0.022]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* panicle / grain head — drooping cluster */}
      <group position={[0, h / 2 - 0.01, 0]}>
        {/* panicle stem — slight arch */}
        <mesh position={[0.015, 0.035, 0]} rotation={[0, 0, 0.3]} material={stemMat}>
          <cylinderGeometry args={[0.004, 0.005, 0.08, 5]} />
        </mesh>
        {/* grain cluster — small spheres */}
        {[
          [0.025, 0.05, 0],
          [0.035, 0.04, 0.008],
          [0.03, 0.03, -0.006],
          [0.02, 0.06, 0.005],
          [0.04, 0.035, -0.004],
        ].map(([x, y, z], gi) => (
          <mesh key={gi} position={[x, y, z]} material={grainMat}>
            <sphereGeometry args={[0.009, 6, 5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Single Maize Plant — thick stalk, broad arching leaves, corn cob
 *  with husk, and optional tassel at top.
 * ------------------------------------------------------------------ */
function MaizePlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const stalkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color.clone().lerp(new THREE.Color("#6a8a3f"), 0.25),
    roughness: 0.7,
    side: THREE.DoubleSide,
  }), [color]);

  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    side: THREE.DoubleSide,
  }), [color]);

  const cobMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#e7c14b", roughness: 0.5 }),
  []);

  const huskMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#8fae5a", roughness: 0.7, side: THREE.DoubleSide }),
  []);

  const silkMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#c4964a", roughness: 0.8 }),
  []);

  const h = height;
  const leafCount = 4 + Math.floor(phase * 3) % 3;

  return (
    <group>
      {/* main stalk — segmented */}
      <mesh material={stalkMat}>
        <cylinderGeometry args={[0.016, 0.022, h, 8]} />
      </mesh>
      {/* stalk nodes — slight bulges */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`node${i}`} position={[0, -h / 2 + h * (0.2 + i * 0.2), 0]} material={stalkMat}>
          <cylinderGeometry args={[0.024, 0.024, 0.012, 8]} />
        </mesh>
      ))}

      {/* broad arching leaves */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const leafY = h * (0.15 + (i / leafCount) * 0.65);
        const angle = (i * 137.5 * Math.PI) / 180 + phase;
        const leafLen = 0.18 + Math.random() * 0.1;
        const droop = 0.5 + Math.random() * 0.35;
        return (
          <group key={i} position={[0, leafY - h / 2, 0]} rotation={[0, angle, 0]}>
            <group rotation={[0, 0, droop]}>
              <mesh position={[leafLen / 2, 0, 0]} material={leafMat}>
                <boxGeometry args={[leafLen, 0.003, 0.04]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* corn cob — positioned at ~60% height */}
      <group position={[0.03, h * 0.12, 0]} rotation={[0, phase, 0.6]}>
        {/* cob body */}
        <mesh material={cobMat}>
          <cylinderGeometry args={[0.022, 0.018, 0.08, 8]} />
        </mesh>
        {/* husk leaves wrapping the cob */}
        <mesh position={[0, 0, 0.015]} rotation={[0, 0, 0.1]} material={huskMat}>
          <boxGeometry args={[0.04, 0.09, 0.005]} />
        </mesh>
        <mesh position={[0, 0, -0.015]} rotation={[0, 0, -0.1]} material={huskMat}>
          <boxGeometry args={[0.04, 0.09, 0.005]} />
        </mesh>
        {/* silk */}
        <mesh position={[0, 0.045, 0]} material={silkMat}>
          <cylinderGeometry args={[0.002, 0.01, 0.03, 6]} />
        </mesh>
      </group>

      {/* tassel at top */}
      <group position={[0, h / 2, 0]}>
        {[0, 1.05, 2.1, 3.14, 4.19, 5.24].map((a, ti) => (
          <mesh key={ti} position={[Math.cos(a) * 0.012, 0.02, Math.sin(a) * 0.012]} rotation={[0.3, a, 0.4]} material={silkMat}>
            <cylinderGeometry args={[0.002, 0.001, 0.04, 4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Grass tuft — small decorative filler between crops
 * ------------------------------------------------------------------ */
function GrassTuft({ color }: { color: THREE.Color }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color.clone().lerp(new THREE.Color("#3d5a28"), 0.5),
    roughness: 0.85,
    side: THREE.DoubleSide,
  }), [color]);

  return (
    <group>
      {[-0.4, -0.15, 0.1, 0.35].map((rot, i) => (
        <mesh key={i} rotation={[0, i * 1.6, rot]} material={mat}>
          <boxGeometry args={[0.005, 0.06 + Math.random() * 0.04, 0.018]} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================== *
 *  CropField — main component
 *
 *  Renders a mix of Rice and Maize plants on a soil/paddy field.
 *  Plant type alternates by column: even = rice, odd = maize.
 *  Vitality drives colour (straw ↔ lush green) and height.
 *  Wind drives sway.
 * ================================================================== */
export default function CropField({ vitality, windSpeed, temperature }: CropFieldProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const plants = useMemo(() => {
    const arr: {
      x: number; z: number; h: number; phase: number;
      type: "rice" | "maize" | "grass";
    }[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = (c - (COLS - 1) / 2) * SPACING + (Math.random() - 0.5) * 0.1;
        const z = (r - (ROWS - 1) / 2) * SPACING + (Math.random() - 0.5) * 0.1;
        if (Math.hypot(x, z) < CLEAR_RADIUS) continue;
        const phase = Math.random() * Math.PI * 2;
        // alternate crop type by position: a mix of rice and maize
        const type: "rice" | "maize" = (c + r) % 3 === 0 ? "maize" : "rice";
        const baseH = type === "maize" ? 0.7 + Math.random() * 0.35 : 0.45 + Math.random() * 0.3;
        arr.push({ x, z, h: baseH, phase, type });
      }
    }
    // scatter some grass tufts
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.7 + Math.random() * 1.6;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.hypot(x, z) < CLEAR_RADIUS) continue;
      arr.push({ x, z, h: 0.06, phase: Math.random() * Math.PI * 2, type: "grass" });
    }
    return arr;
  }, []);

  const color = useMemo(() => {
    const v = Math.max(0, Math.min(1, vitality / 100));
    const straw = new THREE.Color("#b7a955");
    const lush = new THREE.Color("#4c9a3f");
    return straw.clone().lerp(lush, v);
  }, [vitality]);

  /* sway animation — rotate the entire crop group gently */
  useFrame((stateFrame) => {
    const g = groupRef.current;
    if (!g) return;
    const t = stateFrame.clock.elapsedTime;
    const sway = Math.min(0.12, windSpeed / 50);
    g.children.forEach((child, idx) => {
      if (!child.userData.isPlant) return;
      const p = plants[child.userData.plantIdx];
      if (!p) return;
      const lean = Math.sin(t * 1.8 + p.phase) * sway + sway * 0.3;
      const lean2 = Math.sin(t * 1.2 + p.phase * 0.7) * sway * 0.5;
      child.rotation.z = lean;
      child.rotation.x = lean2;
    });
  });

  const dry = temperature > 38 || vitality < 30;
  const heightScale = 0.6 + Math.max(0, Math.min(1, vitality / 100)) * 0.5;

  return (
    <group ref={groupRef}>
      {/* soil disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.32, 0]} receiveShadow>
        <circleGeometry args={[2.6, 40]} />
        <meshStandardMaterial color={dry ? "#7c6a4d" : "#5a4a34"} roughness={1} />
      </mesh>
      {/* paddy water shimmer for rice (only if not dry) */}
      {!dry && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.305, 0]}>
          <circleGeometry args={[2.5, 40]} />
          <meshStandardMaterial
            color="#4a6b45"
            roughness={0.4}
            metalness={0.15}
            transparent
            opacity={0.18}
          />
        </mesh>
      )}
      {/* outer grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.34, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2c3a22" roughness={1} />
      </mesh>
      {/* dirt path — narrow strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, -2.33, 0]}>
        <planeGeometry args={[0.6, 6]} />
        <meshStandardMaterial color="#8a7a5c" roughness={1} />
      </mesh>

      {/* render each plant */}
      {plants.map((p, i) => {
        const scaledH = p.h * heightScale;
        const plantGroup = (
          <group
            key={i}
            position={[p.x, -2.3 + scaledH / 2, p.z]}
            userData={{ isPlant: true, plantIdx: i }}
          >
            {p.type === "rice" && (
              <RicePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "maize" && (
              <MaizePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "grass" && (
              <GrassTuft color={color} />
            )}
          </group>
        );
        return plantGroup;
      })}

      {/* low brick wall hint — like in the reference photo */}
      <group position={[0, -2.1, -2.2]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh
            key={i}
            position={[(i - 5.5) * 0.38, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.36, 0.22, 0.18]} />
            <meshStandardMaterial color="#8b5a3c" roughness={0.9} />
          </mesh>
        ))}
        {/* top layer offset */}
        {Array.from({ length: 11 }).map((_, i) => (
          <mesh
            key={`t${i}`}
            position={[(i - 5) * 0.38, 0.22, 0]}
            castShadow
          >
            <boxGeometry args={[0.36, 0.22, 0.18]} />
            <meshStandardMaterial color="#9a6848" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
