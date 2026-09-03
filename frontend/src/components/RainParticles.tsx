import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from "three";

interface RainParticlesProps {
  precipitation: number;
}

export default function RainParticles({ precipitation }: RainParticlesProps) {
  const pointsRef = useRef<Points>(null!);
  const count = Math.min(Math.floor(precipitation * 80), 600);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = Math.random() * 8 - 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= delta * 4;
      if (pos[i * 3 + 1] < -2.5) {
        pos[i * 3 + 1] = 6;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const mat = new PointsMaterial({ color: "#aaccff", size: 0.04, transparent: true, opacity: 0.6 });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}
