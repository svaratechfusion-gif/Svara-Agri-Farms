import type { Metadata } from "next";

import { NextChapter } from "@/components/page/NextChapter";
import { ManifestoScene } from "@/components/page/ManifestoScene";
import { PageHero } from "@/components/page/PageHero";
import { MeetSvara } from "@/components/mascot/MeetSvara";
import { ExpandingScene } from "@/components/story/ExpandingScene";
import { FutureScene } from "@/components/story/FutureScene";
import { PhilosophyTriptych } from "@/components/story/PhilosophyTriptych";
import { PortraitChapter } from "@/components/story/PortraitChapter";
import { buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Logo } from "@/components/brand/Logo";
import { IngredientFlowDivider } from "@/components/botanical/IngredientFlowDivider";
import { flowPlacements } from "@/content/ingredientFlows";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import { LeafButton } from "@/components/ui/LeafButton";

export const metadata: Metadata = buildMetadata({
  title: "Our Story",
  description:
    "Nature. Nurture. Nourish. Why SVARA Farms begins with the land, and how that idea shapes everything we make.",
  path: "/our-story",
  photo: "farmRuralLandscape",
});

const PILLARS = [
  {
    word: "Nature.",
    body: "What grows from the earth. We begin with the land and let it set the pace.",
  },
  {
    word: "Nurture.",
    body: "How we tend it. Gathered by hand, sorted with attention, dried with patience.",
  },
  {
    word: "Nourish.",
    body: "What reaches your home. The care of the farm, carried all the way to your kitchen.",
  },
] as const;

export default function OurStoryPage() {
  return (
    <>
      <PageHero
        label="Our Story"
        title={["We grow with purpose."]}
        lead="SVARA Farms is a farm-to-product brand. We grow, harvest and make — and we start with the land, not the product."
        photo="farmRuralLandscape"
        annotations={["Nature", "Nurture", "Nourish"]}
      />

      <ManifestoScene
        headingId="manifesto-heading"
        label="What we are"
        lines={[
          "SVARA Farms is a farm-to-product brand.",
          "We grow, harvest and make —",
          "and we start with the land,",
          "not the product.",
        ]}
      />

      <PhilosophyTriptych pillars={PILLARS} />

      <PortraitChapter
        label="The people"
        headingId="people-heading"
        title={
          <>
            Human care, <em className="text-botanical italic">in every touch.</em>
          </>
        }
        body={[
          "SVARA is made by people who work with their hands — plucking, carrying, sorting and spreading the leaves to dry.",
          "We believe that care shows. It is in the choice to harvest by hand, and in the patience to let the leaves dry slowly in the shade.",
        ]}
        photo="farmersPortrait"
        inset="stageSelect"
      />

      <ExpandingScene
        photo="stageShade"
        headingId="process-heading"
        title={
          <>
            Patience over speed. <em className="text-harvest italic">Care over shortcuts.</em>
          </>
        }
        body="Our process is simple and deliberate, and each step is done with attention — so that what reaches you still carries something of the farm it came from."
        marks={["Grow", "Harvest", "Select", "Shade dry", "Mill", "Pack"]}
      />

      <IngredientFlowDivider {...flowPlacements.storyFuture} />

      <FutureScene headingId="future-heading" />

      <MeetSvara />

      <section className="section-space" aria-labelledby="story-close">
        <div className="container-page flex flex-col items-center text-center">
          <Logo size={72} />
          <h2 id="story-close" className="mt-10 max-w-3xl type-h2 text-forest italic">
            &ldquo;We don&rsquo;t start with a product. We start with the land.&rdquo;
          </h2>
          <VeinDivider label="Nature. Nurture. Nourish." reveal className="mt-10 w-full max-w-xl" />
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <LeafButton href="/products/moringa-powder" icon="arrow">
              Discover Moringa Powder
            </LeafButton>
            <LeafButton href="/farm" variant="outline">
              Visit the farm
            </LeafButton>
          </div>
        </div>
      </section>

      <NextChapter
        label="Next chapter"
        title="The farm"
        description="Rows of moringa, red earth and the slow work of tending the land."
        href="/farm"
        photo="farmPlantationAerial"
        action="Enter the farm"
      />
      <MotionRoot />
    </>
  );
}
