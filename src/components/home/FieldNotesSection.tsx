import { SectionHeader } from "@/components/editorial/SectionHeader";
import { FieldNotesJournal } from "@/components/field-notes/FieldNotesJournal";
import { fieldNotes } from "@/content/field-notes";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { LeafButton } from "@/components/ui/LeafButton";

/** 09 — Field Notes. */
export function FieldNotesSection({ index = "09" }: { index?: string }) {
  return (
    <section aria-labelledby="notes-heading" className="section-space">
      <div className="container-page">
        <SectionHeader index={index} label="Field Notes" aside="Stories from the farm." />
        <div className="mt-14 flex flex-wrap items-end justify-between gap-8 lg:mt-20">
          <RevealHeading
            id="notes-heading"
            className="type-h1 text-forest"
            lines={["Field notes."]}
          />
          <LeafButton href="/field-notes" variant="outline" icon="arrow">
            All field notes
          </LeafButton>
        </div>
        <div className="mt-14 lg:mt-20">
          <FieldNotesJournal notes={fieldNotes.slice(0, 4)} />
        </div>
      </div>
    </section>
  );
}
