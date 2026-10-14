import { Branch, Branches } from "@/components/botanical/Branches";
import { FloatingLeaf } from "@/components/botanical/FloatingLeaf";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { LeafButton } from "@/components/ui/LeafButton";

const LEAF_RECORD = [
  { term: "Botanical name", value: "Moringa oleifera" },
  { term: "Also known as", value: "Drumstick tree" },
  { term: "Part we use", value: "The leaf" },
  { term: "What it becomes", value: "A fine green powder" },
] as const;

/** The specimen: a real photographic cutout of a moringa leaf, floating on ivory. */
function LeafSpecimen() {
  return (
    <figure>
      <div className="flex items-center gap-4 pb-4">
        <span className="type-label text-forest">Specimen — Moringa oleifera</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--vein)]" />
        <span className="hidden type-label text-ink-soft sm:inline">One compound leaf</span>
      </div>
      <div className="overflow-hidden leaf-plate bg-[radial-gradient(ellipse_at_45%_40%,#fbf8f0_0%,var(--color-ivory)_55%,var(--color-ivory-deep)_100%)]">
        <FloatingLeaf />
      </div>
      <figcaption className="mt-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="type-label text-earth-ink">A single compound leaf</span>
        <span className="type-caption text-ink-soft">
          Paired leaflets along one stem — the part of the tree that becomes the powder.
        </span>
      </figcaption>
    </figure>
  );
}

/** 03 — The Leaf: the botanical reference for the whole site. */
export function TheLeaf({ index = "03" }: { index?: string }) {
  return (
    <section aria-labelledby="leaf-heading" className="bg-ivory">
      <div className="container-page section-space">
        <div className="grid-editorial gap-y-16">
          <div className="col-span-4 md:col-span-8 lg:sticky lg:top-[calc(var(--header-height)+3rem)] lg:col-span-5 lg:self-start">
            <SectionHeader index={index} label="A botanical study" />
            <RevealHeading
              id="leaf-heading"
              className="mt-5 type-h1 text-forest"
              lines={[
                "Everything starts",
                <em key="1" className="text-botanical italic">
                  with a leaf.
                </em>,
              ]}
            />
            <p className="mt-10 max-w-md type-lead" data-reveal="fade">
              Before the shade, before the mill, before the pouch — there is only this: a single
              leaflet on a moringa branch, catching the morning light.
            </p>

            <p className="mt-12 type-label text-earth-ink">The leaf, on record</p>
            <Branches as="ul" className="mt-5 max-w-md space-y-4" aria-label="Leaf record">
              {LEAF_RECORD.map((row, index) => (
                <Branch key={row.term} as="li" flip={index % 2 === 1}>
                  <p className="flex items-baseline justify-between gap-6 border-b border-[color:var(--vein)] pb-3">
                    <span className="type-label text-earth-ink">{row.term}</span>
                    <span className="text-right type-caption text-ink">{row.value}</span>
                  </p>
                </Branch>
              ))}
            </Branches>

            <blockquote className="mt-12 max-w-md border-l border-harvest pl-6" data-reveal="fade">
              <p className="type-h3 text-forest italic">
                &ldquo;Everything in the pouch begins as a leaf on one of our trees.&rdquo;
              </p>
              <footer className="mt-4 type-label text-earth-ink">— The SVARA way</footer>
            </blockquote>
            <LeafButton href="/journey" icon="arrow" className="mt-12">
              Follow the leaf
            </LeafButton>
          </div>

          <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6">
            <LeafSpecimen />
          </div>
        </div>
      </div>
    </section>
  );
}
