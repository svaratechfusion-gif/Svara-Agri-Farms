import { MoringaLeaf, type LeafCallout } from "./MoringaLeaf";

/**
 * Parts of the leaf, in the plain terms the rest of the site already uses:
 * leaves are gathered by hand, stems are set aside when sorting, and the leaf
 * is shade dried before it is milled. No nutritional or health claims.
 */
const PARTS = [
  { number: "1", title: "Leaflet", body: "The small, rounded leaf that becomes the powder." },
  { number: "2", title: "Stem", body: "Set aside by hand when the harvest is sorted." },
  { number: "3", title: "The whole leaf", body: "Dried slowly in the shade before it is milled." },
] as const;

const CALLOUTS: readonly LeafCallout[] = [
  { number: "1", x: 180, y: 192 },
  { number: "2", x: 104, y: 338 },
  { number: "3", x: 58, y: 260 },
];

interface IngredientDiagramProps {
  className?: string;
}

/** A botanical plate of the ingredient: the compound moringa leaf, labelled. */
export function IngredientDiagram({ className = "" }: IngredientDiagramProps) {
  return (
    <figure
      className={`grid items-center gap-10 leaf-plate bg-ivory px-6 py-10 sm:grid-cols-[minmax(0,15rem)_1fr] sm:px-10 lg:px-14 lg:py-14 ${className}`}
    >
      <div className="mx-auto w-full max-w-[13rem] text-forest sm:max-w-none">
        <MoringaLeaf
          callouts={CALLOUTS}
          title="Line drawing of a moringa leaf: a central stem with paired, rounded leaflets."
        />
      </div>
      <figcaption>
        <p className="type-label text-earth-ink">Botanical plate · Moringa oleifera</p>
        <p className="mt-3 type-h3 text-forest">Anatomy of the ingredient.</p>
        <ol className="mt-8 space-y-5">
          {PARTS.map((part) => (
            <li key={part.number} className="flex gap-4">
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-forest [font-family:var(--font-mono)] text-[0.625rem] text-ivory"
              >
                {part.number}
              </span>
              <span>
                <span className="block type-label text-ink">{part.title}</span>
                <span className="mt-1 block type-small text-ink-soft">{part.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
