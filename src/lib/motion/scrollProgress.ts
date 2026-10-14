/**
 * One shared, rAF-throttled scroll loop. Each registered element receives a
 * `--progress` custom property between 0 and 1; CSS converts it into
 * compositor-friendly transforms. Reads happen before writes in every frame.
 *
 * Modes describe when progress runs from 0 to 1:
 *   through — element top meets viewport bottom → element bottom meets top
 *   exit    — element top meets viewport top → element bottom meets top
 *   track   — element top meets viewport top → element bottom meets bottom
 *             (for tall sections with a sticky child)
 *   anchor  — element top crosses the anchor line → element bottom crosses it
 */
export type ProgressMode = "through" | "exit" | "track" | "anchor";

interface Entry {
  element: HTMLElement;
  mode: ProgressMode;
  anchor: number;
  onProgress?: (progress: number) => void;
  last: number;
}

const entries = new Set<Entry>();
let frame = 0;

const PRECISION = 0.0005;

function clamp01(value: number): number {
  return value <= 0 ? 0 : value > 1 ? 1 : value;
}

export function computeProgress(
  mode: ProgressMode,
  top: number,
  height: number,
  viewport: number,
  anchor = 0.5,
): number {
  switch (mode) {
    case "through":
      return clamp01((viewport - top) / (height + viewport));
    case "exit":
      return clamp01(-top / Math.max(1, height));
    case "track":
      return clamp01(-top / Math.max(1, height - viewport));
    case "anchor":
      return clamp01((viewport * anchor - top) / Math.max(1, height));
  }
}

function update(): void {
  frame = 0;
  const viewport = window.innerHeight;
  const measured: Array<[Entry, number]> = [];
  entries.forEach((entry) => {
    const rect = entry.element.getBoundingClientRect();
    measured.push([
      entry,
      computeProgress(entry.mode, rect.top, rect.height, viewport, entry.anchor),
    ]);
  });
  for (const [entry, progress] of measured) {
    if (Math.abs(progress - entry.last) < PRECISION) continue;
    entry.last = progress;
    entry.element.style.setProperty("--progress", progress.toFixed(4));
    entry.onProgress?.(progress);
  }
}

function schedule(): void {
  if (!frame) frame = requestAnimationFrame(update);
}

interface ObserveOptions {
  mode: ProgressMode;
  anchor?: number;
  onProgress?: (progress: number) => void;
}

/** Registers an element with the scroll loop; returns an unsubscribe function. */
export function observeScrollProgress(element: HTMLElement, options: ObserveOptions): () => void {
  const entry: Entry = {
    element,
    mode: options.mode,
    anchor: options.anchor ?? 0.5,
    onProgress: options.onProgress,
    last: -1,
  };
  if (entries.size === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  entries.add(entry);
  schedule();

  return () => {
    entries.delete(entry);
    element.style.removeProperty("--progress");
    if (entries.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
