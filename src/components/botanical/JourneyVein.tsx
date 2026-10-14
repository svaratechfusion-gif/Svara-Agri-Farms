import type { Ref } from "react";

import { midribPath, VIEW_HEIGHT, VIEW_WIDTH, veinNodes } from "./journeyVeinGeometry";
import { LeafletMark } from "./LeafletMark";
import type { VeinStage } from "./VeinProgress";

interface JourneyVeinProps {
  stages: readonly VeinStage[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Receives the live scroll `--progress` (0–1) that draws the vein. */
  traceRef?: Ref<HTMLDivElement>;
  label: string;
  /** `photo` (light ink over the pinned image) or `ivory` (forest ink on the page). */
  tone?: "photo" | "ivory";
}

const MIDRIB = midribPath();

/**
 * The Living Journey Line (horizontal, over the pinned photograph): a bowed
 * midrib that draws itself with the reader's real scroll position, six
 * leaflets along it, and a fine secondary vein from each to its label.
 * Passed stages are filled, the current one is enlarged, upcoming ones are
 * drawn in outline. Each leaflet is a button that takes the reader there.
 */
export function JourneyVein({
  stages,
  activeIndex,
  onSelect,
  traceRef,
  label,
  tone = "photo",
}: JourneyVeinProps) {
  const nodes = veinNodes(stages.length);
  return (
    <div
      ref={traceRef}
      className={`journey-vein relative pt-8 pb-10 ${tone === "ivory" ? "journey-vein--ivory" : ""}`}
    >
      <div className="relative" style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}>
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <path d={MIDRIB} className="journey-vein__base" />
          <path d={MIDRIB} pathLength={1} className="journey-vein__trace" />
          {nodes.map((node, index) => (
            <path
              key={stages[index].id}
              d={node.branch}
              className={`journey-vein__branch ${index <= activeIndex ? "is-reached" : ""}`}
            />
          ))}
        </svg>

        <ol aria-label={label}>
          {nodes.map((node, index) => {
            const stage = stages[index];
            const state =
              index === activeIndex ? "current" : index < activeIndex ? "past" : "future";
            return (
              <li
                key={stage.id}
                data-state={state}
                aria-current={state === "current" ? "step" : undefined}
                className="journey-vein__stage absolute"
                style={{ left: `${node.left}%`, top: `${node.top}%` }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-label={`Stage ${stage.number}: ${stage.title}`}
                  className="journey-vein__node absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center"
                >
                  <LeafletMark
                    variant={state === "future" ? "outline" : "filled"}
                    size={state === "current" ? 26 : 17}
                    rotate={-50}
                  />
                </button>
                <span
                  aria-hidden="true"
                  className={`journey-vein__label absolute left-0 whitespace-nowrap ${
                    node.side === "below" ? "top-7" : "bottom-7"
                  }`}
                >
                  <b>{stage.number}</b> {stage.title}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

interface VerticalVeinProps {
  className?: string;
}

/**
 * The vertical pathway: one gently wavering vein down the stage list. It
 * draws with the scroll `--progress` of its list and is shown complete,
 * without motion, when reduced motion is requested.
 */
export function VerticalVein({ className = "" }: VerticalVeinProps) {
  const d = "M12 0C16 110 8 230 12 340S16 560 12 670S8 880 12 1000";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 1000"
      preserveAspectRatio="none"
      className={`vertical-vein pointer-events-none absolute top-2 bottom-2 left-0 h-[calc(100%-1rem)] w-6 overflow-visible ${className}`}
    >
      <path d={d} className="journey-vein__base" vectorEffect="non-scaling-stroke" />
      <path d={d} pathLength={1} className="journey-vein__trace" />
    </svg>
  );
}
