"use client";

import Image from "next/image";
import { useRef } from "react";

import { cutouts } from "@/content/cutouts";
import { useNearViewport } from "@/lib/media/useNearViewport";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

interface ProductStageProps {
  className?: string;
}

/**
 * The cinematic product reveal — a layered composition of real image cutouts
 * (not a 3D model): a deep-forest leaf plate as the ground with a generic leaf
 * as a faint abstract silhouette in it, a moringa leaf framing from behind,
 * and the SVARA pouch (cream packaging, unaltered artwork) with a contact
 * shadow in front.
 *
 * As the stage scrolls in it opens through an organic mask, the pouch settles
 * out of a slight perspective (a few degrees — the artwork is never
 * distorted), and the layers behind move at their own rates. It then holds
 * still and readable. Until the pouch image has loaded, its blurred preview
 * holds the same shape. Reduced motion shows the settled composition.
 */
export function ProductStage({ className = "" }: ProductStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  useScrollProgress(stageRef, { mode: "through" });
  // Fetch ahead of the reveal mask (see useNearViewport).
  const loading = useNearViewport(stageRef) ? "eager" : "lazy";
  const pouch = cutouts.svaraPouch;
  const branch = cutouts.moringaLeafBranch;
  const silhouette = cutouts.leafSingle;

  return (
    <div ref={stageRef} className={`product-stage relative ${className}`}>
      <div className="relative aspect-[4/5] sm:aspect-[5/4]" data-reveal="product-open">
        {/* Ground: a deep-forest leaf plate, with an abstract leaf silhouette in it. */}
        <div className="product-stage__ground absolute inset-x-0 bottom-0 h-[52%] overflow-hidden leaf-plate bg-forest sm:h-[56%]">
          <div
            className="absolute -right-[10%] -bottom-[30%] w-[62%] rotate-[24deg]"
            style={{ aspectRatio: `${silhouette.src.width} / ${silhouette.src.height}` }}
          >
            <Image
              src={silhouette.src}
              loading={loading}
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 30vw, 60vw"
              className="product-stage__silhouette object-contain"
            />
          </div>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgb(247_243_232/0.12),transparent_62%)]"
          />
        </div>

        {/* Framing: one real moringa leaf, behind the product. */}
        <div className="product-stage__branch pointer-events-none absolute top-[12%] -left-[5%] w-[56%] sm:top-[9%] sm:w-[48%]">
          <div
            className="relative -rotate-[14deg]"
            style={{ aspectRatio: `${branch.src.width} / ${branch.src.height}` }}
          >
            <Image
              src={branch.src}
              loading={loading}
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 30vw, 58vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* The product. */}
        <div className="product-stage__pouch absolute inset-x-0 bottom-[3%] mx-auto h-[84%] sm:h-[88%]">
          <span
            aria-hidden="true"
            className="absolute inset-x-[16%] bottom-[1%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_24_16/0.55),transparent)]"
          />
          <div
            className="relative mx-auto h-full"
            style={{ aspectRatio: `${pouch.src.width} / ${pouch.src.height}` }}
          >
            <Image
              src={pouch.src}
              loading={loading}
              alt={pouch.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 34vw, 80vw"
              className="object-contain drop-shadow-[0_24px_30px_rgb(10_24_16/0.28)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
