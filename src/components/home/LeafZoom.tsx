"use client";

import Image from "next/image";
import { useRef } from "react";

import { photos } from "@/content/photos";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

/**
 * The leaf plate — the reference image for the whole botanical system. Its
 * annotation runs along a vein above the photograph, never over the leaf. As
 * the reader scrolls, the camera eases closer (a CSS scale driven by scroll).
 */
export function LeafZoom() {
  const frameRef = useRef<HTMLDivElement>(null);
  const image = photos.leafMacroDew;
  useScrollProgress(frameRef, { mode: "through" });

  return (
    <figure>
      <div className="flex items-center gap-4 pb-4">
        <span className="type-label text-forest">Plate 03 — Moringa oleifera</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--vein)]" />
        <span className="hidden type-label text-ink-soft sm:inline">Leaflet, at first light</span>
      </div>
      <div className="botanical-frame leaf-plate">
        <div
          ref={frameRef}
          className="leaf-zoom-frame media-frame aspect-[4/5] w-full lg:aspect-[5/6]"
        >
          <div className="leaf-zoom-media absolute inset-0 origin-[58%_42%] will-change-transform">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <figcaption className="mt-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="type-label text-earth-ink">Fresh leaflet, morning dew</span>
        <span className="type-caption text-ink-soft">
          The beginning of everything that follows.
        </span>
      </figcaption>
    </figure>
  );
}
