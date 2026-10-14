import type { ReactNode } from "react";

/**
 * The SVARA process icons: one family on a 24-unit grid with the same 1.25
 * hairline stroke as the interface icons. Each draws one real gesture of the
 * process. Decorative by default — the adjacent label names the step; pass
 * `title` when an icon stands alone.
 */

interface ProcessIconProps {
  className?: string;
  size?: number;
  title?: string;
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icon({
  className = "",
  size = 24,
  title,
  children,
}: ProcessIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={className}
    >
      <g {...STROKE}>{children}</g>
    </svg>
  );
}

/** Grow — a seedling with two leaves above the soil line. */
export function SproutIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h16M12 20v-9" />
      <path d="M12 13.5C8.5 13.5 6 11 6 7.5c3.5 0 6 2.5 6 6Z" />
      <path d="M12 11c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z" />
    </Icon>
  );
}

/** Harvest — an open hand receiving a leaf. */
export function HandLeafIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="M10.5 10C10.5 6.5 13 4 16.5 4c0 3.5-2.5 6-6 6Z" />
      <path d="m10.5 10 3.5-3.5" />
      <path d="M3 15h3l3.5 1.5h3.5a1.4 1.4 0 0 1 0 2.8H10" />
      <path d="m13 18.2 5.6-2.6a1.4 1.4 0 0 1 1.5 2.3L15 21H6.5L3 19.6" />
    </Icon>
  );
}

/** Select / gather — a woven basket of leaves. */
export function BasketLeavesIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 11.5h17l-1.8 7.7a1 1 0 0 1-1 .8H6.3a1 1 0 0 1-1-.8Z" />
      <path d="m8.2 12 .8 8M12 12v8M15.8 12l-.8 8" />
      <path d="M8 11.5c0-2.6 1.6-4.4 4-4.4 0 2.6-1.6 4.4-4 4.4ZM12 11.5c0-2.2 1.5-4 3.8-4 0 2.2-1.5 4-3.8 4Z" />
    </Icon>
  );
}

/** Shade dry — a tray of leaves under a roof, with air moving through. */
export function ShadeTrayIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="m3 8 9-4 9 4" />
      <path d="M4 17h16M5.5 17l1 2.5h11l1-2.5" />
      <path d="M8 17c0-1.3 1-2.2 2.2-2.2M13 17c0-1.3 1-2.2 2.2-2.2" />
      <path d="M5 11h6.5a1.5 1.5 0 1 0-1.5-1.5M13 13h5.5a1.5 1.5 0 1 1-1.5 1.5" />
    </Icon>
  );
}

/** Air — three currents moving past a leaf. */
export function AirflowIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8h9.5a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 12.5h14a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 17h6" />
      <path d="M14 21c0-2.2 1.6-3.8 3.8-3.8 0 2.2-1.6 3.8-3.8 3.8Z" />
    </Icon>
  );
}

/** Mill — a stone mill and the powder it lets fall. */
export function MillIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7c0-1.4 3.1-2.5 7-2.5s7 1.1 7 2.5-3.1 2.5-7 2.5S5 8.4 5 7Z" />
      <path d="M5 7v3c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7" />
      <path d="M12 14.5v1.2" />
      <path d="M6.5 20.5c1.2-2.4 3.2-3.6 5.5-3.6s4.3 1.2 5.5 3.6Z" />
    </Icon>
  );
}

/** Pack — a stand-up pouch carrying a leaf. */
export function PouchIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3.5h10l1 3V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V6.5Z" />
      <path d="M6.3 6.5h11.4" />
      <path d="M10 16c0-2.2 1.6-3.8 3.8-3.8 0 2.2-1.6 3.8-3.8 3.8Z" />
    </Icon>
  );
}

/** The journey — a winding route between two points. */
export function RouteIcon(props: ProcessIconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="6" r="2" />
      <path d="M7 18h5.5a3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6H17" />
    </Icon>
  );
}

/** The six journey stages, by stage id. */
export const STAGE_ICONS = {
  grow: SproutIcon,
  harvest: HandLeafIcon,
  select: BasketLeavesIcon,
  "shade-dry": ShadeTrayIcon,
  mill: MillIcon,
  pack: PouchIcon,
} as const;

export type StageIconId = keyof typeof STAGE_ICONS;
