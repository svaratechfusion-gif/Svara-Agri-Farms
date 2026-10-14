"use client";

import { useRef } from "react";

import { useNearViewport } from "@/lib/media/useNearViewport";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

import { CutoutImage } from "./CutoutImage";

/**
 * The product-led centrepiece: the SVARA pouch (cream packaging, unaltered
 * artwork) before a low harvest-gold sun, with a contact shadow and one
 * moringa leaf behind it. The stage opens through an organic mask from its base; the
 * pouch settles upright by mid-scroll and the leaf drifts at its own rate.
 * Reduced motion shows the settled composition.
 */
export function RitualStage({ className = "" }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  useScrollProgress(stageRef, { mode: "through" });
  const loading = useNearViewport(stageRef) ? "eager" : "lazy";

  return (
    <div ref={stageRef} className={`ritual-stage relative ${className}`}>
      <div className="relative aspect-[4/5]" data-reveal="product-open">
        {/* A low sun behind the pouch: harvest gold, fading into the page. */}
        <div
          aria-hidden="true"
          className="ritual-stage__sun absolute top-[6%] left-1/2 aspect-square w-[92%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(197_161_90/0.42)_0%,rgb(197_161_90/0.16)_46%,transparent_70%)]"
        />

        {/* One moringa leaf behind the pouch, moving more slowly than it. */}
        <div className="ritual-stage__leaf pointer-events-none absolute top-[4%] -right-[6%] w-[62%]">
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            loading={loading}
            sizes="(min-width: 1024px) 28vw, 60vw"
            className="-scale-x-100 rotate-[-32deg]"
          />
        </div>

        <div className="ritual-stage__pouch absolute inset-x-0 bottom-[4%] mx-auto h-[86%]">
          <span
            aria-hidden="true"
            className="absolute inset-x-[14%] bottom-[0.5%] h-[6%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.42),transparent)]"
          />
          <CutoutImage
            cutout="svaraPouch"
            loading={loading}
            placeholder
            sizes="(min-width: 1024px) 36vw, 86vw"
            className="mx-auto h-full"
            imageClassName="drop-shadow-[0_22px_26px_rgb(24_32_25/0.22)]"
          />
        </div>
      </div>
    </div>
  );
}
