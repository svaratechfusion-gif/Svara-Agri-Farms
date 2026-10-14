import Image from "next/image";
import type { CSSProperties } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { LeafLink } from "@/components/ui/LeafButton";
import { STAGE_ICONS, type StageIconId } from "@/components/ui/processIcons";
import { journeyStages } from "@/content/journey";
import { photos } from "@/content/photos";

interface ProcessSequenceProps {
  headingId: string;
  label?: string;
  className?: string;
}

/**
 * How it is made — the six stages as one composed sequence: a staggered row
 * of plates (each stage's own scene; the pouch for Pack), each opening through
 * the leaf mask in turn, with its process icon, while a single vein draws
 * through all six. Links on to the full journey.
 */
export function ProcessSequence({
  headingId,
  label = "How it is made",
  className = "",
}: ProcessSequenceProps) {
  return (
    <section aria-labelledby={headingId} className={`overflow-hidden section-space ${className}`}>
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionHeader label={label} />
            <RevealHeading
              id={headingId}
              className="mt-5 type-h1 text-forest"
              lines={[
                "Six stages,",
                <em key="1" className="text-botanical italic">
                  one leaf.
                </em>,
              ]}
            />
          </div>
          <LeafLink href="/journey">Follow the whole journey</LeafLink>
        </div>

        <div className="process-sequence relative mt-14 lg:mt-20" data-reveal="stagger">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-[38%] hidden h-24 w-full lg:block"
          >
            <path
              d="M0 70 C 120 20, 220 110, 400 64 S 620 18, 800 66 S 1060 110, 1200 50"
              pathLength={1}
              data-draw="reveal"
              fill="none"
              stroke="var(--color-botanical)"
              strokeOpacity={0.45}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
              style={{ "--draw-delay": 0.3 } as CSSProperties}
            />
          </svg>
          <ol className="relative grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-5">
            {journeyStages.map((stage, index) => {
              const Icon = STAGE_ICONS[stage.id as StageIconId];
              const photo = photos[stage.photo];
              const isPack = stage.id === "pack";
              return (
                <li key={stage.id} className={index % 2 === 1 ? "lg:mt-24" : undefined}>
                  <div
                    className={`relative aspect-[3/4] overflow-hidden ${
                      index % 2 === 1 ? "leaf-plate-reverse" : "leaf-plate"
                    } ${isPack ? "bg-[radial-gradient(ellipse_at_50%_75%,rgb(232_200_120/0.65),var(--color-forest-deep)_75%)]" : "bg-forest-deep"}`}
                    data-reveal="leaf"
                    style={{ "--i": index } as CSSProperties}
                  >
                    {isPack ? (
                      <div className="absolute inset-x-[10%] top-[12%] bottom-[8%] grid place-items-center">
                        <CutoutImage
                          cutout="svaraPouch"
                          decorative
                          sizes="16vw"
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 46vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[color:var(--vein)] bg-ivory text-botanical">
                      {Icon && <Icon size={20} />}
                    </span>
                    <span className="type-label text-earth-ink">{stage.number}</span>
                  </div>
                  <h3 className="mt-3 type-h3 text-forest">{stage.title}</h3>
                  <p className="mt-1 type-small text-ink-soft">{stage.headline}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
