import React, { useState } from "react";
import { CropProfile, CROP_PHOTOS } from "../twin/cropCatalog";
import CropImage from "./CropImage";

/* ------------------------------------------------------------------ *
 *  Real crop photograph with automatic fallback to the bundled SVG
 *  illustration (offline, 404, or blocked). `vitality` dims a poor fit.
 * ------------------------------------------------------------------ */

interface CropPhotoProps {
  crop: CropProfile;
  className?: string;
  vitality?: number;
  rounded?: boolean;
}

export default function CropPhoto({
  crop,
  className = "",
  vitality = 100,
  rounded = true,
}: CropPhotoProps) {
  const [failed, setFailed] = useState(false);
  const src = CROP_PHOTOS[crop.id];
  const dim = Math.max(0.4, Math.min(1, vitality / 100));

  if (!src || failed) {
    return <CropImage crop={crop} className={className} vitality={vitality} rounded={rounded} />;
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? "rounded-lg" : ""} ${className}`}>
      <img
        src={src}
        alt={`${crop.name} — ${crop.bnName}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
        style={{
          filter: `saturate(${0.7 + dim * 0.4}) brightness(${0.86 + dim * 0.2})`,
        }}
      />
      {vitality < 55 && <div className="absolute inset-0 bg-[#0d1a13]/35" />}
    </div>
  );
}
