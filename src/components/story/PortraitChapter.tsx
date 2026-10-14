import Image from "next/image";
import type { ReactNode } from "react";

import { SectionHeader } from "@/components/editorial/SectionHeader";
import { photos, type PhotoKey } from "@/content/photos";

interface PortraitChapterProps {
  label: string;
  headingId: string;
  title: ReactNode;
  body: readonly string[];
  photo: PhotoKey;
  /** A second, smaller photograph inset over the edge of the portrait. */
  inset?: PhotoKey;
}

/**
 * A documentary chapter: one portrait running the full width, drifting slowly
 * with the scroll, a smaller inset photograph breaking its edge at a faster
 * rate, and the words on a card that overlaps the portrait's foot.
 */
export function PortraitChapter({
  label,
  headingId,
  title,
  body,
  photo,
  inset,
}: PortraitChapterProps) {
  const portrait = photos[photo];
  const second = inset ? photos[inset] : null;
  return (
    <section aria-labelledby={headingId} className="bg-ivory-deep pb-[var(--section-space)]">
      <div
        className="relative h-[86svh] min-h-[30rem] overflow-hidden bg-forest-deep"
        data-parallax="0.12"
        data-reveal="image"
      >
        <div className="absolute inset-x-0 -inset-y-[12%]" data-parallax-target="">
          <Image
            src={portrait.src}
            alt={portrait.alt}
            fill
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
        </div>
      </div>
      <div className="relative container-page">
        <div className="relative z-10 -mt-32 grid gap-10 lg:-mt-48 lg:grid-cols-12">
          <div className="leaf-plate p-7 card-float sm:p-10 lg:col-span-6 lg:p-14">
            <SectionHeader label={label} />
            <h2 id={headingId} className="mt-5 type-h1 text-forest">
              {title}
            </h2>
            <div className="mt-6 space-y-4" data-reveal="fade">
              {body.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className={index === 0 ? "type-lead text-ink" : "type-body text-ink-soft"}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          {second && (
            <div className="lg:col-span-4 lg:col-start-9 lg:mt-56" data-parallax="0.22">
              <figure data-parallax-target="">
                <div
                  className="relative aspect-[4/5] overflow-hidden leaf-plate-reverse shadow-[0_30px_60px_-30px_rgb(15_42_27/0.5)]"
                  data-reveal="leaf"
                >
                  <Image
                    src={second.src}
                    alt={second.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
