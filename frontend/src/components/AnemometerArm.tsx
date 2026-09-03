import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AnemometerArmProps {
  windSpeed: number;
}

export default function AnemometerArm({ windSpeed }: AnemometerArmProps) {
  const spinRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y += (windSpeed / 80) * 5 * delta;
  });

  const matBlack = new THREE.MeshStandardMaterial({ color: "#222222", metalness: 0.3, roughness: 0.6 });
  const matGlass = new THREE.MeshStandardMaterial({ color: "#111111", metalness: 0.6, roughness: 0.2 });

  return (
    <group>
      <mesh material={matBlack}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={matBlack}>
        <cylinderGeometry args={[0.06, 0.06, 0.18, 16]} />
      </mesh>
      <group ref={spinRef} position={[0, 0.22, 0]}>
        <mesh material={matBlack}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
        </mesh>
        {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle, i) => (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matBlack}>
              <cylinderGeometry args={[0.008, 0.008, 0.28, 8]} />
            </mesh>
            <mesh position={[0.28, 0, 0]} material={matGlass}>
              <sphereGeometry args={[0.055, 14, 10, 0, Math.PI]} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, -0.28, 0]} material={matBlack}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
      </mesh>
    </group>
  );
}
