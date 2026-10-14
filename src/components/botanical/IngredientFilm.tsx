"use client";

import { useCallback, useRef } from "react";

import { useScrollProgress } from "@/lib/motion/useScrollProgress";

import { CutoutImage } from "./CutoutImage";

const STATES = [
  { number: "01", title: "Fresh leaf", note: "Soft, bright, just gathered." },
  { number: "02", title: "Dried leaf", note: "Crisp after its time in the shade." },
  { number: "03", title: "Powder", note: "Fine, soft, still deeply green." },
] as const;

/** Scroll progress at which each state becomes the one named in the caption. */
const STEP_AT: readonly number[] = [0, 0.34, 0.68];

export function stepFor(progress: number): number {
  return STEP_AT.reduce((step, start, index) => (progress >= start ? index : step), 0);
}

/**
 * The ingredient as one continuous scene, scrubbed by scroll (desktop, motion
 * allowed): the fresh moringa leaf drifts in and closes through a leaf-shaped
 * mask as the shade-dried branch opens from inside it; the branch then softens
 * and sinks as the powder rises and settles onto its shadow. A vein with three
 * nodes draws along the floor. Everything is a pure function of `--progress`,
 * so it plays identically forwards and backwards.
 */
export function IngredientFilm() {
  const trackRef = useRef<HTMLDivElement>(null);
  const handleProgress = useCallback((progress: number) => {
    const track = trackRef.current;
    if (!track) return;
    const step = String(stepFor(progress));
    if (track.dataset.step !== step) track.dataset.step = step;
  }, []);
  useScrollProgress(trackRef, { mode: "track", onProgress: handleProgress });

  return (
    <div ref={trackRef} data-step="0" className="ingredient-film relative h-[320vh]">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)] items-center gap-12">
          <ol className="space-y-8" aria-label="Fresh leaf, dried leaf, powder">
            {STATES.map((state, index) => (
              <li key={state.number} className="ingredient-film__step" data-index={index}>
                <p className="type-label text-earth-ink">{state.number}</p>
                <p className="mt-2 type-h2 text-forest">{state.title}</p>
                <p className="mt-1 type-small text-ink-soft">{state.note}</p>
              </li>
            ))}
          </ol>

          <div className="relative aspect-[4/3] overflow-hidden leaf-plate bg-[radial-gradient(ellipse_at_50%_42%,#fdfaf2_0%,var(--color-ivory-deep)_70%,var(--color-parchment)_100%)]">
            {/* 01 — the fresh leaf. */}
            <div className="ingredient-film__leaf absolute inset-[10%] grid place-items-center">
              <CutoutImage
                cutout="moringaLeafBranch"
                sizes="48vw"
                className="w-full rotate-[-14deg]"
              />
            </div>
            {/* 02 — the shade-dried branch. */}
            <div className="ingredient-film__branch absolute inset-[8%] grid place-items-center">
              <CutoutImage
                cutout="driedBranch"
                sizes="40vw"
                className="h-full max-w-full rotate-[-22deg]"
              />
            </div>
            {/* 03 — the powder settling onto its shadow. */}
            <div className="ingredient-film__powder absolute inset-x-[14%] bottom-[14%]">
              <span
                aria-hidden="true"
                className="ingredient-film__shadow absolute inset-x-[4%] bottom-[2%] h-[18%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.34),transparent)]"
              />
              <CutoutImage cutout="powderMound" sizes="40vw" />
            </div>

            {/* The vein along the floor, one node per state. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              className="absolute inset-x-[8%] bottom-[6%] h-6 w-[84%] overflow-visible"
            >
              <path
                d="M0 6 C 20 2, 35 9, 50 5 S 80 2, 100 5"
                pathLength={1}
                className="ingredient-film__vein"
                fill="none"
                stroke="var(--color-botanical)"
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div
              aria-hidden="true"
              className="absolute inset-x-[8%] bottom-[6%] flex h-6 w-[84%] items-center justify-between"
            >
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  data-index={index}
                  className="ingredient-film__node size-2.5 rounded-full bg-harvest ring-4 ring-ivory/80"
                />
              ))}
            </div>
            <p className="absolute top-5 right-5 seed bg-ivory/90 text-ink">Illustrative study</p>
          </div>
        </div>
      </div>
    </div>
  );
}
