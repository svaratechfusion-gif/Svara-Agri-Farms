"use client";

import { useEffect, type RefObject } from "react";

import { observeScrollProgress, prefersReducedMotion, type ProgressMode } from "./scrollProgress";

interface UseScrollProgressOptions {
  mode: ProgressMode;
  anchor?: number;
  onProgress?: (progress: number) => void;
  /** Keep tracking even when reduced motion is requested (e.g. a progress bar). */
  essential?: boolean;
}

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  { mode, anchor, onProgress, essential = false }: UseScrollProgressOptions,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || (!essential && prefersReducedMotion())) return;
    return observeScrollProgress(element, { mode, anchor, onProgress });
  }, [ref, mode, anchor, onProgress, essential]);
}
