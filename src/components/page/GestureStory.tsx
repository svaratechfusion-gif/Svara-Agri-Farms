"use client";

import Image from "next/image";
import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";

import { photos, type PhotoKey } from "@/content/photos";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

export interface Gesture {
  title: string;
  body: string;
  photo: PhotoKey;
  /** Where on the photograph the next frame opens from (CSS position). */
  origin?: string;
}

interface GestureStoryProps {
  gestures: readonly Gesture[];
  /** The section heading block, set above the steps. */
  intro: ReactNode;
  tone?: "ivory" | "deep";
}

/**
 * A sequence of gestures told against one held frame (wide screens, motion
 * allowed): as each gesture's text becomes current, its photograph opens over
 * the last through a circular mask from the hands, and the frame's caption
 * changes. Every frame and caption is derived from `--active`, set from the
 * track's scroll progress, so it plays the same in both directions. On phones
 * and with reduced motion each gesture carries its own photograph, in order.
 */
export function GestureStory({ gestures, intro, tone = "ivory" }: GestureStoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const count = gestures.length;
  const handleProgress = useCallback(
    (progress: number) => {
      const track = trackRef.current;
      if (!track) return;
      const active = String(Math.min(count - 1, Math.floor(progress * count)));
      if (track.dataset.active !== active) {
        track.dataset.active = active;
        track.style.setProperty("--active", active);
      }
    },
    [count],
  );
  useScrollProgress(trackRef, { mode: "track", onProgress: handleProgress });

  return (
    <div
      ref={trackRef}
      data-active="0"
      style={{ "--active": 0, "--gestures": count + 1 } as CSSProperties}
      className={`gesture-story relative ${tone === "deep" ? "bg-ivory-deep" : "bg-ivory"} lg:motion-safe:h-[calc(100vh*var(--gestures))]`}
    >
      <div className="lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:flex lg:motion-safe:h-screen lg:motion-safe:items-center">
        <div className="container-page grid w-full gap-y-12 py-[var(--section-space)] lg:grid-cols-12 lg:gap-x-8 lg:motion-safe:py-0">
          <div className="lg:col-span-5 lg:self-center">
            {intro}
            <ol className="mt-12 space-y-10 lg:motion-safe:space-y-6">
              {gestures.map((gesture, index) => {
                const photo = photos[gesture.photo];
                return (
                  <li
                    key={gesture.title}
                    className="gesture-story__step"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="type-label text-earth-ink tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="type-h3 text-forest">{gesture.title}</h3>
                        <p className="mt-2 max-w-sm type-body text-ink-soft">{gesture.body}</p>
                      </div>
                    </div>
                    {/* Phones and reduced motion: each gesture has its own picture. */}
                    <div
                      className="relative mt-6 aspect-[4/3] overflow-hidden leaf-plate lg:motion-safe:hidden"
                      data-reveal="leaf"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            aria-hidden="true"
            className="relative hidden h-[min(78vh,48rem)] overflow-hidden leaf-plate bg-forest-deep lg:col-span-7 lg:col-start-6 motion-safe:lg:block"
          >
            {gestures.map((gesture, index) => (
              <div
                key={gesture.title}
                className="gesture-story__frame absolute inset-0"
                style={{ "--i": index, "--origin": gesture.origin ?? "50% 60%" } as CSSProperties}
              >
                <Image
                  src={photos[gesture.photo].src}
                  alt=""
                  fill
                  sizes="58vw"
                  className="gesture-story__image object-cover"
                />
              </div>
            ))}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgb(10_28_18/0.7),transparent)]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 text-ivory">
              <div className="relative h-14 flex-1">
                {gestures.map((gesture, index) => (
                  <p
                    key={gesture.title}
                    className="gesture-story__caption absolute inset-x-0 bottom-0 type-h3"
                    style={{ "--i": index } as CSSProperties}
                  >
                    {gesture.title}
                  </p>
                ))}
              </div>
              <ol className="flex gap-2">
                {gestures.map((gesture, index) => (
                  <li
                    key={gesture.title}
                    className="gesture-story__tick h-1 w-8 rounded-full bg-ivory/30"
                    style={{ "--i": index } as CSSProperties}
                  />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
