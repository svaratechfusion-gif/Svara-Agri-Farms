"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { emitMascotEvent } from "@/lib/mascot/events";
import { prefersReducedMotion } from "@/lib/motion/scrollProgress";
import type { JourneyStage as Stage } from "@/content/journey";
import { photos } from "@/content/photos";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

import { JourneyVein, VerticalVein } from "@/components/botanical/JourneyVein";
import {
  nodeFractions,
  stagePosition,
  traceAtPosition,
} from "@/components/botanical/journeyVeinGeometry";

import { CutoutImage } from "@/components/botanical/CutoutImage";

import { JourneyStage } from "./JourneyStage";
import { ProgressIndicator } from "./ProgressIndicator";

/** The reading line (share of viewport height) a stage's centre crosses to become active. */
const READING_LINE = 0.525;
const PROGRESS_ANCHOR = 0.55;

type FrameState = "past" | "active" | "future";

function frameState(index: number, activeIndex: number): FrameState {
  if (index === activeIndex) return "active";
  return index < activeIndex ? "past" : "future";
}

const STAGE_IMAGE_CLASS = "journey-frame__image object-cover";

/** The closing frame: the cream pouch rising before a low sun on forest. */
function PackFrame() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_70%,rgb(197_161_90/0.55),rgb(23_60_39/0.2)_55%,var(--color-forest-deep)_85%)]">
      <div className="journey-frame__pouch absolute inset-x-0 bottom-[16%] mx-auto h-[66%]">
        <span
          aria-hidden="true"
          className="absolute inset-x-[16%] bottom-0 h-[6%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(5_14_8/0.6),transparent)]"
        />
        <CutoutImage
          cutout="svaraPouch"
          sizes="30vw"
          className="mx-auto h-full"
          imageClassName="drop-shadow-[0_24px_28px_rgb(5_14_8/0.45)]"
        />
      </div>
    </div>
  );
}

/** The pinned photograph for one stage — single, or a dried-leaf/powder pair. */
function StageFrame({ stage }: { stage: Stage }) {
  if (stage.id === "pack") return <PackFrame />;
  const photo = photos[stage.photo];
  if (!stage.detailPhoto) {
    return (
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        placeholder="blur"
        sizes="58vw"
        className={STAGE_IMAGE_CLASS}
      />
    );
  }
  const detail = photos[stage.detailPhoto];
  return (
    <div className="absolute inset-0 grid grid-cols-[2fr_3fr] gap-px bg-ivory/30">
      {[detail, photo].map((entry, index) => (
        <div key={index} className="relative overflow-hidden">
          <Image
            src={entry.src}
            alt={entry.alt}
            fill
            placeholder="blur"
            sizes={index === 0 ? "24vw" : "36vw"}
            className={STAGE_IMAGE_CLASS}
          />
        </div>
      ))}
    </div>
  );
}

interface JourneyExperienceProps {
  stages: readonly Stage[];
}

/**
 * Follow the Leaf. Desktop: the frame stays pinned (CSS sticky) while the
 * stages scroll past, and each stage cuts in with its own camera move and
 * mask (see `.journey-frame` in motion.css) — a letterbox opening for Grow, an
 * organic rise for Harvest, an iris into the close-up for Select, a pan into
 * the shelter for Shade Dry, a falling reveal for Mill and the pouch rising
 * before a low sun for Pack. Every cut runs in reverse when scrolling back.
 * Mobile: a vertical sequence of image, number, title and description.
 * Scroll is never hijacked — the page always moves at the reader's pace.
 */
