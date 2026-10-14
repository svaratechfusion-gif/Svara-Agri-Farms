"use client";

import { useEffect } from "react";

import { observeScrollProgress, prefersReducedMotion } from "@/lib/motion/scrollProgress";

const REVEAL_ROOT_MARGIN = "0px 0px -12% 0px";
const UNREVEALED = "[data-reveal]:not([data-revealed])";

/**
 * Activates declarative motion for the page it is rendered in. Mount it at
 * the end of each page so it runs after that page has hydrated.
 *
 *   data-reveal="heading | fade | image | stagger" — revealed once on entry
 *   data-parallax="0.1" — drifts its [data-parallax-target] against scroll
 *
 * Visibility rules live in CSS, so content is always readable without
 * JavaScript and with reduced motion.
 */
export function MotionRoot() {
  useEffect(() => {
    const revealTargets = document.querySelectorAll<HTMLElement>(UNREVEALED);
    const observer = new IntersectionObserver(
      (records) => {
        records.forEach((record) => {
          if (!record.isIntersecting) return;
          record.target.setAttribute("data-revealed", "");
          observer.unobserve(record.target);
        });
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );
    revealTargets.forEach((element) => observer.observe(element));

    // Content that mounts later (e.g. a filtered list) is revealed the same way.
    const mutations = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(UNREVEALED)) observer.observe(node);
          node.querySelectorAll<HTMLElement>(UNREVEALED).forEach((el) => observer.observe(el));
        }),
      );
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const cleanups = prefersReducedMotion()
      ? []
      : Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"), (element) => {
          element.style.setProperty("--parallax", element.dataset.parallax || "0.1");
          return observeScrollProgress(element, { mode: "through" });
        });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
