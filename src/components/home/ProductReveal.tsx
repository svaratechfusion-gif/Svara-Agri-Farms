import Image from "next/image";

import { Branch, Branches } from "@/components/botanical/Branches";
import { VeinProgress } from "@/components/botanical/VeinProgress";
import { ProductStage } from "@/components/botanical/ProductStage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { LeafButton } from "@/components/ui/LeafButton";
import { cutouts } from "@/content/cutouts";

const ARC = ["From our farm.", "Through our process.", "To your home."] as const;

/** The four states of the leaf leading to the reveal, along one vein. */
const STATES = [
  { id: "fresh", number: "01", title: "Fresh leaf" },
  { id: "dried", number: "02", title: "Shade dried" },
  { id: "milled", number: "03", title: "Milled" },
  { id: "pouch", number: "04", title: "The pouch" },
] as const;

/**
 * 08 — Product Reveal. The official product photograph is the focal plate;
 * the ingredient sits on a leaflet beside it, joined by a single vein, so the
 * pouch always reads as the leaf it came from.
 */
export function ProductReveal({ index = "08" }: { index?: string }) {
  const powder = cutouts.powderMound;
  return (
    <section aria-labelledby="reveal-heading" className="overflow-hidden section-space">
      <div className="container-page">
        <SectionHeader index={index} label="The Product" aside="SVARA Moringa Powder." />

        <VeinProgress
          stages={STATES}
          activeIndex={STATES.length - 1}
          label="From leaf to pouch"
          className="mx-auto mt-12 max-w-3xl"
        />

        <div className="mt-16 grid-editorial gap-y-14 lg:mt-20">
          <div className="col-span-4 flex flex-col md:col-span-8 lg:col-span-5 lg:justify-between">
            <div>
              <p className="type-label text-earth-ink">Botanical monograph · Specimen {index}</p>
              <RevealHeading
                id="reveal-heading"
                className="mt-5 type-h1 text-forest lg:text-[clamp(2.5rem,1rem+3vw,4.25rem)] lg:whitespace-nowrap"
                lines={[
                  "Meet moringa.",
                  <em key="1" className="italic">
                    The SVARA way.
                  </em>,
                ]}
              />
              <Branches as="ol" className="mt-10 space-y-3" aria-label="The SVARA way">
                {ARC.map((line, index) => (
                  <Branch key={line} as="li" flip={index % 2 === 1}>
                    <span className="type-h3 text-ink-soft italic">{line}</span>
                  </Branch>
                ))}
              </Branches>
            </div>
            <div className="mt-12" data-reveal="fade">
              <p className="max-w-md type-lead">
                Moringa leaves from our farm — gathered by hand, dried in the shade and milled into
                a fine green powder. Sealed in a SVARA pouch and sent from our farm to your kitchen.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <LeafButton href="/products/moringa-powder" icon="arrow" size="lg">
                  Discover Moringa Powder
                </LeafButton>
                <LeafButton href="/shop" variant="outline">
                  Visit the shop
                </LeafButton>
              </div>
            </div>
          </div>

          <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:self-center">
            <div className="flex items-center gap-4 pb-4">
              <span className="type-label text-forest">Specimen — SVARA Moringa Powder</span>
              <span aria-hidden="true" className="h-px flex-1 bg-[var(--vein)]" />
              <span className="hidden type-label text-ink-soft sm:inline">Cream pouch</span>
            </div>
            <ProductStage />

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_1.2fr] sm:items-center">
              <p className="flex items-center gap-3 type-label text-earth-ink">
                <span aria-hidden="true" className="h-px w-10 bg-[var(--vein)]" />
                The ingredient: the moringa leaf
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="relative w-32 shrink-0"
                  style={{ aspectRatio: `${powder.src.width} / ${powder.src.height}` }}
                >
                  <Image
                    src={powder.src}
                    alt={powder.alt}
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="type-h4 text-forest">The powder, up close.</p>
                  <p className="mt-1 type-small text-ink-soft">
                    Fine, soft and still deeply green — the whole leaf, milled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
