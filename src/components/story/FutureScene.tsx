import { catalogueImages } from "@/content/catalogueImages";
import Image from "next/image";
import type { CSSProperties } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { LeafLink } from "@/components/ui/LeafButton";
import { range } from "@/content/range";

/**
 * The Future: Moringa in front, in full colour on a low sun; the packs still
 * in preparation stand behind it as a quiet, faded row, rising in turn as the
 * chapter enters — what comes next, clearly not yet here.
 */
export function FutureScene({ headingId }: { headingId: string }) {
  return (
    <section aria-labelledby={headingId} className="relative overflow-hidden section-space bg-sun">
      <div className="container-page grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader label="The future" />
          <RevealHeading
            id={headingId}
            className="mt-5 type-h1 text-forest"
            lines={[
              "Beginning with moringa.",
              <em key="1" className="text-botanical italic">
                Growing from here.
              </em>,
            ]}
          />
          <p className="mt-6 max-w-md type-lead text-ink-soft" data-reveal="fade">
            Moringa Powder is our first product. We intend to grow slowly and carefully, adding only
            what we can make with the same care.
          </p>
          <LeafLink href="/products" className="mt-8">
            See the full range
          </LeafLink>
        </div>

        <div className="relative h-[min(110vw,34rem)] lg:col-span-7 lg:h-[40rem]">
          <ul
            aria-label="The wider range"
            className="absolute inset-x-0 top-[6%] grid grid-cols-4 gap-2 sm:gap-4 lg:grid-cols-6"
            data-reveal="stagger"
          >
            {range.map((item, index) => (
              <li
                key={item.id}
                className={`future-scene__pack relative ${index >= 4 ? "max-sm:hidden" : ""} ${
                  index % 2 === 1 ? "mt-8" : ""
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                <div
                  className="relative opacity-45 saturate-[0.55]"
                  style={{
                    aspectRatio: `${catalogueImages[item.image].src.width} / ${catalogueImages[item.image].src.height}`,
                  }}
                >
                  <Image
                    src={catalogueImages[item.image].src}
                    alt={catalogueImages[item.image].alt}
                    fill
                    sizes="(min-width: 1024px) 14vw, 24vw"
                    className="object-contain"
                  />
                </div>
              </li>
            ))}
          </ul>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,var(--color-ivory)_35%,transparent)]"
          />
          <div className="absolute inset-x-0 bottom-[2%] mx-auto h-[72%]" data-reveal="fade">
            <span
              aria-hidden="true"
              className="absolute inset-x-[22%] bottom-[0.5%] h-[6%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.4),transparent)]"
            />
            <CutoutImage
              cutout="svaraPouch"
              sizes="(min-width: 1024px) 26vw, 60vw"
              className="mx-auto h-full"
              imageClassName="drop-shadow-[0_24px_26px_rgb(24_32_25/0.25)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
