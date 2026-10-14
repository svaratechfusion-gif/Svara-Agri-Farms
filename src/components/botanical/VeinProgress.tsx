import type { CSSProperties, Ref } from "react";

import { LeafletMark } from "./LeafletMark";

export interface VeinStage {
  id: string;
  number: string;
  title: string;
}

type StageState = "past" | "current" | "future";

const SURFACE: Record<"ivory" | "deep" | "none", string> = {
  ivory: "var(--color-ivory)",
  deep: "var(--color-ivory-deep)",
  none: "transparent",
};

interface VeinProgressProps {
  stages: readonly VeinStage[];
  activeIndex: number;
  /** Makes each leaflet a button that selects its stage. */
  onSelect?: (index: number) => void;
  /** Receives a live `--progress` (0–1); otherwise the trace stops at the active stage. */
  traceRef?: Ref<HTMLSpanElement>;
  tone?: "dark" | "light";
  /** Background behind each leaflet, so the vein passes behind it cleanly. */
  surface?: keyof typeof SURFACE;
  /** Turn vertical below the md breakpoint (for long sequences on phones). */
  stackOnMobile?: boolean;
  label: string;
  className?: string;
}

function stateFor(index: number, activeIndex: number): StageState {
  if (index === activeIndex) return "current";
  return index < activeIndex ? "past" : "future";
}

/**
 * Stages as leaflets along a single central vein. Completed stages are
 * filled, the current one is larger and coloured, upcoming ones are drawn in
 * outline — so state never depends on colour alone.
 */
export function VeinProgress({
  stages,
  activeIndex,
  onSelect,
  traceRef,
  tone = "dark",
  surface = "ivory",
  stackOnMobile = false,
  label,
  className = "",
}: VeinProgressProps) {
  const lastIndex = Math.max(1, stages.length - 1);
  const style = {
    "--vp-count": stages.length,
    "--vp-static": activeIndex / lastIndex,
    "--vp-bg": SURFACE[surface],
  } as CSSProperties;

  return (
    <div
      data-tone={tone}
      style={style}
      className={`vein-progress ${stackOnMobile ? "vein-progress--stack" : ""} ${className}`}
    >
      <span aria-hidden="true" className="vein-progress__line" />
      <span aria-hidden="true" className="vein-progress__trace" ref={traceRef} />
      <ol aria-label={label} className="vein-progress__list">
        {stages.map((stage, index) => {
          const state = stateFor(index, activeIndex);
          const mark = (
            <LeafletMark
              variant={state === "future" ? "outline" : "filled"}
              size={22}
              rotate={-38}
            />
          );
          return (
            <li
              key={stage.id}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              className="vein-progress__stage"
            >
              {onSelect ? (
                <button
                  type="button"
                  className="vein-progress__node"
                  onClick={() => onSelect(index)}
                  aria-label={`Stage ${stage.number}: ${stage.title}`}
                >
                  {mark}
                </button>
              ) : (
                <span className="vein-progress__node">{mark}</span>
              )}
              <span className="vein-progress__label" aria-hidden={onSelect ? true : undefined}>
                <b>{stage.number}</b>
                {stage.title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
