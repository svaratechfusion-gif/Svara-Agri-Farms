"use client";

import { useRef, type CSSProperties } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

interface ManifestoSceneProps {
  headingId: string;
  label: string;
  /** The statement, one entry per line. Each line darkens in turn as it is read. */
  lines: readonly string[];
}

/**
 * A typographic scene: the statement held on ivory (wide screens, motion
 * allowed) while each line darkens from the faint vein colour to forest as the
 * reader moves down, with one moringa leaf turning slowly at the margin. Where
 * the scene is not pinned every line is simply set in forest.
 */
export function ManifestoScene({ headingId, label, lines }: ManifestoSceneProps) {
  const trackRef = useRef<HTMLElement>(null);
  useScrollProgress(trackRef, { mode: "track" });
  const count = lines.length;

  return (
    <section
      ref={trackRef}
      aria-labelledby={headingId}
      className="manifesto relative overflow-clip bg-ivory lg:motion-safe:h-[220vh]"
      style={{ "--lines": count } as CSSProperties}
    >
      <div className="section-space lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:flex lg:motion-safe:h-screen lg:motion-safe:items-center lg:motion-safe:py-0">
        <div
          aria-hidden="true"
          className="manifesto__leaf pointer-events-none absolute top-[12%] -right-[8%] w-[38%] opacity-90 max-lg:hidden"
        >
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            sizes="38vw"
            className="rotate-[150deg]"
          />
        </div>
        <div className="relative container-page">
          <p className="type-label text-earth-ink">{label}</p>
          <h2
            id={headingId}
            className="mt-8 max-w-5xl type-h1 lg:text-[clamp(3rem,1.2rem+3.2vw,4.75rem)]"
          >
            {lines.map((line, index) => (
              <span
                key={line}
                className="manifesto__line block"
                style={{ "--line-i": index } as CSSProperties}
              >
                {line}{" "}
              </span>
            ))}
          </h2>
        </div>
      </div>
    </section>
  );
}
