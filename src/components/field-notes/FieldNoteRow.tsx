import Image from "next/image";
import Link from "next/link";

import { readingMinutes, type FieldNote } from "@/content/field-notes";
import { photos } from "@/content/photos";

interface FieldNoteRowProps {
  note: FieldNote;
}

/** A text-led editorial row with a small photographic accent. */
export function FieldNoteRow({ note }: FieldNoteRowProps) {
  const photo = photos[note.photo];
  return (
    <li className="border-b border-[color:var(--vein)]">
      <Link
        href={`/field-notes/${note.slug}`}
        className="group grid grid-cols-[4.5rem_1fr] items-center gap-x-5 gap-y-2 py-7 md:grid-cols-[3rem_1fr_9rem_7rem] md:gap-x-8 lg:grid-cols-[3rem_7.5rem_1fr_10rem_6rem]"
      >
        <span className="hidden type-label text-earth-ink md:block">{note.number}</span>
        <span className="media-frame row-span-2 aspect-[4/5] w-full leaf-plate-sm md:hidden lg:row-span-1 lg:block lg:aspect-[3/2]">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="120px"
            className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-organic)] group-hover:scale-105"
          />
        </span>
        <span className="type-h3 transition-colors duration-500 group-hover:text-forest">
          {note.title}
        </span>
        <span className="type-label text-ink-soft md:text-right">{note.category}</span>
        <span className="hidden items-center justify-end gap-2 type-label text-ink-soft md:flex">
          {readingMinutes(note)} min
          <span
            aria-hidden="true"
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </Link>
    </li>
  );
}
