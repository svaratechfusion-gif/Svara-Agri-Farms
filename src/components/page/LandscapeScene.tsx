"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { photos, type PhotoKey } from "@/content/photos";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

export interface LandscapeBeat {
  label: string;
  text: string;
}

interface LandscapeSceneProps {
  photo: PhotoKey;
  /** Up to three beats; they arrive in turn as the scene is scrolled. */
  beats: readonly LandscapeBeat[];
  heading: string;
  headingId: string;
}

/**
 * A full-width landscape held still while the reader scrolls (wide screens,
 * motion allowed): the land settles out of a slow push-in, two moringa leaves
 * in the foreground drift apart faster than the land behind them, and the
 * beats arrive one by one. Phones and reduced motion see the settled frame
 * with every beat in place — nothing is pinned there.
 */
export function LandscapeScene({ photo, beats, heading, headingId }: LandscapeSceneProps) {
  const trackRef = useRef<HTMLElement>(null);
  useScrollProgress(trackRef, { mode: "track" });
  const image = photos[photo];

  return (
    <section
      ref={trackRef}
      aria-labelledby={headingId}
      data-surface="dark"
      className="landscape-scene relative bg-forest-deep text-ivory lg:motion-safe:h-[240vh]"
    >
      <div className="relative isolate h-[88svh] min-h-[34rem] overflow-hidden lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:h-screen">
        <div className="landscape-scene__land absolute inset-0 -z-20">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            className="object-cover object-[50%_60%]"
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_28_18/0.55)_0%,transparent_32%,transparent_55%,rgb(10_28_18/0.82)_100%)]"
        />
        {/* Phones: the beats sit over more of the land, so the scrim reaches higher. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(10_28_18/0.88)_0%,rgb(10_28_18/0.55)_50%,transparent_78%)] lg:hidden"
        />
        <div
          aria-hidden="true"
          className="landscape-scene__near landscape-scene__near--left absolute -bottom-[8%] -left-[12%] -z-10 w-[46%] blur-[3px] lg:w-[34%]"
        >
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            sizes="34vw"
            className="rotate-[18deg]"
          />
        </div>
        <div
          aria-hidden="true"
          className="landscape-scene__near landscape-scene__near--right absolute -top-[6%] -right-[14%] -z-10 w-[40%] blur-[2px] lg:w-[30%]"
        >
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            sizes="30vw"
            className="rotate-[200deg]"
          />
        </div>

        <div className="container-page flex h-full flex-col justify-end pb-[clamp(3rem,9vh,6rem)]">
          <h2 id={headingId} className="landscape-scene__title max-w-3xl type-display text-ivory">
            {heading}
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {beats.map((beat, index) => (
              <li
                key={beat.label}
                className="landscape-scene__beat border-t border-rule-light pt-4"
                style={{ "--beat": index } as CSSProperties}
              >
                <p className="type-label text-harvest">{beat.label}</p>
                <p className="mt-2 type-h4 text-ivory">{beat.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
