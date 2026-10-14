import type { ReactNode } from "react";

import { LeafletMark } from "./LeafletMark";

interface BranchesProps {
  children: ReactNode;
  /** Render as a list when the branches are a sequence. */
  as?: "div" | "ol" | "ul";
  tone?: "dark" | "light";
  /** Grow the stem downward and bring the branches in, in order, on reveal. */
  grow?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * A midrib with content branching from it: a fine vertical vein on the left,
 * each `Branch` joined to it by a short secondary vein ending in a leaflet.
 */
export function Branches({
  children,
  as: Element = "div",
  tone = "dark",
  grow = true,
  className = "",
  ...rest
}: BranchesProps) {
  const vein = tone === "light" ? "before:bg-ivory/30" : "before:bg-[var(--vein)]";
  return (
    <Element
      data-reveal={grow ? "stem" : undefined}
      className={`relative pl-9 before:absolute before:top-3 before:bottom-3 before:left-[0.6875rem] before:w-px sm:pl-11 ${vein} ${className}`}
      {...rest}
    >
      {children}
    </Element>
  );
}

interface BranchProps {
  children: ReactNode;
  as?: "div" | "li";
  /** Leaflets alternate direction like leaflets along a rachis. */
  flip?: boolean;
  tone?: "dark" | "light";
  className?: string;
}

/** One branch from the midrib. */
export function Branch({
  children,
  as: Element = "div",
  flip = false,
  tone = "dark",
  className = "",
}: BranchProps) {
  const leaf = tone === "light" ? "text-harvest" : "text-botanical";
  const vein = tone === "light" ? "bg-ivory/30" : "bg-[var(--vein)]";
  return (
    <Element className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className={`absolute top-[0.8rem] -left-[1.55rem] h-px w-4 sm:-left-[2.05rem] sm:w-6 ${vein}`}
      />
      <span
        aria-hidden="true"
        className={`absolute top-[0.35rem] -left-[2.25rem] sm:-left-[2.75rem] ${leaf}`}
      >
        <LeafletMark variant="filled" size={18} rotate={flip ? 40 : -40} />
      </span>
      {children}
    </Element>
  );
}
