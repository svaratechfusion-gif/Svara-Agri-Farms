import type { Metadata } from "next";

import { EditorialImage } from "@/components/editorial/EditorialImage";
import { NoteBox } from "@/components/editorial/NoteBox";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { EditorialSplit } from "@/components/page/EditorialSplit";
import { NextChapter } from "@/components/page/NextChapter";
import { LandscapeScene } from "@/components/page/LandscapeScene";
import { PageHero } from "@/components/page/PageHero";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import { VeinRow } from "@/components/botanical/VeinRow";
import { LeafButton } from "@/components/ui/LeafButton";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "The Farm",
  description:
    "Where SVARA begins: rows of moringa trees, red earth and the slow work of tending the land.",
  path: "/farm",
  photo: "farmRowsCanopy",
});

/** The farm's cycle (Stitch 01 "conversion cycle"), described without figures. */
const FARM_CYCLE = [
  { number: "01", title: "Earth", body: "Red soil in open rows, under a wide sky." },
  { number: "02", title: "Grow", body: "Young trees, shaped by the seasons." },
  { number: "03", title: "Tend", body: "Pruned and looked after by hand." },
  { number: "04", title: "Leaf", body: "New leaves, ready to be gathered." },
] as const;

const FARM_COMPOSITION = [
  { term: "Soil", value: "Red earth" },
  { term: "Trees", value: "Moringa oleifera" },
  { term: "Horizon", value: "Hills, often in mist" },
  { term: "Pace", value: "Set by the seasons" },
] as const;

export default function FarmPage() {
  return (
    <>
      <PageHero
        label="The Farm"
        title={["Where it all begins."]}
        lead="Before there is a product, there is soil, water and season. Everything SVARA makes starts here, in the rows."
        photo="farmPlantationAerial"
        annotations={["Moringa oleifera", "Rows of red earth"]}
      />

      <section className="section-space" aria-labelledby="monograph-heading">
        <div className="container-page">
          <SectionHeader index="01" label="Monograph" aside="Chapter 01 — The farm" />
          <div className="mt-14 grid-editorial gap-y-12 lg:mt-20">
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <RevealHeading
                id="monograph-heading"
                className="type-h2 text-forest"
                lines={[
                  "The land",
                  <em key="1" className="italic">
                    sets the rhythm.
                  </em>,
                ]}
              />
              <div className="mt-8 space-y-5" data-reveal="fade">
                <p className="type-lead">
                  Our moringa grows in open rows of red soil, with the hills on the horizon and the
                  sky wide overhead.
                </p>
                <p className="type-body text-ink-soft">
                  The seasons decide when the trees flush with new leaves. Our work is to tend them
                  patiently, and to pay attention.
                </p>
              </div>
              <NoteBox label="Farm composition" meta="Folio 01" className="mt-10">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {FARM_COMPOSITION.map((row) => (
                    <div key={row.term}>
                      <dt className="type-label text-earth-ink">{row.term}</dt>
                      <dd className="mt-1 type-small text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </NoteBox>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-7">
              <EditorialImage
                photo="farmRuralLandscape"
                aspect="4 / 3"
                sizes="(min-width: 1024px) 58vw, 100vw"
                tags={[{ text: "Fig. 01 — The farm, early morning", position: "bottom-left" }]}
                caption="The farm in the early morning."
                frame="plate"
                botanical
                reveal="leaf"
              />
              <div className="mt-14">
                <p className="type-label text-earth-ink">The farm&rsquo;s cycle</p>
                <VeinRow items={FARM_CYCLE} label="The farm's cycle" className="mt-6" />
              </div>
            </div>
          </div>

          <VeinDivider reveal className="mt-16 lg:mt-24" />
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-4">
              <span>
                <span className="block type-h4">The land comes first</span>
                <span className="block type-small text-ink-soft">
                  Nothing is made until the trees are ready.
                </span>
              </span>
            </p>
            <LeafButton href="/journey" variant="outline" icon="arrow">
              Follow the journey
            </LeafButton>
          </div>
        </div>
      </section>

      <LandscapeScene
        photo="stageGrow"
        headingId="landscape-heading"
        heading="Soil, trees and a wide horizon."
        beats={[
          { label: "The soil", text: "Red earth, worked in open rows." },
          { label: "The trees", text: "Young moringa, shaped by the seasons." },
          { label: "The horizon", text: "Hills at the edge, sky wide overhead." },
        ]}
      />

      <EditorialSplit
        index="02"
        label="The Trees"
        aside="A living grove"
        title={[
          "A living grove,",
          <em key="1" className="italic">
            tended by hand.
          </em>,
        ]}
        body={[
          "Moringa is a fast-growing tree with fine, feathery leaves. Walk the paths between the rows and you can see the work: young trees, pruned branches, baskets waiting for the harvest.",
          "We keep the trees close to the people who look after them. That nearness is what lets us take care at every step.",
        ]}
        photo="farmPathBasket"
        caption="Carrying the harvest between the rows."
        imageTags={[{ text: "Between the rows", position: "top-left" }]}
        reverse
        tone="deep"
      />

      <section className="section-space">
        <div className="container-page grid-editorial items-end gap-y-10">
          <EditorialImage
            photo="farmYoungTrees"
            aspect="3 / 2"
            sizes="(min-width: 1024px) 58vw, 100vw"
            figureLabel="Fig. 03 — Young trees"
            caption="New growth along the farm path."
            frame="plate-reverse"
            botanical
            reveal="leaf"
            className="col-span-4 md:col-span-8 lg:col-span-7"
          />
          <div className="col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9" data-reveal="fade">
            <blockquote className="border-l border-harvest pl-6">
              <p className="type-h3 text-forest italic">
                &ldquo;We don&rsquo;t start with a product. We start with the land.&rdquo;
              </p>
              <footer className="mt-6 type-label text-earth-ink">The SVARA philosophy</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <NextChapter
        label="Next chapter"
        title="Follow the journey of a leaf"
        description="From the rows of the farm to the shade, the mill and the pouch."
        href="/journey"
        photo="stageHarvest"
        action="Begin the journey"
      />
      <MotionRoot />
    </>
  );
}
