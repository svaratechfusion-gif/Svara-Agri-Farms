import Link from "next/link";

import { LeafletMark } from "@/components/botanical/LeafletMark";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { readingMinutes, type FieldNote } from "@/content/field-notes";

import { FieldNoteRow } from "./FieldNoteRow";

interface FieldNotesJournalProps {
  notes: readonly FieldNote[];
  headingLevel?: "h2" | "h3";
}

/** How many notes branch from the featured one as cards before the rows begin. */
const BRANCH_COUNT = 2;

interface BranchCardProps {
  note: FieldNote;
  index: number;
  Heading: "h2" | "h3";
}

/** A note branching from the featured story; the two branches differ in shape. */
function BranchCard({ note, index, Heading }: BranchCardProps) {
  const first = index === 0;
  return (
    <li
      className="relative pt-8"
      data-reveal="fade"
      style={{ transitionDelay: `${0.1 + index * 0.22}s` }}
    >
      <span aria-hidden="true" className="absolute -top-[0.45rem] left-0 text-botanical">
        <LeafletMark variant="filled" size={16} rotate={first ? -30 : -60} />
      </span>
      <Link href={`/field-notes/${note.slug}`} className="group block">
        <EditorialImage
          photo={note.photo}
          aspect={first ? "4 / 3" : "1 / 1"}
          frame={first ? "plate-reverse" : "leaflet"}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          imageClassName="transition-transform duration-[1600ms] ease-[var(--ease-organic)] group-hover:scale-[1.04]"
          className={first ? "" : "mx-auto w-4/5"}
        />
        <p className="mt-6 type-label text-earth-ink">
          {note.number} · {note.category} · {readingMinutes(note)} min
        </p>
        <Heading className="mt-3 type-h3 transition-colors duration-500 group-hover:text-forest">
          {note.title}
        </Heading>
        <p className="mt-3 type-small text-ink-soft">{note.excerpt}</p>
      </Link>
    </li>
  );
}

/**
 * A botanical editorial index: the featured note is the main stem (it opens
 * through a leaf mask), two notes branch from it as distinct cards along a
 * vein, and the rest follow as quiet vein-ruled rows.
 */
export function FieldNotesJournal({ notes, headingLevel = "h3" }: FieldNotesJournalProps) {
  const [featured, ...rest] = notes;
  if (!featured) return null;
  const Heading = headingLevel;
  const branches = rest.slice(0, BRANCH_COUNT);
  const rows = rest.slice(BRANCH_COUNT);

  return (
    <div>
      <article className="grid-editorial gap-y-10">
        <Link
          href={`/field-notes/${featured.slug}`}
          className="group col-span-4 md:col-span-8 lg:col-span-8"
          tabIndex={-1}
          aria-hidden="true"
        >
          <EditorialImage
            photo={featured.photo}
            aspect="16 / 10"
            sizes="(min-width: 1024px) 64vw, 100vw"
            frame="plate"
            botanical
            reveal="leaf"
            tags={[{ text: `Field note ${featured.number}`, position: "top-right" }]}
            imageClassName="transition-transform duration-[1600ms] ease-[var(--ease-organic)] group-hover:scale-[1.03]"
          />
        </Link>
        <div className="col-span-4 flex flex-col justify-end md:col-span-6 lg:col-span-4">
          <p className="seed self-start bg-ivory-deep text-earth-ink">{featured.category}</p>
          <Heading className="mt-5 type-h2">
            <Link href={`/field-notes/${featured.slug}`} className="link-quiet">
              {featured.title}
            </Link>
          </Heading>
          <p className="mt-5 type-body text-ink-soft">{featured.excerpt}</p>
          <p className="mt-8 type-label text-ink-soft">{readingMinutes(featured)} min read</p>
        </div>
      </article>

      {branches.length > 0 && (
        <ol
          aria-label="Branching notes"
          className="mt-20 grid gap-x-12 gap-y-14 border-t border-[color:var(--vein)] sm:grid-cols-2 lg:mt-24 lg:grid-cols-[1.25fr_1fr]"
        >
          {branches.map((note, index) => (
            <BranchCard key={note.slug} note={note} index={index} Heading={Heading} />
          ))}
        </ol>
      )}

      {rows.length > 0 && (
        <ol
          className="mt-16 border-t border-[color:var(--vein)] lg:mt-20"
          aria-label="More field notes"
        >
          {rows.map((note) => (
            <FieldNoteRow key={note.slug} note={note} />
          ))}
        </ol>
      )}
    </div>
  );
}
