"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HIDE_AFTER_PX = 240;
const DIRECTION_THRESHOLD_PX = 6;

interface HeaderState {
  /** Header sits over a dark full-bleed image and should use light ink. */
  overImage: boolean;
  /** Header slides away while the reader scrolls down into content. */
  hidden: boolean;
  /** Page has scrolled away from the very top. */
  scrolled: boolean;
}

/**
 * Tracks header presentation. Overlay detection uses IntersectionObserver on
 * the page's `[data-header-overlay]` element; direction uses a rAF-throttled
 * passive scroll listener.
 */
export function useHeaderState(): HeaderState {
  const pathname = usePathname();
  const [overlay, setOverlay] = useState({ path: "", intersecting: false });
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>("[data-header-overlay]");
    if (!target) return;
    const headerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
    );
    const rootMarginTop = Number.isFinite(headerHeight) ? headerHeight * 16 : 80;
    const observer = new IntersectionObserver(
      ([entry]) => setOverlay({ path: pathname, intersecting: entry.isIntersecting }),
      { rootMargin: `0px 0px -${window.innerHeight - rootMarginTop}px 0px` },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - lastY) < DIRECTION_THRESHOLD_PX) return;
      setHidden(y > lastY && y > HIDE_AFTER_PX);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Derived per route, so a stale value from the previous page never leaks.
  const overImage = overlay.path === pathname && overlay.intersecting;
  return { overImage, hidden, scrolled };
}
