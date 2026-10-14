"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useRef } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { LeafletMark } from "@/components/botanical/LeafletMark";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { LeafButton } from "@/components/ui/LeafButton";
import { photos } from "@/content/photos";
import { site } from "@/content/site";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

const fadeDelay = (index: number) => ({ "--line": index }) as CSSProperties;

/** Two rolling hills along the foot of the hero, the farm meeting the page. */
function Hills() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="hero-hills pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(3rem,7vw,6.5rem)] w-full"
    >
      <path
        d="M0 70 C 240 20, 480 20, 720 58 S 1200 104, 1440 46 L1440 120 L0 120 Z"
        fill="var(--color-botanical)"
        fillOpacity={0.22}
      />
      <path
        d="M0 96 C 300 58, 560 70, 820 92 S 1260 112, 1440 84 L1440 120 L0 120 Z"
        fill="var(--color-forest)"
      />
    </svg>
  );
}

/**
 * 01 — The Farm. A product-led entrance on warm ivory: the farm landscape as
 * a large window on the right, the cream SVARA pouch standing in front of it,
 * and a quiet serif headline at the left. The window opens and the pouch rises
 * on load (pure CSS, before hydration); on scroll the pouch lifts slightly and
 * the landscape drifts more slowly behind it.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const image = photos.farmHarvestValley;
  useScrollProgress(rootRef, { mode: "exit" });

  return (
    <section
      ref={rootRef}
      aria-labelledby="hero-heading"
      className="hero relative isolate overflow-hidden pt-[var(--header-height)] bg-sun"
    >
      <div className="container-page grid min-h-[calc(100svh-var(--header-height))] items-center gap-y-6 pb-[clamp(4rem,9vw,8rem)] lg:grid-cols-12 lg:gap-x-8">
        <div className="hero-copy relative z-10 pt-10 lg:col-span-5 lg:pt-0">
          <p
            className="hero-fade inline-flex items-center gap-2.5 type-label text-earth-ink"
            style={fadeDelay(0)}
          >
            <span aria-hidden="true" className="text-botanical">
              <LeafletMark variant="filled" size={12} rotate={-30} />
            </span>
            {site.name} · Moringa leaf powder
          </p>
          <RevealHeading
            as="h1"
            id="hero-heading"
            trigger="load"
            className="mt-6 type-display text-forest lg:text-[clamp(3.25rem,1.4rem+3.6vw,5.25rem)]"
            lines={[
              "From the earth.",
              <em key="1" className="text-botanical italic">
                Made with care.
              </em>,
            ]}
          />
          <p className="hero-fade mt-7 max-w-md type-lead text-ink-soft" style={fadeDelay(2)}>
            Moringa from our farm — gathered by hand, dried in the shade and milled into a fine
            green powder for your everyday kitchen.
          </p>
          <div className="hero-fade mt-9 flex flex-wrap items-center gap-3" style={fadeDelay(3)}>
            <LeafButton href="/products/moringa-powder" icon="arrow" size="lg">
              Discover the powder
            </LeafButton>
            <LeafButton href="/journey" variant="outline">
              Follow the leaf
            </LeafButton>
          </div>
          <p className="hero-fade mt-10 type-label text-ink-soft" style={fadeDelay(4)}>
            {site.philosophy.join(" ")}
          </p>
        </div>

        <div className="relative h-[min(118vw,40rem)] lg:col-span-7 lg:h-[min(80svh,50rem)]">
          {/* The farm, framed as a window onto the land. */}
          <div className="hero-window absolute inset-y-[2%] right-[-6%] left-[16%] overflow-hidden leaf-plate lg:right-0 lg:left-[14%]">
            <div className="hero-window__image absolute inset-x-0 -inset-y-[8%]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload
                fetchPriority="high"
                placeholder="blur"
                sizes="(min-width: 1024px) 52vw, 90vw"
                className="object-cover object-[52%_55%]"
              />
            </div>
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(15_42_27/0.35)_100%)]"
            />
            <span className="absolute right-5 bottom-5 seed bg-ivory/90 text-ink">
              The farm at first light
            </span>
          </div>

          {/* The product, standing in front of the land. */}
          <div className="hero-pouch absolute bottom-[-3%] left-[-2%] h-[74%] lg:bottom-[-2%] lg:left-[-6%] lg:h-[82%]">
            <span
              aria-hidden="true"
              className="absolute inset-x-[10%] bottom-[1%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.45),transparent)]"
            />
            <CutoutImage
              cutout="svaraPouch"
              loading="eager"
              placeholder
              sizes="(min-width: 1024px) 30vw, 60vw"
              className="h-full"
              imageClassName="drop-shadow-[0_28px_30px_rgb(24_32_25/0.28)]"
            />
          </div>
        </div>
      </div>
      <Hills />
    </section>
  );
}
