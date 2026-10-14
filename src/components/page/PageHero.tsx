import Image from "next/image";
import type { ReactNode } from "react";

import { LeafletMark } from "@/components/botanical/LeafletMark";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { photos, type PhotoKey } from "@/content/photos";

interface PageHeroProps {
  label: string;
  /** One entry per typeset line. */
  title: readonly ReactNode[];
  lead?: string;
  photo: PhotoKey;
  /** Short tags pinned to the photograph's corner. */
  annotations?: readonly string[];
}

/**
 * Photographic page opening: a large window onto the farm in a leaf-plate
 * frame on sun-lit ivory, with the title set on a soft card that overlaps its
 * lower edge. The window opens on load; the photograph drifts on scroll.
 */
export function PageHero({ label, title, lead, photo, annotations = [] }: PageHeroProps) {
  const image = photos[photo];
  return (
    <header className="relative isolate pt-[calc(var(--header-height)+1.5rem)] bg-sun">
      <div className="container-page">
        <div
          className="hero-window relative h-[62svh] min-h-[22rem] overflow-hidden leaf-plate lg:h-[74svh]"
          data-parallax="0.08"
        >
          <div className="absolute inset-x-0 -inset-y-[10%]" data-parallax-target="">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload
              placeholder="blur"
              sizes="(min-width: 1440px) 1360px, 100vw"
              className="object-cover"
            />
          </div>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgb(15_42_27/0.3)_100%)]"
          />
          {annotations.length > 0 && (
            <div className="absolute top-5 right-5 flex flex-wrap justify-end gap-2">
              {annotations.map((note) => (
                <span key={note} className="seed bg-ivory/90 text-ink">
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 -mt-24 max-w-2xl leaf-plate p-7 card-float sm:-mt-32 sm:ml-8 sm:p-10 lg:ml-12 lg:p-12">
          <p className="inline-flex items-center gap-2.5 type-label text-earth-ink">
            <span aria-hidden="true" className="text-botanical">
              <LeafletMark variant="filled" size={12} rotate={-30} />
            </span>
            {label}
          </p>
          <RevealHeading
            as="h1"
            trigger="load"
            className="mt-5 type-h1 text-forest"
            lines={title}
          />
          {lead && <p className="mt-6 type-lead text-ink-soft">{lead}</p>}
        </div>
      </div>
    </header>
  );
}
