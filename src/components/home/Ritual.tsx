import Image from "next/image";
import type { ReactNode } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { RitualStage } from "@/components/botanical/RitualStage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { LeafButton } from "@/components/ui/LeafButton";
import { photos } from "@/content/photos";
import { products } from "@/content/products";

const [moringa] = products;

interface RitualStep {
  number: string;
  title: string;
  body: string;
  media: ReactNode;
}

/** The ways to use the powder, from the product's own data, plus storage. */
const STEPS: readonly RitualStep[] = [
  {
    number: "01",
    title: "A small spoonful",
    body: moringa.howToUse[0],
    media: <Image src={photos.powderMacro.src} alt="" fill sizes="72px" className="object-cover" />,
  },
  {
    number: "02",
    title: "Into a smoothie",
    body: moringa.howToUse[1],
    media: <CutoutImage cutout="powderMound" decorative sizes="72px" className="w-[96%]" />,
  },
  {
    number: "03",
    title: "In the day’s cooking",
    body: moringa.howToUse[2],
    media: (
      <Image src={photos.leafDriedScatter.src} alt="" fill sizes="72px" className="object-cover" />
    ),
  },
  {
    number: "04",
    title: "Reseal and store",
    body: "Keep it somewhere cool, dry and out of direct light.",
    media: <CutoutImage cutout="svaraPouch" decorative sizes="72px" className="h-[86%]" />,
  },
];

/** A floating note: thumbnail, step number, a title and one line. */
function StepCard({ step }: { step: RitualStep }) {
  return (
    <li className="flex items-center gap-4 leaf-plate-sm p-4 pr-6 card-float">
      <div className="relative grid aspect-square w-[4.5rem] shrink-0 place-items-center overflow-hidden leaflet bg-ivory-deep">
        {step.media}
      </div>
      <div className="min-w-0">
        <p className="type-label text-earth-ink">Step {step.number}</p>
        <p className="mt-1.5 type-h4 text-forest">{step.title}</p>
        <p className="mt-1 type-small text-ink-soft">{step.body}</p>
      </div>
    </li>
  );
}

const NOTES_CLASS = "ritual-notes grid gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:gap-28 xl:gap-36";

/**
 * 02 — The Ritual. The product-led spread: the cream SVARA pouch at the
 * centre before a low gold sun, the four ways into the day as floating notes
 * either side, arriving in turn. No figures, prices or claims.
 */
export function Ritual({ index = "02" }: { index?: string }) {
  return (
    <section
      aria-labelledby="ritual-heading"
      className="relative overflow-hidden section-space bg-sun"
    >
      <div className="container-page">
        <SectionHeader index={index} label="How to use" align="center" />
        <RevealHeading
          id="ritual-heading"
          className="mx-auto mt-5 max-w-4xl text-center type-h1 text-forest"
          lines={[
            "From leaf to",
            <em key="1" className="text-botanical italic">
              everyday ritual.
            </em>,
          ]}
        />

        <div className="mt-10 grid items-center gap-y-10 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)_minmax(0,1fr)] lg:gap-x-8">
          <RitualStage className="mx-auto w-full max-w-[26rem] lg:order-2 lg:max-w-none" />
          <ol
            className={`${NOTES_CLASS} ritual-notes--left lg:order-1`}
            data-reveal="stagger"
            aria-label="Steps one and two"
          >
            <StepCard step={STEPS[0]} />
            <StepCard step={STEPS[1]} />
          </ol>
          <ol
            start={3}
            className={`${NOTES_CLASS} ritual-notes--right lg:order-3`}
            data-reveal="stagger"
            aria-label="Steps three and four"
          >
            <StepCard step={STEPS[2]} />
            <StepCard step={STEPS[3]} />
          </ol>
        </div>

        <div className="mt-14 flex flex-col items-center gap-6" data-reveal="fade">
          <p className="text-center type-small text-ink-soft">
            <span className="font-serif text-base text-forest">SVARA Moringa Leaf Powder</span>
            <span aria-hidden="true" className="mx-3 text-harvest">
              ·
            </span>
            Moringa oleifera, the leaf
            <span aria-hidden="true" className="mx-3 text-harvest">
              ·
            </span>
            {moringa.variants.map((variant) => variant.label).join(" · ")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LeafButton href="/products/moringa-powder" icon="arrow" size="lg">
              Discover Moringa Powder
            </LeafButton>
            <LeafButton href="/shop" variant="outline">
              Visit the shop
            </LeafButton>
          </div>
        </div>
      </div>
    </section>
  );
}
