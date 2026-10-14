import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";

import { EditorialImage } from "@/components/editorial/EditorialImage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { ReadingVein } from "@/components/botanical/ReadingVein";
import { LeafletMark } from "@/components/botanical/LeafletMark";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import { NextChapter } from "@/components/page/NextChapter";
import { JsonLd } from "@/components/seo/JsonLd";
import { fieldNotes, findFieldNote, readingMinutes } from "@/content/field-notes";
import { photos } from "@/content/photos";
import { site } from "@/content/site";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { LeafLink } from "@/components/ui/LeafButton";

/**
 * Every known slug is prerendered by generateStaticParams, so the page is
 * static; opting out of instant-navigation validation only silences the
 * dev-time insight about reading `params` (see Next.js "Opting out").
 */
export const instant = false;

export function generateStaticParams() {
  return fieldNotes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/field-notes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const note = findFieldNote(slug);
  if (!note) return {};
  return buildMetadata({
    title: note.title,
    description: note.excerpt,
    path: `/field-notes/${note.slug}`,
    photo: note.photo,
    type: "article",
  });
}

/** The note's own closing sentence, set as its pull quote — never new copy. */
function pullQuote(body: readonly string[]): string | null {
  const last = body.at(-1);
  // Only where the quoted paragraph is far enough from the quote to not repeat it.
  if (!last || body.length < 4) return null;
  const sentence = last.split(/(?<=[.!?])\s+/).at(-1) ?? "";
  return sentence.length <= 160 ? sentence.replace(/[.]$/, "") : null;
}

export default async function FieldNotePage({ params }: PageProps<"/field-notes/[slug]">) {
  const { slug } = await params;
  const note = findFieldNote(slug);
  if (!note) notFound();

  const index = fieldNotes.indexOf(note);
  const next = fieldNotes[(index + 1) % fieldNotes.length];
  const previous = fieldNotes[(index - 1 + fieldNotes.length) % fieldNotes.length];
  const related = fieldNotes
    .filter((entry) => entry.slug !== note.slug && entry.slug !== next.slug)
    .sort((a, b) => Number(b.category === note.category) - Number(a.category === note.category))
    .slice(0, 2);
  const quote = pullQuote(note.body);

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: note.title,
          description: note.excerpt,
          image: absoluteUrl(photos[note.photo].src.src),
          publisher: { "@type": "Organization", name: site.name },
          mainEntityOfPage: absoluteUrl(`/field-notes/${note.slug}`),
        }}
      />
      <header className="container-page pt-[calc(var(--header-height)+clamp(3rem,7vw,6rem))]">
        <nav aria-label="Breadcrumb">
          <LeafLink href="/field-notes" arrow="before">
            All field notes
          </LeafLink>
        </nav>
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <p className="flex items-center justify-center gap-3">
            <span className="seed bg-ivory-deep text-earth-ink">Field note {note.number}</span>
            <span className="seed border border-[color:var(--vein)] text-ink-soft">
              {note.category}
            </span>
          </p>
          <RevealHeading
            as="h1"
            trigger="load"
            className="mt-8 type-h1 text-forest"
            lines={[note.title]}
          />
          <p className="mx-auto mt-8 max-w-xl type-lead text-ink-soft">{note.excerpt}</p>
          <p className="mt-8 type-label text-ink-soft">{readingMinutes(note)} min read</p>
        </div>
      </header>

      <EditorialImage
        photo={note.photo}
        aspect="16 / 9"
        sizes="(min-width: 1536px) 1408px, 100vw"
        preload
        reveal="leaf"
        frame="plate"
        botanical
        className="container-page mt-16 lg:mt-24"
      />

      <div className="container-page section-space">
        <div id="note-body" className="mx-auto max-w-[38rem] space-y-7">
          {note.body.map((paragraph, paragraphIndex) => (
            <Fragment key={paragraph}>
              <div className="relative" data-reveal="fade">
                <span
                  aria-hidden="true"
                  className="absolute top-1 -left-24 hidden items-center gap-2 type-label text-earth-ink xl:flex"
                >
                  <LeafletMark variant="filled" size={10} rotate={-30} className="text-botanical" />
                  {String(paragraphIndex + 1).padStart(2, "0")}
                </span>
                <p
                  className={
                    paragraphIndex === 0
                      ? "type-lead first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-[4.2rem] first-letter:leading-[0.85] first-letter:text-forest"
                      : "type-body text-ink"
                  }
                >
                  {paragraph}
                </p>
              </div>
              {paragraphIndex === 1 && quote && (
                <figure className="relative -mx-2 my-12 py-6 sm:-mx-16" data-reveal="fade">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 text-botanical"
                  >
                    <LeafletMark variant="filled" size={16} rotate={-90} />
                  </span>
                  <blockquote className="border-y border-[color:var(--vein)] py-8 text-center type-h2 text-forest italic">
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 text-center type-label text-earth-ink">
                    From this note
                  </figcaption>
                </figure>
              )}
            </Fragment>
          ))}
          <VeinDivider className="pt-8" />
        </div>
      </div>
      <ReadingVein targetId="note-body" />

      <nav aria-label="More field notes" className="container-page pb-[var(--section-space)]">
        <div className="flex flex-col gap-4 border-y hairline py-5 sm:flex-row sm:items-center sm:justify-between">
          <LeafLink href={`/field-notes/${previous.slug}`} arrow="before">
            {previous.title}
          </LeafLink>
          <LeafLink href="/field-notes">All field notes</LeafLink>
        </div>
        <h2 className="mt-14 type-label text-earth-ink">Also from the field notebook</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2" data-reveal="stagger">
          {related.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/field-notes/${entry.slug}`}
                className="group grid grid-cols-[6rem_1fr] items-center gap-5"
              >
                <span className="relative block aspect-square overflow-hidden leaflet">
                  <Image
                    src={photos[entry.photo].src}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-organic)] group-hover:scale-105"
                  />
                </span>
                <span>
                  <span className="block type-label text-earth-ink">{entry.category}</span>
                  <span className="mt-1 block type-h4 text-forest group-hover:underline">
                    {entry.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {next && next.slug !== note.slug && (
        <NextChapter
          label="Next field note"
          title={next.title}
          href={`/field-notes/${next.slug}`}
          description={next.excerpt}
          photo={next.photo}
        />
      )}
      <MotionRoot />
    </article>
  );
}
