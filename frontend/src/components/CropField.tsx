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

const COLS = 9;
const ROWS = 7;
const SPACING = 0.42;

/**
 * A low-poly crop patch around the mast base. Blade colour lerps from
 * straw (poor fit) to lush green (good fit); the whole field leans and
 * shivers with wind.
 */
export default function CropField({ vitality, windSpeed, temperature }: CropFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const blades = useMemo(() => {
    const arr: { x: number; z: number; h: number; phase: number }[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = (c - (COLS - 1) / 2) * SPACING + (Math.random() - 0.5) * 0.12;
        const z = (r - (ROWS - 1) / 2) * SPACING + (Math.random() - 0.5) * 0.12;
        // keep a clear ring around the mast footing
        if (Math.hypot(x, z) < 0.5) continue;
        arr.push({ x, z, h: 0.55 + Math.random() * 0.35, phase: Math.random() * Math.PI * 2 });
      }
    }
    return arr;
  }, []);

  const color = useMemo(() => {
    const v = Math.max(0, Math.min(1, vitality / 100));
    const straw = new THREE.Color("#b7a955");
    const lush = new THREE.Color("#4c9a3f");
    return straw.clone().lerp(lush, v);
  }, [vitality]);

  useFrame((stateFrame) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = stateFrame.clock.elapsedTime;
    const sway = Math.min(0.5, windSpeed / 22);
    const heightScale = 0.6 + Math.max(0, Math.min(1, vitality / 100)) * 0.7;
    blades.forEach((b, i) => {
      const lean = Math.sin(t * 2 + b.phase) * sway + sway * 0.6;
      dummy.position.set(b.x, -2.3 + (b.h * heightScale) / 2, b.z);
      dummy.rotation.set(0, 0, lean);
      dummy.scale.set(1, b.h * heightScale, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  const dry = temperature > 38 || vitality < 30;

  return (
    <group>
      {/* soil */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.32, 0]} receiveShadow>
        <circleGeometry args={[2.6, 40]} />
        <meshStandardMaterial color={dry ? "#7c6a4d" : "#5a4a34"} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.34, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2c3a22" roughness={1} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, blades.length]} castShadow>
        <boxGeometry args={[0.05, 1, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
