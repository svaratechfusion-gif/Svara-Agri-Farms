import type { Metadata } from "next";

import { Closing } from "@/components/home/Closing";
import { FieldNotesSection } from "@/components/home/FieldNotesSection";
import { FollowTheLeaf } from "@/components/home/FollowTheLeaf";
import { Ingredient } from "@/components/home/Ingredient";
import { Hero } from "@/components/home/Hero";
import { Ritual } from "@/components/home/Ritual";
import { TheGreen } from "@/components/home/TheGreen";
import { TheLeaf } from "@/components/home/TheLeaf";
import { TheRange } from "@/components/home/TheRange";
import { IngredientFlowDivider } from "@/components/botanical/IngredientFlowDivider";
import { flowPlacements } from "@/content/ingredientFlows";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/content/site";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { ChapterVein, type Chapter } from "@/components/botanical/ChapterVein";

/** The chapters of the homepage, in order, for the chapter vein and folios. */
const CHAPTERS: readonly Chapter[] = [
  { headingId: "hero-heading", title: "The Farm" },
  { headingId: "ritual-heading", title: "The Ritual" },
  { headingId: "leaf-heading", title: "The Leaf" },
  { headingId: "ingredient-heading", title: "The Ingredient" },
  { headingId: "journey-heading", title: "Follow the Leaf" },
  { headingId: "green-heading", title: "The Green" },
  { headingId: "range-heading", title: "The Product" },
  { headingId: "notes-heading", title: "Field Notes" },
  { headingId: "closing-heading", title: "Closing" },
];

/** Two-digit chapter number for a section, from its heading id. */
function chapter(headingId: string): string {
  return String(CHAPTERS.findIndex((entry) => entry.headingId === headingId) + 1).padStart(2, "0");
}

export const metadata: Metadata = {
  ...buildMetadata({
    title: `${site.name} — From the earth. Made with care.`,
    description:
      "SVARA Agri Farms is a premium farm-to-product agricultural brand beginning with Moringa Powder. Follow one leaf from the earth to your home.",
    path: "/",
  }),
  title: { absolute: `${site.name} — From the earth. Made with care.` },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: site.url,
          logo: absoluteUrl("/icon.png"),
          slogan: site.philosophy.join(" "),
          description: site.description,
        }}
      />
      <Hero />
      <Ritual index={chapter("ritual-heading")} />
      <TheLeaf index={chapter("leaf-heading")} />
      <Ingredient index={chapter("ingredient-heading")} />
      <IngredientFlowDivider {...flowPlacements.homeIngredient} />
      <FollowTheLeaf index={chapter("journey-heading")} />
      <TheGreen index={chapter("green-heading")} />
      <IngredientFlowDivider {...flowPlacements.homeRange} />
      <TheRange index={chapter("range-heading")} />
      <FieldNotesSection index={chapter("notes-heading")} />
      <Closing />
      <ChapterVein chapters={CHAPTERS} />
      <MotionRoot />
    </>
  );
}
