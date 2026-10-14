"use client";

import Image from "next/image";
import { useRef } from "react";

import { cutouts } from "@/content/cutouts";
import { useNearViewport } from "@/lib/media/useNearViewport";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

/**
 * Field annotations, anchored to real anatomy on the leaf image (percent of
 * the leaf box), with the label set out in clear space.
 */
const ANNOTATIONS = [
  {
    label: "Terminal leaflet",
    anchor: { x: 95, y: 18 },
    labelAt: { x: 82, y: -14 },
    align: "end",
    wideOnly: false,
  },
  {
    label: "Paired leaflets",
    anchor: { x: 45, y: 77 },
    labelAt: { x: 94, y: 101 },
    align: "end",
    /** Hidden on phones, where it would meet the stem label. */
    wideOnly: true,
  },
  {
    label: "Rachis — the leaf’s stem",
    anchor: { x: 18, y: 92 },
    labelAt: { x: 2, y: 103 },
    align: "start",
    wideOnly: false,
  },
] as const;

interface FloatingLeafProps {
  className?: string;
}

/**
 * The floating moringa leaf — a layered 2.5D treatment of a real photographic
 * cutout (not a 3D model): a cast shadow made from the leaf's own silhouette,
 * the leaf in gentle perspective, and an out-of-focus leaf in the foreground.
 *
 * Choreography follows the real scroll position (`--progress`, 0–1, from the
 * shared scroll loop): it opens through an organic mask from the stem, settles,
 * turns a few degrees, lifts (its shadow lengthening and softening) and drifts
 * out as the chapter ends. There is no idle animation and no cursor-following.
 * Reduced motion shows the settled composition, still.
 */
export function FloatingLeaf({ className = "" }: FloatingLeafProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  useScrollProgress(stageRef, { mode: "through" });
  // Fetch ahead of the reveal mask (see useNearViewport).
  const loading = useNearViewport(stageRef) ? "eager" : "lazy";
  const leaf = cutouts.moringaLeafBranch;
  const foreground = cutouts.leafSingle;

  return (
    <div ref={stageRef} className={`floating-leaf relative ${className}`}>
      <div className="floating-leaf__stage relative aspect-[6/5]" data-reveal="leaf-open">
        {/* The leaf, its shadow and its annotations move as one specimen. */}
        <div className="floating-leaf__specimen absolute inset-x-[5%] top-[21%]">
          <div
            className="relative"
            style={{ aspectRatio: `${leaf.src.width} / ${leaf.src.height}` }}
          >
            <Image
              src={leaf.src}
              loading={loading}
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 58vw, 90vw"
              className="floating-leaf__shadow object-contain"
            />
            <Image
              src={leaf.src}
              loading={loading}
              alt={leaf.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 58vw, 90vw"
              className="floating-leaf__leaf object-contain"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            >
              {ANNOTATIONS.map((note, index) => (
                <g
                  key={note.label}
                  className={note.wideOnly ? "max-sm:hidden" : undefined}
                  style={{ ["--draw-delay" as string]: 0.9 + index * 0.25 }}
                >
                  <path
                    d={`M${note.anchor.x} ${note.anchor.y} Q ${(note.anchor.x + note.labelAt.x) / 2 + 3} ${
                      (note.anchor.y + note.labelAt.y) / 2
                    } ${note.labelAt.x} ${note.labelAt.y}`}
                    pathLength={1}
                    data-draw="reveal"
                    fill="none"
                    stroke="var(--color-earth)"
                    strokeOpacity={0.55}
                    strokeWidth={0.22}
                  />
                  <circle
                    cx={note.anchor.x}
                    cy={note.anchor.y}
                    r={0.7}
                    fill="var(--color-harvest)"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}
            </svg>
            {ANNOTATIONS.map((note) => (
              <span
                key={note.label}
                aria-hidden="true"
                className={`floating-leaf__label absolute seed bg-ivory/90 text-earth-ink ${
                  note.align === "end" ? "-translate-x-full" : ""
                } ${note.wideOnly ? "max-sm:hidden" : ""} -translate-y-1/2`}
                style={{ left: `${note.labelAt.x}%`, top: `${note.labelAt.y}%` }}
              >
                {note.label}
              </span>
            ))}
          </div>
        </div>

        {/* A second leaf, out of focus and nearer the viewer: depth, not detail. */}
        <div className="floating-leaf__foreground pointer-events-none absolute -right-[2%] bottom-[-2%] w-[32%]">
          <div
            className="relative"
            style={{ aspectRatio: `${foreground.src.width} / ${foreground.src.height}` }}
          >
            <Image
              src={foreground.src}
              loading={loading}
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 16vw, 34vw"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
