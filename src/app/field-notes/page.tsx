import type { Metadata } from "next";

import { FieldNotesBrowser } from "@/components/field-notes/FieldNotesBrowser";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { PageIntro } from "@/components/page/PageIntro";
import { LeafButton } from "@/components/ui/LeafButton";
import { fieldNotes } from "@/content/field-notes";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Field Notes",
  description:
    "Stories from the farm, the ingredient and the journey — short notes from the SVARA fields.",
  path: "/field-notes",
  photo: "harvestersField",
});

export default function FieldNotesPage() {
  return (
    <>
      <PageIntro
        label="Field Notes"
        title={[
          "Stories from",
          <em key="1" className="italic">
            the farm.
          </em>,
        ]}
        lead="Short notes on the land, the ingredient, the people and the process — written from the fields."
      />
      <section aria-label="All field notes" className="container-page pb-[var(--section-space)]">
        <FieldNotesBrowser notes={fieldNotes} />
      </section>

      <section className="container-page pb-[var(--section-space)]" aria-labelledby="notes-close">
        <div
          data-surface="dark"
          className="bg-forest px-6 py-14 text-ivory md:px-12 lg:px-16 lg:py-20"
        >
          <p className="type-label text-harvest">From the field notebook</p>
          <h2 id="notes-close" className="mt-6 max-w-3xl type-h2 italic">
            &ldquo;The care you cannot see is the reason we do it this way at all.&rdquo;
          </h2>
          <p className="mt-6 type-label text-ivory/70">{site.philosophy.join(" ")}</p>
          <div className="mt-12 flex flex-col gap-3 border-t border-rule-light pt-8 sm:flex-row sm:justify-between">
            <LeafButton href="/our-story" variant="outline" icon="arrow-left">
              Our story
            </LeafButton>
            <LeafButton href="/products/moringa-powder" icon="arrow">
              Discover Moringa Powder
            </LeafButton>
          </div>
        </div>
      </section>
      <MotionRoot />
    </>
  );
}
