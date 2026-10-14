import { LEAFLET_MIDRIB, LEAFLET_OUTLINE, LEAFLET_VEINS } from "./geometry";

interface LeafletMarkProps {
  /** `filled` for complete/current, `outline` for upcoming, `veined` for detail. */
  variant?: "filled" | "outline" | "veined";
  /** Rendered width in px (height follows the 24:14 ratio). */
  size?: number;
  /** Rotation in degrees; leaflets point right by default. */
  rotate?: number;
  className?: string;
}

/** A single moringa leaflet — the smallest unit of the botanical system. */
export function LeafletMark({
  variant = "outline",
  size = 22,
  rotate = 0,
  className = "",
}: LeafletMarkProps) {
  const filled = variant === "filled";
  return (
    <svg
      viewBox="-1 -7 25 14"
      width={size}
      height={(size * 14) / 25}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 overflow-visible ${className}`}
      style={rotate ? { rotate: `${rotate}deg` } : undefined}
    >
      <path
        d={LEAFLET_OUTLINE}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.1}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <path
        d={LEAFLET_MIDRIB}
        fill="none"
        stroke={filled ? "var(--leaflet-vein, var(--color-ivory))" : "currentColor"}
        strokeOpacity={filled ? 0.55 : 0.8}
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
      {variant === "veined" && (
        <path
          d={LEAFLET_VEINS}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
          strokeWidth={0.7}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
