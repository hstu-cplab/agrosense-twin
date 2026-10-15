import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type CropVisualKind =
  | "rice"
  | "wheat"
  | "maize"
  | "mustard"
  | "jute"
  | "sugarcane"
  | "potato"
  | "tomato"
  | "chili"
  | "banana"
  | "legume"
  | "vine";

export interface CropFieldProps {
  /** 0-100 crop suitability / health — drives colour and height */
  vitality: number;
  /** m/s — drives sway amplitude */
  windSpeed: number;
  temperature: number;
  /** Selected crop ID from CROP_CATALOG or 'auto' or 'mixed' */
  cropId?: string;
}

/* ---- layout ---- */
const COLS = 10;
const ROWS = 8;
const SPACING = 0.38;
const CLEAR_RADIUS = 0.65;

export function resolveCropVisual(id?: string): CropVisualKind {
  if (!id) return "rice";
  switch (id.toLowerCase()) {
    case "rice":
      return "rice";
    case "wheat":
      return "wheat";
    case "maize":
    case "corn":
      return "maize";
    case "mustard":
      return "mustard";
    case "jute":
      return "jute";
    case "sugarcane":
      return "sugarcane";
    case "potato":
      return "potato";
    case "tomato":
      return "tomato";
    case "chili":
    case "chilli":
      return "chili";
    case "banana":
    case "mango":
    case "papaya":
      return "banana";
    case "lentil":
    case "chickpea":
      return "legume";
    case "watermelon":
    case "cucumber":
      return "vine";
    default:
      return "rice";
  }
}

/* ------------------------------------------------------------------ *
 *  1. Rice Plant — slender stem, drooping blade leaves & grain panicle
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

  const leafCount = 3 + (Math.floor(phase * 2.5) % 3);
  const h = height;

  return (
    <group>
      <mesh material={stemMat}>
        <cylinderGeometry args={[0.008, 0.014, h, 6]} />
      </mesh>
      {Array.from({ length: leafCount }).map((_, i) => {
        const leafY = h * (0.22 + (i / leafCount) * 0.55);
        const angle = (i * 137.5 * Math.PI) / 180 + phase;
        const leafLen = 0.14 + (phase % 0.08);
        const droop = 0.35 + (i * 0.1);
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
      {/* drooping panicle */}
      <group position={[0, h / 2 - 0.01, 0]}>
        <mesh position={[0.015, 0.035, 0]} rotation={[0, 0, 0.35]} material={stemMat}>
          <cylinderGeometry args={[0.004, 0.006, 0.08, 5]} />
        </mesh>
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
 *  2. Wheat Plant — golden-amber culm, upright awned spike / bearded ear
 * ------------------------------------------------------------------ */
function WheatPlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const wheatStemMat = useMemo(() => {
    const c = color.clone().lerp(new THREE.Color("#deb86a"), 0.55);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  }, [color]);

  const spikeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d8ad54"),
    roughness: 0.65,
  }), []);

  const awnMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#c99a42"),
    roughness: 0.5,
  }), []);

  const h = height * 0.9;

  return (
    <group>
      {/* slender culm */}
      <mesh material={wheatStemMat}>
        <cylinderGeometry args={[0.007, 0.011, h, 6]} />
      </mesh>
      {/* narrow erect leaves */}
      {[-0.3, 0.3].map((ang, i) => (
        <group key={i} position={[0, -h * 0.15 + i * 0.1, 0]} rotation={[0, phase + i * 2.2, ang]}>
          <mesh position={[0.06, 0.02, 0]} material={wheatStemMat}>
            <boxGeometry args={[0.12, 0.002, 0.012]} />
          </mesh>
        </group>
      ))}
      {/* wheat spike / ear with alternating grains */}
      <group position={[0, h / 2 + 0.04, 0]}>
        <mesh material={spikeMat}>
          <cylinderGeometry args={[0.014, 0.016, 0.11, 7]} />
        </mesh>
        {/* awn bristles fanning upward */}
        {[-0.2, -0.1, 0, 0.1, 0.2].map((ax, ai) => (
          <mesh key={ai} position={[ax * 0.05, 0.075, (ai % 2 === 0 ? 0.005 : -0.005)]} rotation={[0, 0, ax * 0.8]} material={awnMat}>
            <cylinderGeometry args={[0.001, 0.002, 0.06, 4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  3. Maize Plant — thick stalk, wide arching leaves, cob with silk
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

  const cobMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e7c14b", roughness: 0.5 }), []);
  const huskMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8fae5a", roughness: 0.7, side: THREE.DoubleSide }), []);
  const silkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c4964a", roughness: 0.8 }), []);

  const h = height * 1.1;
  const leafCount = 4 + (Math.floor(phase * 3) % 3);

  return (
    <group>
      <mesh material={stalkMat}>
        <cylinderGeometry args={[0.016, 0.022, h, 8]} />
      </mesh>
      {/* stalk nodes */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`node${i}`} position={[0, -h / 2 + h * (0.2 + i * 0.2), 0]} material={stalkMat}>
          <cylinderGeometry args={[0.024, 0.024, 0.012, 8]} />
        </mesh>
      ))}
      {/* broad arching leaves */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const leafY = h * (0.15 + (i / leafCount) * 0.65);
        const angle = (i * 137.5 * Math.PI) / 180 + phase;
        const leafLen = 0.2 + (phase % 0.08);
        const droop = 0.5 + (i * 0.08);
        return (
          <group key={i} position={[0, leafY - h / 2, 0]} rotation={[0, angle, 0]}>
            <group rotation={[0, 0, droop]}>
              <mesh position={[leafLen / 2, 0, 0]} material={leafMat}>
                <boxGeometry args={[leafLen, 0.003, 0.042]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* corn cob */}
      <group position={[0.03, h * 0.12, 0]} rotation={[0, phase, 0.55]}>
        <mesh material={cobMat}>
          <cylinderGeometry args={[0.022, 0.018, 0.08, 8]} />
        </mesh>
        <mesh position={[0, 0, 0.015]} rotation={[0, 0, 0.1]} material={huskMat}>
          <boxGeometry args={[0.04, 0.09, 0.005]} />
        </mesh>
        <mesh position={[0, 0, -0.015]} rotation={[0, 0, -0.1]} material={huskMat}>
          <boxGeometry args={[0.04, 0.09, 0.005]} />
        </mesh>
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
 *  4. Mustard Plant — branched stems, vivid golden-yellow flower crown
 * ------------------------------------------------------------------ */
function MustardPlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#4f8232"),
    roughness: 0.7,
  }), []);

  const flowerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffcf10"),
    roughness: 0.4,
    emissive: new THREE.Color("#b58a00"),
    emissiveIntensity: 0.2,
  }), []);

  const podMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5a9437"),
    roughness: 0.65,
  }), []);

  const h = height * 0.85;

  return (
    <group>
      {/* main stem */}
      <mesh material={stemMat}>
        <cylinderGeometry args={[0.01, 0.014, h, 6]} />
      </mesh>
      {/* side branches */}
      {[
        { y: -0.05, rot: 0.5, ang: 0 },
        { y: 0.05, rot: 0.55, ang: 2.1 },
        { y: 0.15, rot: 0.45, ang: 4.2 },
      ].map((b, bi) => (
        <group key={bi} position={[0, b.y, 0]} rotation={[0, b.ang + phase, 0]}>
          <group rotation={[0, 0, b.rot]}>
            <mesh position={[0.06, 0, 0]} material={stemMat}>
              <cylinderGeometry args={[0.004, 0.006, 0.12, 5]} />
            </mesh>
            {/* flower cluster at branch tip */}
            <mesh position={[0.12, 0, 0]} material={flowerMat}>
              <sphereGeometry args={[0.022, 6, 6]} />
            </mesh>
            {/* silique pod */}
            <mesh position={[0.06, 0.02, 0]} rotation={[0, 0, 0.3]} material={podMat}>
              <cylinderGeometry args={[0.002, 0.003, 0.05, 4]} />
            </mesh>
          </group>
        </group>
      ))}
      {/* dense yellow floral head at top */}
      <group position={[0, h / 2, 0]}>
        {[
          [0, 0.03, 0],
          [0.02, 0.02, 0.02],
          [-0.02, 0.02, -0.015],
          [0.015, 0.01, -0.02],
          [-0.015, 0.015, 0.02],
        ].map(([fx, fy, fz], fi) => (
          <mesh key={fi} position={[fx, fy, fz]} material={flowerMat}>
            <sphereGeometry args={[0.018, 6, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  5. Jute Plant — tall unbranched fibrous green stem & serrated leaves
 * ------------------------------------------------------------------ */
function JutePlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const juteStemMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: color.clone().lerp(new THREE.Color("#7fa84d"), 0.4),
    roughness: 0.75,
  }), [color]);

  const juteLeafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#3c782b"),
    roughness: 0.6,
    side: THREE.DoubleSide,
  }), []);

  const h = height * 1.35; // Jute is famously tall
  const leafCount = 8;

  return (
    <group>
      {/* tall straight fibrous stem */}
      <mesh material={juteStemMat}>
        <cylinderGeometry args={[0.012, 0.018, h, 7]} />
      </mesh>
      {/* spiraling leaves spreading horizontally */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const leafY = -h / 2 + (i / leafCount) * (h * 0.9) + 0.1;
        const ang = (i * 137.5 * Math.PI) / 180 + phase;
        return (
          <group key={i} position={[0, leafY, 0]} rotation={[0, ang, 0]}>
            <group rotation={[0, 0, 0.25]}>
              <mesh position={[0.075, 0, 0]} material={juteLeafMat}>
                <boxGeometry args={[0.13, 0.003, 0.03]} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  6. Sugarcane Plant — clustered jointed thick canes with crown fountain
 * ------------------------------------------------------------------ */
function SugarcanePlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const caneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5d4638"), // purplish-amber cane
    roughness: 0.65,
  }), []);

  const caneLeafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#4a8c32"),
    roughness: 0.65,
    side: THREE.DoubleSide,
  }), []);

  const h = height * 1.3;

  return (
    <group>
      {/* 2-3 clumped stalks */}
      {[-0.03, 0.03].map((cx, ci) => (
        <group key={ci} position={[cx, 0, (ci === 0 ? -0.02 : 0.02)]}>
          <mesh material={caneMat}>
            <cylinderGeometry args={[0.018, 0.024, h, 8]} />
          </mesh>
          {/* node rings */}
          {Array.from({ length: 5 }).map((_, ni) => (
            <mesh key={ni} position={[0, -h / 2 + (ni + 1) * (h / 6), 0]} material={caneMat}>
              <cylinderGeometry args={[0.025, 0.025, 0.014, 8]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* crown of cascading arching strap leaves */}
      <group position={[0, h / 2, 0]}>
        {Array.from({ length: 7 }).map((_, li) => {
          const ang = (li * 51.4 * Math.PI) / 180 + phase;
          return (
            <group key={li} rotation={[0, ang, 0]}>
              <group rotation={[0, 0, 0.7]}>
                <mesh position={[0.13, 0, 0]} material={caneLeafMat}>
                  <boxGeometry args={[0.26, 0.003, 0.026]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  7. Potato Plant — compact bushy foliage mound with floral blossoms
 * ------------------------------------------------------------------ */
function PotatoPlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2f6626"),
    roughness: 0.8,
    side: THREE.DoubleSide,
  }), []);

  const flowerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f2eefa"), // pale lilac blossom
    roughness: 0.5,
  }), []);

  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffc107"),
    roughness: 0.3,
  }), []);

  const h = height * 0.7;

  return (
    <group>
      {/* central stem */}
      <mesh material={leafMat}>
        <cylinderGeometry args={[0.012, 0.018, h, 6]} />
      </mesh>
      {/* compound mounded leaves */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = -h * 0.2 + (i / 6) * (h * 0.7);
        const ang = (i * 60 * Math.PI) / 180 + phase;
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, ang, 0.45]}>
            <mesh position={[0.07, 0, 0]} material={leafMat}>
              <boxGeometry args={[0.12, 0.004, 0.05]} />
            </mesh>
          </group>
        );
      })}
      {/* small potato blossoms */}
      <group position={[0.03, h * 0.38, 0.02]}>
        <mesh material={flowerMat}>
          <cylinderGeometry args={[0.02, 0.002, 0.01, 5]} />
        </mesh>
        <mesh position={[0, 0.006, 0]} material={centerMat}>
          <sphereGeometry args={[0.006, 6, 6]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  8. Tomato Plant — sprawling branching bush with ripe red tomatoes
 * ------------------------------------------------------------------ */
function TomatoPlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const vineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#44752c"),
    roughness: 0.75,
  }), []);

  const tomatoMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d32f2f"), // bright red ripe tomato
    roughness: 0.3,
    metalness: 0.1,
  }), []);

  const greenTomatoMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7cb342"), // unripe tomato
    roughness: 0.4,
  }), []);

  const stakeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#8d734a"), // bamboo support stake
    roughness: 0.9,
  }), []);

  const h = height * 0.9;

  return (
    <group>
      {/* bamboo stake support */}
      <mesh position={[-0.02, 0, 0]} material={stakeMat}>
        <cylinderGeometry args={[0.006, 0.008, h * 1.15, 6]} />
      </mesh>
      {/* main vine */}
      <mesh material={vineMat}>
        <cylinderGeometry args={[0.01, 0.014, h, 6]} />
      </mesh>
      {/* branching leaves */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = -h * 0.3 + (i / 5) * (h * 0.8);
        const ang = (i * 72 * Math.PI) / 180 + phase;
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, ang, 0.4]}>
            <mesh position={[0.065, 0, 0]} material={vineMat}>
              <boxGeometry args={[0.11, 0.003, 0.04]} />
            </mesh>
          </group>
        );
      })}
      {/* clusters of ripe red tomatoes */}
      <mesh position={[0.05, -h * 0.05, 0.04]} material={tomatoMat}>
        <sphereGeometry args={[0.024, 8, 8]} />
      </mesh>
      <mesh position={[0.07, -h * 0.08, -0.02]} material={tomatoMat}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>
      {/* unripe green tomato */}
      <mesh position={[-0.04, h * 0.15, 0.03]} material={greenTomatoMat}>
        <sphereGeometry args={[0.016, 7, 7]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  9. Chili Plant — compact bush with scarlet and emerald peppers
 * ------------------------------------------------------------------ */
function ChiliPlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const bushMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2e6024"),
    roughness: 0.7,
    side: THREE.DoubleSide,
  }), []);

  const redPepperMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e53935"),
    roughness: 0.25,
    metalness: 0.15,
  }), []);

  const greenPepperMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#43a047"),
    roughness: 0.3,
  }), []);

  const h = height * 0.75;

  return (
    <group>
      <mesh material={bushMat}>
        <cylinderGeometry args={[0.01, 0.016, h, 6]} />
      </mesh>
      {/* leaves */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = -h * 0.25 + (i / 6) * (h * 0.75);
        const ang = (i * 60 * Math.PI) / 180 + phase;
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, ang, 0.35]}>
            <mesh position={[0.055, 0, 0]} material={bushMat}>
              <boxGeometry args={[0.09, 0.003, 0.03]} />
            </mesh>
          </group>
        );
      })}
      {/* conical red chilies */}
      <group position={[0.04, 0.02, 0.02]} rotation={[0.4, 0, 2.7]}>
        <mesh material={redPepperMat}>
          <coneGeometry args={[0.009, 0.045, 6]} />
        </mesh>
      </group>
      <group position={[-0.03, -0.04, 0.03]} rotation={[-0.3, 0, 2.5]}>
        <mesh material={redPepperMat}>
          <coneGeometry args={[0.008, 0.04, 6]} />
        </mesh>
      </group>
      {/* fresh green chili */}
      <group position={[0.02, 0.08, -0.03]} rotation={[0.2, 0, 2.8]}>
        <mesh material={greenPepperMat}>
          <coneGeometry args={[0.008, 0.038, 6]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  10. Banana Plant — trunk pseudo-stem, giant arching paddle leaves
 * ------------------------------------------------------------------ */
function BananaPlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#566e3b"),
    roughness: 0.8,
  }), []);

  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#387829"),
    roughness: 0.6,
    side: THREE.DoubleSide,
  }), []);

  const bananaMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7cb342"),
    roughness: 0.5,
  }), []);

  const h = height * 1.25;

  return (
    <group>
      {/* pseudo-stem trunk */}
      <mesh material={trunkMat}>
        <cylinderGeometry args={[0.032, 0.048, h, 8]} />
      </mesh>
      {/* massive paddle leaves arching from crown */}
      {Array.from({ length: 5 }).map((_, i) => {
        const ang = (i * 72 * Math.PI) / 180 + phase;
        return (
          <group key={i} position={[0, h * 0.42, 0]} rotation={[0, ang, 0]}>
            <group rotation={[0, 0, 0.6]}>
              <mesh position={[0.18, 0, 0]} material={leafMat}>
                <boxGeometry args={[0.36, 0.004, 0.11]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* hanging green banana bunch under leaf crown */}
      <group position={[0.05, h * 0.28, 0]} rotation={[0, 0, 0.3]}>
        {[0, 0.02, -0.02].map((bx, bi) => (
          <mesh key={bi} position={[bx, -bi * 0.02, 0]} material={bananaMat}>
            <cylinderGeometry args={[0.008, 0.006, 0.045, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  11. Legume Plant (Lentil / Chickpea) — delicate feathery foliage & pods
 * ------------------------------------------------------------------ */
function LegumePlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5f8c46"),
    roughness: 0.75,
  }), []);

  const podMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#88a858"),
    roughness: 0.6,
  }), []);

  const h = height * 0.7;

  return (
    <group>
      <mesh material={stemMat}>
        <cylinderGeometry args={[0.007, 0.011, h, 6]} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const y = -h * 0.2 + (i / 5) * (h * 0.7);
        const ang = (i * 72 * Math.PI) / 180 + phase;
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, ang, 0.45]}>
            <mesh position={[0.055, 0, 0]} material={stemMat}>
              <boxGeometry args={[0.09, 0.003, 0.025]} />
            </mesh>
            {/* pod */}
            <mesh position={[0.06, -0.015, 0]} rotation={[0, 0, 0.3]} material={podMat}>
              <cylinderGeometry args={[0.007, 0.004, 0.03, 5]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  12. Vine Plant (Watermelon / Cucumber) — trailing vine with melon
 * ------------------------------------------------------------------ */
function VinePlant({ height, color, phase }: { height: number; color: THREE.Color; phase: number }) {
  const vineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#3c6e2b"),
    roughness: 0.8,
    side: THREE.DoubleSide,
  }), []);

  const melonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2a5c28"), // deep green striped watermelon
    roughness: 0.35,
  }), []);

  return (
    <group position={[0, -height * 0.35, 0]}>
      {/* trailing vine on soil */}
      <mesh rotation={[0, phase, 0]} material={vineMat}>
        <cylinderGeometry args={[0.006, 0.008, 0.24, 6]} />
      </mesh>
      {/* lobed leaves resting near soil */}
      {[-0.08, 0.08].map((lx, li) => (
        <mesh key={li} position={[lx, 0.02, (li === 0 ? 0.04 : -0.04)]} material={vineMat}>
          <boxGeometry args={[0.07, 0.004, 0.06]} />
        </mesh>
      ))}
      {/* plump watermelon resting on ground */}
      <mesh position={[0.05, 0.04, 0]} material={melonMat}>
        <sphereGeometry args={[0.048, 10, 8]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Grass Tuft — subtle filler
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
          <boxGeometry args={[0.005, 0.06 + (i * 0.01), 0.018]} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================== *
 *  CropField — main component
 *
 *  Supports:
 *  - Individual crop visualization: Rice, Wheat, Maize, Mustard, Jute,
 *    Sugarcane, Potato, Tomato, Chili, Banana, Legume, Vine
 *  - "mixed" polyculture field
 *  - Vitality drives colour and plant growth height
 *  - Real-time wind swaying with physics tuned per plant category
 *  - CLEAN, natural agricultural ground WITHOUT bricks or sand lines!
 * ================================================================== */
export default function CropField({
  vitality,
  windSpeed,
  temperature,
  cropId = "auto",
}: CropFieldProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const isMixed = cropId === "mixed";
  const visualKind = resolveCropVisual(cropId);

  /* Generate plant positions around the central station mast */
  const plants = useMemo(() => {
    const arr: {
      x: number;
      z: number;
      h: number;
      phase: number;
      type: CropVisualKind | "grass";
    }[] = [];

    const mixedPalette: CropVisualKind[] = [
      "rice",
      "maize",
      "mustard",
      "wheat",
      "tomato",
      "sugarcane",
      "jute",
      "chili",
    ];

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = (c - (COLS - 1) / 2) * SPACING + (Math.sin(c * 17 + r) * 0.06);
        const z = (r - (ROWS - 1) / 2) * SPACING + (Math.cos(r * 19 + c) * 0.06);
        if (Math.hypot(x, z) < CLEAR_RADIUS) continue;

        const phase = (c * 1.3 + r * 2.7) % (Math.PI * 2);

        let type: CropVisualKind;
        if (isMixed) {
          type = mixedPalette[(c + r * 2) % mixedPalette.length];
        } else {
          type = visualKind;
        }

        let baseH = 0.5;
        if (type === "sugarcane" || type === "jute" || type === "banana") {
          baseH = 0.75 + (phase % 0.15);
        } else if (type === "maize") {
          baseH = 0.65 + (phase % 0.15);
        } else if (type === "potato" || type === "chili" || type === "legume") {
          baseH = 0.42 + (phase % 0.1);
        } else if (type === "vine") {
          baseH = 0.32 + (phase % 0.08);
        } else {
          baseH = 0.5 + (phase % 0.12);
        }

        arr.push({ x, z, h: baseH, phase, type });
      }
    }

    /* add some natural grass tufts around the edges */
    for (let i = 0; i < 16; i++) {
      const angle = (i * 22.5 * Math.PI) / 180;
      const dist = 0.9 + ((i % 5) * 0.28);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.hypot(x, z) < CLEAR_RADIUS) continue;
      arr.push({ x, z, h: 0.06, phase: angle, type: "grass" });
    }

    return arr;
  }, [isMixed, visualKind]);

  /* Crop vitality color interpolation */
  const color = useMemo(() => {
    const v = Math.max(0, Math.min(1, vitality / 100));
    const straw = new THREE.Color("#b7a955");
    const lush = new THREE.Color("#43933a");
    return straw.clone().lerp(lush, v);
  }, [vitality]);

  /* Sway animation — reacts to wind speed */
  useFrame((stateFrame) => {
    const g = groupRef.current;
    if (!g) return;
    const t = stateFrame.clock.elapsedTime;
    const sway = Math.min(0.14, windSpeed / 45);

    g.children.forEach((child) => {
      if (!child.userData.isPlant) return;
      const p = plants[child.userData.plantIdx];
      if (!p) return;

      const freq = p.type === "sugarcane" || p.type === "banana" ? 1.2 : 1.8;
      const amp = p.type === "sugarcane" || p.type === "jute" ? sway * 1.25 : sway;
      const lean = Math.sin(t * freq + p.phase) * amp + amp * 0.25;
      const lean2 = Math.cos(t * freq * 0.8 + p.phase) * amp * 0.4;
      child.rotation.z = lean;
      child.rotation.x = lean2;
    });
  });

  const dry = temperature > 38 || vitality < 30;
  const heightScale = 0.6 + Math.max(0, Math.min(1, vitality / 100)) * 0.5;

  return (
    <group ref={groupRef}>
      {/* --------------------------------------------------------------- */}
      {/* Natural agricultural soil bed — seamless, NO bricks or sand line */}
      {/* --------------------------------------------------------------- */}

      {/* Main fertile soil disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.32, 0]} receiveShadow>
        <circleGeometry args={[2.7, 48]} />
        <meshStandardMaterial
          color={dry ? "#6a573e" : visualKind === "mustard" ? "#4a3b2a" : "#433524"}
          roughness={0.96}
        />
      </mesh>

      {/* Agricultural tilled furrow rings (grooves in soil) */}
      {[1.1, 1.6, 2.1, 2.5].map((rad, ri) => (
        <mesh key={`furrow_${ri}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.316, 0]}>
          <ringGeometry args={[rad, rad + 0.05, 36]} />
          <meshStandardMaterial
            color={dry ? "#55432e" : "#322618"}
            roughness={1}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}

      {/* Paddy water shimmer for rice fields */}
      {(visualKind === "rice" || (isMixed && !dry)) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.308, 0]}>
          <circleGeometry args={[2.55, 40]} />
          <meshStandardMaterial
            color="#46643c"
            roughness={0.35}
            metalness={0.2}
            transparent
            opacity={dry ? 0.08 : 0.22}
          />
        </mesh>
      )}

      {/* Scattered fallen mustard petals accent if mustard is active */}
      {visualKind === "mustard" && (
        <group position={[0, -2.31, 0]}>
          {Array.from({ length: 24 }).map((_, pi) => {
            const pa = (pi * 15 * Math.PI) / 180;
            const pd = 0.8 + ((pi * 7) % 1.7);
            return (
              <mesh
                key={pi}
                position={[Math.cos(pa) * pd, 0, Math.sin(pa) * pd]}
                rotation={[-Math.PI / 2, 0, pi]}
              >
                <circleGeometry args={[0.012, 5]} />
                <meshStandardMaterial color="#ffd518" roughness={0.4} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Seamless outer earthen grass terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.34, 0]}>
        <planeGeometry args={[45, 45]} />
        <meshStandardMaterial color="#2a3820" roughness={0.95} />
      </mesh>

      {/* --------------------------------------------------------------- */}
      {/* 3D Crop Plants — rendered per active crop or polyculture mix   */}
      {/* --------------------------------------------------------------- */}
      {plants.map((p, i) => {
        const scaledH = p.h * heightScale;
        return (
          <group
            key={i}
            position={[p.x, -2.31 + scaledH / 2, p.z]}
            userData={{ isPlant: true, plantIdx: i }}
          >
            {p.type === "rice" && (
              <RicePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "wheat" && (
              <WheatPlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "maize" && (
              <MaizePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "mustard" && (
              <MustardPlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "jute" && (
              <JutePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "sugarcane" && (
              <SugarcanePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "potato" && (
              <PotatoPlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "tomato" && (
              <TomatoPlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "chili" && (
              <ChiliPlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "banana" && (
              <BananaPlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "legume" && (
              <LegumePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "vine" && (
              <VinePlant height={scaledH} color={color} phase={p.phase} />
            )}
            {p.type === "grass" && (
              <GrassTuft color={color} />
            )}
          </group>
        );
      })}
    </group>
  );
}
