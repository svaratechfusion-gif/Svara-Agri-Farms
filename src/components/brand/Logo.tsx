import Image from "next/image";

import logo from "@/assets/brand/svara-farms-logo.png";

interface LogoProps {
  /** Largest rendered diameter in CSS pixels — sets the requested image size. */
  size: number;
  /**
   * Responsive diameter classes (e.g. `size-14 xl:size-20`). When given they
   * replace the fixed `size` dimensions, so one image serves every breakpoint.
   */
  sizeClassName?: string;
  className?: string;
  preload?: boolean;
  /** Set when an adjacent label or link name already says "SVARA Agri Farms". */
  decorative?: boolean;
}

/**
 * The official SVARA Agri Farms seal, rendered from the supplied artwork.
 * The circular frame only trims the white square around the round seal —
 * the mark itself is never redrawn, recoloured or distorted (1:1 always).
 */
export function Logo({
  size,
  sizeClassName,
  className = "",
  preload = false,
  decorative = false,
}: LogoProps) {
  return (
    <span
      className={`relative inline-block aspect-square shrink-0 overflow-hidden rounded-full bg-white ${
        sizeClassName ?? ""
      } ${className}`}
      style={sizeClassName ? undefined : { width: size, height: size }}
    >
      <Image
        src={logo}
        alt={decorative ? "" : "SVARA Agri Farms"}
        width={size}
        height={size}
        sizes={`${size}px`}
        preload={preload}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
