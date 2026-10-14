"use client";

import { useMemo, useState } from "react";

import { LeafletMark } from "@/components/botanical/LeafletMark";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import type { FieldNote } from "@/content/field-notes";

import { FieldNotesJournal } from "./FieldNotesJournal";

const ALL = "All notes";

interface FieldNotesBrowserProps {
  notes: readonly FieldNote[];
}

/** Category filter chips (Stitch "All notes · Farming · Harvest …") over the journal. */
export function FieldNotesBrowser({ notes }: FieldNotesBrowserProps) {
  const [category, setCategory] = useState<string>(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(notes.map((note) => note.category)))],
    [notes],
  );
  const visible = useMemo(
    () => (category === ALL ? notes : notes.filter((note) => note.category === category)),
    [category, notes],
  );

  return (
    <div>
      <div role="group" aria-label="Filter field notes by subject" className="flex flex-wrap gap-2">
        {categories.map((entry) => {
          const count =
            entry === ALL ? notes.length : notes.filter((note) => note.category === entry).length;
          return (
            <button
              key={entry}
              type="button"
              className="leaf-chip"
              aria-pressed={category === entry}
              onClick={() => setCategory(entry)}
            >
              {category === entry && <LeafletMark variant="filled" size={14} rotate={-30} />}
              {entry}
              <span className="tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {visible.length} field {visible.length === 1 ? "note" : "notes"}
      </p>
      <VeinDivider
        align="start"
        label={`${category} · ${visible.length} ${visible.length === 1 ? "note" : "notes"}`}
        className="mt-8"
      />
      <div className="mt-12 lg:mt-16">
        <FieldNotesJournal key={category} notes={visible} headingLevel="h2" />
      </div>
    </div>
  );
}
