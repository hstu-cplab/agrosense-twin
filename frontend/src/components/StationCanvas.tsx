import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import WeatherStation from "./WeatherStation";
import SceneLighting from "./SceneLighting";
import RainParticles from "./RainParticles";
import CropField from "./CropField";
import { WeatherData } from "../types";
import { usePalette } from "../theme/ThemeProvider";

interface StationCanvasProps {
  data: WeatherData;
  /** 0-100 crop suitability, drives the field colour/height */
  vitality?: number;
}

export default function StationCanvas({ data, vitality = 70 }: StationCanvasProps) {
  const palette = usePalette();
  const isNight = (data.light ?? 0) < 3;
  const condition = data.condition ?? "Clear";
  // a legible dusk tone rather than near-black, so the mast stays visible at night
  const bg = isNight ? "#243149" : palette.canvas;

  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-hair-strong bg-app">
      <Canvas
        shadows
        camera={{ position: [4, 1.6, 7], fov: 42 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[bg]} />
        {data.humidity > 88 && <fog attach="fog" args={[bg, 12, 28]} />}
        <SceneLighting temperature={data.temperature} condition={condition} night={isNight} />
        {isNight && <Stars radius={40} depth={25} count={400} factor={2.5} fade />}
        <RainParticles precipitation={data.precipitation} />
        <CropField vitality={vitality} windSpeed={data.windSpeed} temperature={data.temperature} />
        <WeatherStation
          windSpeed={data.windSpeed}
          temperature={data.temperature}
          humidity={data.humidity}
          precipitation={data.precipitation}
        />
        <OrbitControls
          makeDefault
          enablePan={false}
          target={[0, -0.2, 0]}
          minDistance={4}
          maxDistance={18}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>
    </div>
  );
}
