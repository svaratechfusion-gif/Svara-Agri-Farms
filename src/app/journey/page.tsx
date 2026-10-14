import type { Metadata } from "next";

import { FollowTheLeaf } from "@/components/home/FollowTheLeaf";
import { People } from "@/components/home/People";
import { Shade } from "@/components/home/Shade";
import { Ingredient } from "@/components/home/Ingredient";
import { JourneyOpening } from "@/components/journey/JourneyOpening";
import { NextChapter } from "@/components/page/NextChapter";
import { buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";

export const metadata: Metadata = buildMetadata({
  title: "The Journey of a Leaf",
  description:
    "Grow, harvest, select, shade dry, mill and pack — follow a single moringa leaf from the SVARA farm to the finished powder.",
  path: "/journey",
  photo: "handsHarvestBasket",
});

export default function JourneyPage() {
  return (
    <div>
      <JourneyOpening />
      <FollowTheLeaf index="01" headingLevel="h2" />
      <People index="02" />
      <Shade index="03" />
      <Ingredient index="04" />
      <div className="pt-[var(--section-space)]">
        <NextChapter
          label="The finished product"
          title="SVARA Moringa Powder"
          description="Where the six stages end: one leaf, sealed in a SVARA pouch."
          href="/products/moringa-powder"
          product
          action="See the product"
        />
      </div>
      <MotionRoot />
    </div>
  );
}
