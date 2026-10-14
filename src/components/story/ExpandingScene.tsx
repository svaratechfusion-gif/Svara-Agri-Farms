"use client";

import Image from "next/image";
import { useRef, type CSSProperties, type ReactNode } from "react";

import { photos, type PhotoKey } from "@/content/photos";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

interface ExpandingSceneProps {
  photo: PhotoKey;
  headingId: string;
  title: ReactNode;
  body: string;
  /** Short words that settle one by one along the foot of the scene. */
  marks: readonly string[];
}

/**
 * An image that grows from a small leaf plate into the full width as the
 * reader scrolls (wide screens, motion allowed), the camera easing back as it
 * opens; once full, the title and the marks arrive over it. Where it is not
 * pinned the scene is shown fully open with everything in place.
 */
export function ExpandingScene({ photo, headingId, title, body, marks }: ExpandingSceneProps) {
  const trackRef = useRef<HTMLElement>(null);
  useScrollProgress(trackRef, { mode: "track" });
  const image = photos[photo];

  return (
    <section
      ref={trackRef}
      aria-labelledby={headingId}
      data-surface="dark"
      className="expanding-scene relative bg-ivory lg:motion-safe:h-[260vh]"
    >
      <div className="relative h-[88svh] min-h-[32rem] overflow-hidden lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:h-screen">
        <div className="expanding-scene__frame absolute inset-0 overflow-hidden bg-forest-deep text-ivory">
          <div className="expanding-scene__image absolute inset-0">
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
          </div>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_28_18/0.82)_0%,rgb(10_28_18/0.35)_55%,transparent_80%),linear-gradient(0deg,rgb(10_28_18/0.7),transparent_45%)]"
          />
          <div className="relative container-page flex h-full flex-col justify-end pb-[clamp(2.5rem,8vh,5rem)]">
            <div className="expanding-scene__copy max-w-2xl">
              <h2 id={headingId} className="type-display text-ivory">
                {title}
              </h2>
              <p className="mt-6 max-w-lg type-lead text-ivory/85">{body}</p>
            </div>
            <ol className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-rule-light pt-5">
              {marks.map((mark, index) => (
                <li
                  key={mark}
                  className="expanding-scene__mark type-label text-harvest"
                  style={{ "--m": index, "--marks": marks.length } as CSSProperties}
                >
                  <span className="text-ivory/60">{String(index + 1).padStart(2, "0")}</span> {mark}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
