"use client";

import { useEffect, useState, type RefObject } from "react";

/** How far ahead of the viewport an approaching element counts as "near". */
const DEFAULT_MARGIN = "150% 0px";

/**
 * True once the element comes within `margin` of the viewport (and stays true).
 *
 * Why it exists: images inside an organic reveal mask start fully clipped
 * (`clip-path: circle(0%)`). Native lazy loading treats a fully clipped image
 * as not visible, so it would only start downloading after the mask opened —
 * leaving an empty frame on screen. Observing the unclipped outer element and
 * switching those images to eager loading here fetches them ahead of time,
 * without loading them on the critical first paint.
 */
export function useNearViewport(
  ref: RefObject<HTMLElement | null>,
  margin: string = DEFAULT_MARGIN,
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin, near]);

  return near;
}
