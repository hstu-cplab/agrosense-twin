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
  /** Crop identifier from CROP_CATALOG or 'auto' or 'mixed' */
  cropId?: string;
}

export default function StationCanvas({
  data,
  vitality = 70,
  cropId = "auto",
}: StationCanvasProps) {
  const palette = usePalette();
  const isNight = (data.light ?? 0) < 3;
  const condition = data.condition ?? "Clear";
  // a legible dusk tone rather than near-black, so the mast stays visible at night
  const bg = isNight ? "#243149" : palette.canvas;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-hair-strong bg-app relative shadow-sm">
      <Canvas
        shadows
        camera={{ position: [4.6, 2.0, 7.8], fov: 40 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[bg]} />
        {data.humidity > 88 && <fog attach="fog" args={[bg, 14, 30]} />}
        <SceneLighting temperature={data.temperature} condition={condition} night={isNight} />
        {isNight && <Stars radius={40} depth={25} count={400} factor={2.5} fade />}
        <RainParticles precipitation={data.precipitation} />
        <CropField
          vitality={vitality}
          windSpeed={data.windSpeed}
          temperature={data.temperature}
          cropId={cropId}
        />
        <WeatherStation
          windSpeed={data.windSpeed}
          temperature={data.temperature}
          humidity={data.humidity}
          precipitation={data.precipitation}
        />
        <OrbitControls
          makeDefault
          enablePan={false}
          target={[0, 0.28, 0]}
          minDistance={3.5}
          maxDistance={18}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>
    </div>
  );
}
