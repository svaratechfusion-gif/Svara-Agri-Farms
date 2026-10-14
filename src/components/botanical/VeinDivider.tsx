import { LeafletMark } from "./LeafletMark";

interface VeinDividerProps {
  /** Optional label set at the node, e.g. "Nature • Nurture • Nourish". */
  label?: string;
  /** Where the leaflet node sits along the vein. */
  align?: "start" | "center" | "end";
  tone?: "dark" | "light";
  /** Draw the vein outward from its node when scrolled into view. */
  reveal?: boolean;
  className?: string;
}

/** The forked node where secondary veins leave the midrib. */
function VeinFork({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 28 14"
      width="28"
      height="14"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${flip ? "-scale-x-100" : ""}`}
    >
      <path
        d="M0 7h28M9 7l7-5.5M9 7l7 5.5M17 7l5-3.5M17 7l5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A section divider drawn as a vein: a fine midrib with forked secondary veins
 * at its node and a single leaflet (or a label) at the centre of growth.
 */
export function VeinDivider({
  label,
  align = "center",
  tone = "dark",
  reveal = false,
  className = "",
}: VeinDividerProps) {
  const color = tone === "light" ? "text-ivory/45" : "text-[color:var(--vein)]";
  const ink = tone === "light" ? "text-ivory/85" : "text-earth-ink";
  const leaf = tone === "light" ? "text-harvest" : "text-botanical";
  const before = align === "start" ? "w-6 flex-none" : "flex-1";
  const after = align === "end" ? "w-6 flex-none" : "flex-1";
  return (
    <div
      role="presentation"
      data-reveal={reveal ? "vein" : undefined}
      className={`flex items-center ${color} ${className}`}
    >
      <span
        data-vein-trace=""
        className={`h-px origin-right bg-current ${before}`}
        aria-hidden="true"
      />
      <VeinFork flip />
      {label ? (
        <span className={`px-3 type-label ${ink}`}>{label}</span>
      ) : (
        <LeafletMark variant="veined" size={22} rotate={-90} className={`mx-1 ${leaf}`} />
      )}
      <VeinFork />
      <span
        data-vein-trace=""
        className={`h-px origin-left bg-current ${after}`}
        aria-hidden="true"
      />
    </div>
  );
}
