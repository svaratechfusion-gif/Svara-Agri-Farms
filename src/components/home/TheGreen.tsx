import Image from "next/image";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { photos, type PhotoKey } from "@/content/photos";

interface Arch {
  photo: PhotoKey;
  label: string;
  note: string;
  /** Parallax rate: the two arches drift at different speeds. */
  rate: string;
}

const ARCHES: readonly [Arch, Arch] = [
  {
    photo: "leafBranchSunlit",
    label: "On the branch",
    note: "Bright and soft, the colour of the morning.",
    rate: "0.12",
  },
  {
    photo: "leafDriedSprig",
    label: "In the shade",
    note: "Deeper and quieter, crisp to the touch.",
    rate: "0.2",
  },
];

/** A photograph in an arched window, with its caption beneath. */
function ArchWindow({ arch, align }: { arch: Arch; align: "start" | "end" }) {
  const { src, alt } = photos[arch.photo];
  return (
    <figure className={align === "end" ? "lg:text-right" : undefined}>
      <div data-parallax={arch.rate}>
        <div data-parallax-target="">
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[1.75rem] ring-1 ring-harvest/40 ring-offset-8 ring-offset-forest"
            data-reveal="image"
          >
            <Image
              src={src}
              alt={alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 24vw, 44vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
      <figcaption className="mt-8">
        <span className="block type-label text-harvest">{arch.label}</span>
        <span className="mt-2 block type-h4 text-ivory">{arch.note}</span>
      </figcaption>
    </figure>
  );
}

/**
 * 09 — The Green. The deep-forest chapter: a low harvest sun with its rays at
 * the centre, the sweep of powder crossing it, and the leaf in two arched
 * windows either side — fresh on the branch, dried in the shade. The rays turn
 * and the sun swells a little with the scroll; nothing moves on its own.
 */
export function TheGreen({ index = "09" }: { index?: string }) {
  return (
    <section
      aria-labelledby="green-heading"
      data-surface="dark"
      className="the-green relative isolate overflow-hidden bg-forest section-space text-ivory"
    >
      <div className="container-page text-center">
        <SectionHeader index={index} label="A note on colour" tone="light" align="center" />
        <RevealHeading
          id="green-heading"
          className="mx-auto mt-5 max-w-4xl type-h1 text-ivory"
          lines={[
            "From one green",
            <em key="1" className="text-harvest italic">
              to another.
            </em>,
          ]}
        />
        <p className="mx-auto mt-6 max-w-xl type-lead text-ivory/80" data-reveal="fade">
          The green of the branch, the green of the shade-dried leaf, the green of the powder in the
          bowl. We follow one colour from the tree to your kitchen.
        </p>
      </div>

      <div className="relative container-page mt-14 lg:mt-20">
        <div
          aria-hidden="true"
          data-parallax="0"
          className="green-sun pointer-events-none absolute top-[42%] left-1/2 -z-10 aspect-square w-[min(150vw,64rem)] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="green-sun__rays absolute inset-0 rounded-full" />
          <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle,rgb(232_200_120/0.95)_0%,rgb(197_161_90/0.75)_38%,rgb(197_161_90/0)_72%)]" />
        </div>

        <div className="grid grid-cols-2 items-end gap-x-5 gap-y-12 text-left lg:grid-cols-[1fr_1.7fr_1fr] lg:gap-x-10">
          <ArchWindow arch={ARCHES[0]} align="start" />
          <figure className="col-span-2 row-start-1 lg:col-span-1 lg:col-start-2 lg:row-start-auto">
            <div className="green-swoosh" data-reveal="fade">
              <CutoutImage cutout="powderSwoosh" sizes="(min-width: 1024px) 46vw, 100vw" />
            </div>
            <figcaption className="mt-4 text-center">
              <span className="block type-label text-harvest">In the pouch</span>
              <span className="mt-2 block type-h4 text-ivory">Fine, soft, still deeply green.</span>
            </figcaption>
          </figure>
          <ArchWindow arch={ARCHES[1]} align="end" />
        </div>

        <p className="mt-14 text-center type-label text-ivory/60">Illustrative composition</p>
      </div>
    </section>
  );
}