export function JourneyExperience({ stages }: JourneyExperienceProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const fractions = useMemo(() => nodeFractions(stages.length), [stages.length]);

  /**
   * One measurement drives everything: the stages' real centres against the
   * reading line give a fractional position, which sets both the active stage
   * and exactly how far the vein is drawn — so they can never disagree.
   */
  const handleProgress = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const line = window.innerHeight * READING_LINE;
    const centres = Array.from(
      list.querySelectorAll<HTMLElement>("[data-journey-stage]"),
      (element) => {
        const rect = element.getBoundingClientRect();
        return rect.top + rect.height / 2;
      },
    );
    const position = stagePosition(centres, line);
    barRef.current?.style.setProperty("--trace", traceAtPosition(position, fractions).toFixed(4));
    const next = Math.round(position);
    setActiveIndex((current) => (current === next ? current : next));
  }, [fractions]);

  // The progress bar carries information, so it tracks even with reduced motion.
  useScrollProgress(listRef, {
    mode: "anchor",
    anchor: PROGRESS_ANCHOR,
    onProgress: handleProgress,
    essential: true,
  });

  // Tell SVARA (once per page view) that the visitor has reached the journey.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        emitMascotEvent({ type: "journey-in-view" });
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      const target = document.getElementById(`stage-${stages[index].id}`);
      if (!target) return;
      // Bring the stage's centre to the reading line, where it becomes active.
      const rect = target.getBoundingClientRect();
      const top = rect.top + window.scrollY + rect.height / 2 - window.innerHeight * READING_LINE;
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    },
    [stages],
  );

  return (
    <div className="grid-editorial">
      {/* Reduced motion on wide screens: the completed vein, static, still navigable. */}
      <div className="col-span-4 hidden md:col-span-8 lg:col-span-12 motion-reduce:lg:block">
        <JourneyVein
          stages={stages}
          activeIndex={stages.length}
          onSelect={handleSelect}
          label="Stages of the journey"
          tone="ivory"
        />
      </div>

      {/* The vertical pathway: one vein down the stages, drawn by scroll. */}
      <div
        ref={listRef}
        className="relative col-span-4 md:col-span-6 md:col-start-2 lg:col-span-5 lg:col-start-1 motion-reduce:lg:col-span-12"
      >
        <VerticalVein className="motion-reduce:lg:hidden" />
        <ol className="motion-safe:lg:py-[10vh] motion-reduce:lg:grid motion-reduce:lg:grid-cols-3 motion-reduce:lg:gap-x-8">
          {stages.map((stage, index) => (
            <JourneyStage
              key={stage.id}
              stage={stage}
              isActive={index === activeIndex}
              total={stages.length}
            />
          ))}
        </ol>
      </div>

      <div className="hidden lg:col-span-7 lg:col-start-6 motion-safe:lg:block">
        <div className="sticky top-[calc(var(--header-height)+1.5rem)] flex h-[calc(100vh-var(--header-height)-3rem)] flex-col">
          <div
            className="media-frame relative flex-1 leaf-plate bg-forest-deep"
            data-surface="dark"
          >
            {stages.map((stage, index) => {
              const state = frameState(index, activeIndex);
              return (
                <div
                  key={stage.id}
                  aria-hidden={state !== "active"}
                  data-stage={stage.id}
                  data-state={state}
                  className="journey-frame absolute inset-0 overflow-hidden"
                  style={{ zIndex: state === "active" ? 20 : index + 1 }}
                >
                  <StageFrame stage={stage} />
                </div>
              );
            })}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-3/5 bg-[linear-gradient(180deg,transparent,rgb(15_42_27/0.55)_45%,rgb(15_42_27/0.85))]"
            />
            <p className="absolute top-6 right-6 z-40 seed bg-ivory/92 text-ink">
              Fig. 04.{stages[activeIndex].number}
            </p>
            <div className="absolute inset-x-0 bottom-0 z-40 p-6 xl:p-8">
              <ProgressIndicator
                stages={stages}
                activeIndex={activeIndex}
                onSelect={handleSelect}
                barRef={barRef}
              />
            </div>
          </div>
          <p className="mt-3 type-caption text-ink-soft" aria-hidden="true">
            Fig. 04.{stages[activeIndex].number} — {stages[activeIndex].caption}
          </p>
        </div>
      </div>
    </div>
  );
}
