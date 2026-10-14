import type { CSSProperties } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import type { CutoutKey } from "@/content/cutouts";

interface Pillar {
  word: string;
  body: string;
}

/** Each word's specimen: the leaf, the leaf dried with care, the powder. */
const SPECIMENS: readonly { cutout: CutoutKey; className: string; rate: string }[] = [
  { cutout: "moringaLeafBranch", className: "w-[92%] rotate-[-24deg]", rate: "0.08" },
  { cutout: "driedBranch", className: "h-[88%] rotate-[-18deg]", rate: "0.16" },
  { cutout: "powderMound", className: "w-[86%] translate-y-[18%]", rate: "0.24" },
];

/**
 * Three words, three specimens: the fresh leaf (Nature), the shade-dried
 * branch (Nurture), the powder (Nourish). Each specimen sits on its own plate
 * and drifts at its own rate; the words arrive in turn beneath them.
 */
export function PhilosophyTriptych({ pillars }: { pillars: readonly Pillar[] }) {
  return (
    <section className="bg-ivory section-space" aria-labelledby="philosophy-heading">
      <div className="container-page">
        <SectionHeader label="Our philosophy" aside="Three words, one way of working." />
        <h2 id="philosophy-heading" className="sr-only">
          Nature, nurture, nourish
        </h2>
        <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8 lg:mt-20" data-reveal="stagger">
          {pillars.map((pillar, index) => {
            const specimen = SPECIMENS[index];
            return (
              <li key={pillar.word} className={index === 1 ? "md:mt-24" : undefined}>
                <div
                  className={`relative grid aspect-[4/5] place-items-center overflow-hidden ${
                    index === 1 ? "leaf-plate-reverse" : "leaf-plate"
                  } bg-[radial-gradient(ellipse_at_50%_42%,#fdfaf2_0%,var(--color-ivory-deep)_70%,var(--color-parchment)_100%)]`}
                  data-reveal="leaf"
                  style={{ "--i": index } as CSSProperties}
                >
                  <div
                    className="absolute inset-[8%] grid place-items-center"
                    data-parallax={specimen.rate}
                  >
                    <div className="grid h-full w-full place-items-center" data-parallax-target="">
                      <CutoutImage
                        cutout={specimen.cutout}
                        decorative
                        sizes="(min-width: 768px) 30vw, 90vw"
                        className={specimen.className}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-8 type-label text-earth-ink">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 type-display text-forest italic">{pillar.word}</p>
                <p className="mt-4 max-w-xs type-body text-ink-soft">{pillar.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
