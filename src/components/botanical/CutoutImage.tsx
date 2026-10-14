import Image from "next/image";

import { cutouts, type CutoutKey } from "@/content/cutouts";

interface CutoutImageProps {
  cutout: CutoutKey;
  sizes: string;
  /** Hide from assistive technology even when the cutout has alt text. */
  decorative?: boolean;
  loading?: "eager" | "lazy";
  placeholder?: boolean;
  className?: string;
  imageClassName?: string;
}

/**
 * A transparent cutout at its own aspect ratio — always `object-contain`, so a
 * leaf tip, stem, pouch edge or powder grain is never cropped. The box holds
 * its shape before the image arrives, so nothing shifts on load.
 */
export function CutoutImage({
  cutout,
  sizes,
  decorative = false,
  loading,
  placeholder = false,
  className = "",
  imageClassName = "",
}: CutoutImageProps) {
  const { src, alt } = cutouts[cutout];
  return (
    <div
      className={`relative ${className}`}
      style={{ aspectRatio: `${src.width} / ${src.height}` }}
    >
      <Image
        src={src}
        alt={decorative ? "" : alt}
        aria-hidden={decorative || !alt ? true : undefined}
        fill
        loading={loading}
        placeholder={placeholder ? "blur" : undefined}
        sizes={sizes}
        className={`object-contain ${imageClassName}`}
      />
    </div>
  );
}
