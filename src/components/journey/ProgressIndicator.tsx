"use client";

import type { Ref } from "react";

import { JourneyVein } from "@/components/botanical/JourneyVein";
import { LeafIconButton } from "@/components/ui/LeafButton";
import type { JourneyStage } from "@/content/journey";

interface ProgressIndicatorProps {
  stages: readonly JourneyStage[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Receives scroll progress (0–1) through the `--progress` custom property. */
  barRef: Ref<HTMLDivElement>;
}

/**
 * The stage controls over the pinned photograph: six leaflets along one
 * central vein. The vein is traced by scroll; the current leaflet is filled
 * and enlarged, passed stages stay filled, upcoming ones are in outline.
 */
export function ProgressIndicator({
  stages,
  activeIndex,
  onSelect,
  barRef,
}: ProgressIndicatorProps) {
  const current = stages[activeIndex];
  const total = String(stages.length).padStart(2, "0");
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === stages.length - 1;

  return (
    <nav aria-label="Journey stages" className="text-ivory">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="type-label text-ivory/70">
            Active stage · {current.number} of {total}
          </p>
          <p className="mt-1 type-h3 text-ivory" aria-live="polite">
            <span className="sr-only">Current stage: </span>
            {current.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeafIconButton
            label="Previous stage"
            icon="arrow-left"
            disabled={isFirst}
            onClick={() => onSelect(activeIndex - 1)}
          />
          <LeafIconButton
            label="Next stage"
            icon="arrow"
            disabled={isLast}
            onClick={() => onSelect(activeIndex + 1)}
          />
        </div>
      </div>
      <JourneyVein
        stages={stages}
        activeIndex={activeIndex}
        onSelect={onSelect}
        traceRef={barRef}
        label="Stages of the journey"
      />
    </nav>
  );
}
