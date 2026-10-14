"use client";

import Image from "next/image";
import { useId, useState, type CSSProperties } from "react";

import { photos, type PhotoKey } from "@/content/photos";

import { LeafletMark } from "@/components/botanical/LeafletMark";

import { ImageTag } from "./ImageTag";

interface CompareSide {
  photo: PhotoKey;
  label: string;
}

interface CompareSliderProps {
  before: CompareSide;
  after: CompareSide;
  /** Accessible name of the range control. */
  label: string;
  hint?: string;
  sizes: string;
  className?: string;
  /** `light` sets the caption for a forest ground. */
  tone?: "dark" | "light";
}

const START_POSITION = 50;

/**
 * Before/after comparison (Stitch "The Shade"): drag, click or use the arrow
 * keys to move the divide. The control is a native range input stretched over
 * the photographs, so it is keyboard- and screen-reader-operable for free;
 * `touch-action: pan-y` keeps vertical page scrolling on touch screens.
 */
export function CompareSlider({
  before,
  after,
  label,
  hint = "Drag to compare",
  sizes,
  className = "",
  tone = "dark",
}: CompareSliderProps) {
  const light = tone === "light";
  const labelTone = light ? "text-harvest" : "text-earth-ink";
  const id = useId();
  const [position, setPosition] = useState(START_POSITION);
  const beforePhoto = photos[before.photo];
  const afterPhoto = photos[after.photo];

  return (
    <figure className={className} style={{ "--split": `${position}%` } as CSSProperties}>
      <div className="botanical-frame leaf-plate">
        <div
          className="media-frame relative aspect-[4/5] w-full select-none has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-botanical sm:aspect-[16/10] lg:aspect-[16/8]"
          data-surface="dark"
        >
          <Image
            src={afterPhoto.src}
            alt={afterPhoto.alt}
            fill
            sizes={sizes}
            placeholder="blur"
            className="object-cover"
          />
          <div className="absolute inset-0 [clip-path:inset(0_calc(100%-var(--split))_0_0)]">
            <Image
              src={beforePhoto.src}
              alt={beforePhoto.alt}
              fill
              sizes={sizes}
              placeholder="blur"
              className="object-cover"
            />
          </div>

          {/* Tags sit on the plate's tips, clear of its curved shoulders. */}
          <ImageTag position="bottom-left" tone="forest">
            {before.label}
          </ImageTag>
          <ImageTag position="top-right">{after.label}</ImageTag>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[var(--split)] w-px -translate-x-1/2 bg-ivory/90"
          >
            {/* The handle: a short leaf blade with a midrib and two arrows. */}
            <span className="leaf-shape absolute top-1/2 left-1/2 grid h-12 w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center bg-ivory text-forest shadow-[0_10px_28px_-12px_rgb(15_42_27/0.85)]">
              <svg viewBox="0 0 36 14" width="34" height="13" aria-hidden="true">
                <path
                  d="M8 2 3 7l5 5M28 2l5 5-5 5M11 7h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 7l3-3M14 7l3 3M19 7l3-3M19 7l3 3"
                  stroke="currentColor"
                  strokeOpacity="0.5"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </span>

          <input
            id={id}
            type="range"
            min={0}
            max={100}
            step={1}
            value={position}
            aria-label={label}
            aria-valuetext={`${position}% ${before.label.toLowerCase()}`}
            onChange={(event) => setPosition(Number(event.target.value))}
            className="absolute inset-0 h-full w-full cursor-ew-resize touch-pan-y appearance-none bg-transparent opacity-0"
          />
        </div>
      </div>

      <figcaption className="mt-8">
        {/* A fine vein shows where the divide sits, from fresh (left) to dried. */}
        <div aria-hidden="true" className="relative h-4">
          <span
            className={`absolute inset-x-0 top-1/2 h-px ${light ? "bg-rule-light" : "bg-[var(--vein)]"}`}
          />
          <span
            className={`absolute top-1/2 left-0 h-px w-[var(--split)] ${light ? "bg-harvest" : "bg-forest"}`}
          />
          <span
            className={`absolute top-1/2 left-[var(--split)] -translate-x-1/2 -translate-y-1/2 ${light ? "text-harvest" : "text-forest"}`}
          >
            <LeafletMark variant="filled" size={20} rotate={-30} />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <span className={`type-label ${labelTone}`}>{before.label}</span>
          <label htmlFor={id} className={`type-label ${light ? "text-ivory/80" : "text-ink-soft"}`}>
            {hint} · <span className="tabular-nums">{position}%</span>
          </label>
          <span className={`type-label ${labelTone}`}>{after.label}</span>
        </div>
      </figcaption>
    </figure>
  );
}
