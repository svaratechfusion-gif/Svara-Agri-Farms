"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { prefersReducedMotion } from "@/lib/motion/scrollProgress";

import { LeafletMark } from "./LeafletMark";

export interface Chapter {
  /** id of the chapter's heading (the section is found from it). */
  headingId: string;
  title: string;
}

interface ChapterVeinProps {
  chapters: readonly Chapter[];
}

/** A chapter counts as current once its top passes this share of the viewport. */
const ACTIVE_LINE = 0.4;

/**
 * The story's index as a single vertical vein at the right edge (xl screens):
 * one leaflet per chapter, the passed ones filled, the current one enlarged,
 * the vein traced up to it. Every leaflet is a button that scrolls to its
 * chapter. One IntersectionObserver drives it; it hides over the opening
 * photograph so the hero stays uncluttered.
 */
export function ChapterVein({ chapters }: ChapterVeinProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.headingId)?.closest("section"))
      .filter((section): section is HTMLElement => Boolean(section));
    if (sections.length === 0) return;

    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (records) => {
        records.forEach((record) => {
          if (record.isIntersecting) visible.add(record.target);
          else visible.delete(record.target);
        });
        const indices = sections
          .map((section, index) => (visible.has(section) ? index : -1))
          .filter((index) => index >= 0);
        if (indices.length > 0) setActive(Math.max(...indices));
      },
      { rootMargin: `0px 0px -${(1 - ACTIVE_LINE) * 100}% 0px` },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [chapters]);

  const goTo = (index: number) => {
    const heading = document.getElementById(chapters[index].headingId);
    const section = heading?.closest("section");
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const last = Math.max(1, chapters.length - 1);
  return (
    <nav
      aria-label="Chapters"
      data-hidden={active === 0 ? "" : undefined}
      className="chapter-vein fixed top-1/2 right-[calc(var(--gutter-page)/2-1.25rem)] z-30 hidden -translate-y-1/2 xl:block"
      style={{ "--chapter": active / last } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="absolute top-4 bottom-4 left-1/2 w-px -translate-x-1/2 bg-[var(--vein)]"
      />
      <span
        aria-hidden="true"
        className="chapter-vein__trace absolute top-4 bottom-4 left-1/2 w-px -translate-x-1/2 bg-forest"
      />
      <ol className="relative flex flex-col gap-1">
        {chapters.map((chapter, index) => {
          const state = index === active ? "current" : index < active ? "past" : "future";
          return (
            <li key={chapter.headingId} className="relative">
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`Chapter ${String(index + 1).padStart(2, "0")}: ${chapter.title}`}
                className="chapter-vein__node group grid size-8 place-items-center"
                data-state={state}
              >
                <LeafletMark
                  variant={state === "future" ? "outline" : "filled"}
                  size={state === "current" ? 20 : 13}
                  rotate={-60}
                />
                <span
                  aria-hidden="true"
                  className="chapter-vein__label pointer-events-none absolute right-full mr-2 seed bg-ivory/95 whitespace-nowrap text-ink"
                >
                  {String(index + 1).padStart(2, "0")} · {chapter.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
