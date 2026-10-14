import Image from "next/image";

import { Logo } from "@/components/brand/Logo";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { LeafletField } from "@/components/botanical/LeafletField";
import { LeafButton } from "@/components/ui/LeafButton";
import { photos } from "@/content/photos";
import { site } from "@/content/site";

/** The hills from the opening, now running down into the forest band. */
function Hills() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 140"
      preserveAspectRatio="none"
      className="absolute inset-x-0 -bottom-px h-[clamp(4rem,9vw,8.5rem)] w-full"
    >
      <path
        d="M0 64 C 260 10, 520 18, 760 56 S 1220 112, 1440 40 L1440 140 L0 140 Z"
        fill="var(--color-botanical)"
        fillOpacity={0.55}
      />
      <path
        d="M0 104 C 320 60, 600 74, 860 98 S 1270 124, 1440 92 L1440 140 L0 140 Z"
        fill="var(--color-forest)"
      />
    </svg>
  );
}

/**
 * Closing. The farm from the opening returns and runs down, over the same
 * hills, into a forest band where the official seal and the three words
 * settle — the quiet end of the story, with one way back into the shop.
 */
export function Closing() {
  const image = photos.farmHarvestValley;
  return (
    <section aria-labelledby="closing-heading" className="relative">
      <div
        className="relative isolate h-[78svh] min-h-[28rem] overflow-hidden bg-forest-deep"
        data-parallax="0.1"
      >
        <div className="absolute inset-x-0 -inset-y-[12%] -z-10" data-parallax-target="">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-[50%_45%]"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--color-ivory)_0%,rgb(247_243_232/0)_18%,rgb(15_42_27/0)_60%,rgb(15_42_27/0.3)_100%)]"
        />
        <LeafletField count={9} color="rgb(197 161 90)" className="-z-[5]" />
        <Hills />
      </div>

      <div
        data-surface="dark"
        className="relative bg-forest pt-6 pb-[clamp(5rem,4rem+5vw,9rem)] text-center text-ivory"
      >
        <div className="container-page flex flex-col items-center">
          <div
            className="-mt-24 rounded-full ring-1 ring-harvest/50 ring-offset-8 ring-offset-forest sm:-mt-28"
            data-reveal="fade"
          >
            <Logo size={128} sizeClassName="size-24 sm:size-32" />
          </div>
          <RevealHeading
            id="closing-heading"
            className="mt-12 type-display text-ivory"
            lines={site.philosophy.map((word, position) =>
              position === 1 ? (
                <em key={word} className="text-harvest italic">
                  {word}{" "}
                </em>
              ) : (
                `${word} `
              ),
            )}
          />
          <p className="mt-8 max-w-xl type-lead text-ivory/80" data-reveal="fade">
            What reaches your home began as a leaf on our farm — grown, gathered by hand, dried in
            the shade and milled with care.
          </p>
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            data-reveal="fade"
          >
            <LeafButton href="/shop" icon="arrow" size="lg">
              Bring it home
            </LeafButton>
            <LeafButton href="#main" variant="outline" icon="arrow-left">
              Back to the farm
            </LeafButton>
          </div>
        </div>
      </div>
    </section>
  );
}
