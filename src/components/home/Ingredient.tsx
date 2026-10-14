import { Fragment, type ReactNode } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { IngredientFilm } from "@/components/botanical/IngredientFilm";
import { LeafletMark } from "@/components/botanical/LeafletMark";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";

interface IngredientState {
  number: string;
  title: string;
  note: string;
  media: ReactNode;
}

const STATES: readonly IngredientState[] = [
  {
    number: "01",
    title: "Fresh leaf",
    note: "Soft, bright, just gathered.",
    media: (
      <CutoutImage
        cutout="moringaLeafBranch"
        sizes="(min-width: 1024px) 26vw, 80vw"
        className="w-[96%] rotate-[-18deg]"
      />
    ),
  },
  {
    number: "02",
    title: "Dried leaf",
    note: "Crisp after its time in the shade.",
    media: (
      <CutoutImage
        cutout="driedBranch"
        sizes="(min-width: 1024px) 26vw, 80vw"
        className="h-[88%] rotate-[-14deg]"
      />
    ),
  },
  {
    number: "03",
    title: "Powder",
    note: "Fine, soft, still deeply green.",
    media: (
      <div className="ingredient-powder relative w-[94%] translate-y-[14%]">
        <span
          aria-hidden="true"
          className="absolute inset-x-[6%] bottom-[2%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.32),transparent)]"
        />
        <CutoutImage cutout="powderMound" sizes="(min-width: 1024px) 30vw, 86vw" />
      </div>
    ),
  },
];

/** The arrow between two states: a short vein ending in a leaflet. */
function StateArrow() {
  return (
    <li
      aria-hidden="true"
      className="flex items-center justify-center text-botanical max-lg:rotate-90 max-lg:py-1 lg:self-stretch lg:pb-24"
    >
      <svg viewBox="0 0 64 12" className="w-14 overflow-visible" fill="none">
        <path
          d="M2 6 C 20 2, 40 10, 56 6"
          pathLength={1}
          data-draw="reveal"
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={1}
        />
      </svg>
      <LeafletMark variant="filled" size={14} rotate={0} className="-ml-1" />
    </li>
  );
}

/**
 * 08 — The Ingredient. One ingredient in three states, set out as an
 * editorial row on warm ivory: the moringa leaf cutout, the shade-dried
 * sprig, and the standalone powder mound with a contact shadow. These are
 * illustrative studies, labelled as such — not photographs of a facility.
 */
export function Ingredient({ index = "08" }: { index?: string }) {
  return (
    <section aria-labelledby="ingredient-heading" className="bg-ivory section-space">
      <div className="container-page">
        <SectionHeader index={index} label="The Ingredient" aside="Fresh. Dried. Powder." />

        <div className="mt-14 grid-editorial items-end gap-y-8 lg:mt-20">
          <RevealHeading
            id="ingredient-heading"
            className="col-span-4 type-h1 text-forest md:col-span-8 lg:col-span-7"
            lines={[
              "One ingredient.",
              <em key="1" className="italic">
                Three states.
              </em>,
            ]}
          />
          <p
            className="col-span-4 type-lead md:col-span-6 lg:col-span-4 lg:col-start-9"
            data-reveal="fade"
          >
            The three forms the leaf takes on its way to the pouch: gathered by hand, dried in the
            shade, then milled.
          </p>
        </div>

        {/* Desktop with motion: the pinned, scroll-scrubbed scene. */}
        <div className="hidden motion-safe:lg:block">
          <IngredientFilm />
        </div>

        {/* Phones and reduced motion: the same three states, side by side. */}
        <ol
          className="mt-14 grid gap-y-4 lg:mt-20 lg:grid-cols-[1fr_auto_1fr_auto_1.25fr] lg:items-end lg:gap-x-6 motion-safe:lg:hidden"
          data-reveal="stagger"
          aria-label="Fresh leaf, dried leaf, powder"
        >
          {STATES.map((state, position) => (
            <Fragment key={state.number}>
              {position > 0 && <StateArrow />}
              <li>
                <figure>
                  <div
                    data-reveal="leaf"
                    className={`relative grid aspect-square place-items-center overflow-hidden ${
                      position === 1 ? "leaf-plate-sm" : "leaf-plate"
                    } bg-[radial-gradient(ellipse_at_50%_40%,#fbf8f0_0%,var(--color-ivory-deep)_75%)]`}
                  >
                    {state.media}
                  </div>
                  <figcaption className="mt-5 flex items-baseline gap-4">
                    <span className="type-label text-earth-ink">{state.number}</span>
                    <span>
                      <span className="block type-h3 text-forest">{state.title}</span>
                      <span className="mt-1 block type-small text-ink-soft">{state.note}</span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            </Fragment>
          ))}
        </ol>

        <p className="mt-10 type-label text-ink-soft">
          Studies of the ingredient — illustrative, not photographs of our facility.
        </p>
      </div>
    </section>
  );
}
