"use client";

import { useCallback, useEffect, useRef } from "react";

import { useScrollProgress } from "@/lib/motion/useScrollProgress";

import { LeafletMark } from "./LeafletMark";

interface ReadingVeinProps {
  /** id of the element whose reading progress is shown. */
  targetId: string;
}

/**
 * A fine vein across the top of the window that grows as the article is
 * read, with a single leaflet at its tip. Informational, so it tracks even
 * with reduced motion (only its easing is removed).
 */
export function ReadingVein({ targetId }: ReadingVeinProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    targetRef.current = document.getElementById(targetId);
  }, [targetId]);

  const handleProgress = useCallback((progress: number) => {
    barRef.current?.style.setProperty("--read", progress.toFixed(4));
  }, []);

  useScrollProgress(targetRef, {
    mode: "anchor",
    anchor: 0.35,
    onProgress: handleProgress,
    essential: true,
  });

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-3 [--read:0]"
    >
      <span className="absolute inset-x-0 top-0 h-px bg-[var(--vein)]" />
      <span className="absolute top-0 left-0 h-px w-full origin-left scale-x-[var(--read)] bg-forest" />
      <span className="absolute -top-[0.3rem] left-[calc(var(--read)*100%)] -translate-x-full text-forest">
        <LeafletMark variant="filled" size={14} />
      </span>
    </div>
  );
}
