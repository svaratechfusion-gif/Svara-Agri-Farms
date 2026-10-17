"use client";

import { useRef, type ReactNode } from "react";

import { LeafButton, LeafLink } from "@/components/ui/LeafButton";
import { AVAILABILITY_LABEL, productAvailability } from "@/lib/commerce/availability";
import type { FeaturedProduct } from "@/lib/commerce/types";
import { useScrollProgress } from "@/lib/motion/useScrollProgress";

import { CutoutImage } from "./CutoutImage";

interface ProductFilmProps {
  product: FeaturedProduct;
  /** The section heading, rendered inside the scene's copy column. */
  heading: ReactNode;
}

/**
 * The cinematic product reveal, scrubbed by scroll on wide screens: a
 * leaf-shaped window opens onto a forest scene; the powder rises, then the
 * cream SVARA pouch settles upright onto its shadow; fine lines draw from the
 * leaf to the powder to the pouch; the product's name and facts arrive last
 * and hold. The pouch is never rotated more than a few degrees and is fully
 * readable from the middle of the sequence on. On phones and with reduced
 * motion the scene shows its resolved final frame (see `.product-film`).
 */
export function ProductFilm({ product, heading }: ProductFilmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  useScrollProgress(trackRef, { mode: "track" });
  const href = `/products/${product.slug}`;
  const availability = AVAILABILITY_LABEL[productAvailability(product)];

  return (
    <div ref={trackRef} className="product-film relative lg:motion-safe:h-[300vh]">
      <div className="lg:motion-safe:sticky lg:motion-safe:top-[var(--header-height)] lg:motion-safe:flex lg:motion-safe:h-[calc(100vh-var(--header-height))] lg:motion-safe:items-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14">
          <div className="product-film__copy lg:order-2">
            {heading}
            <p className="mt-6 max-w-md type-lead text-ink-soft">{product.tagline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="seed bg-ivory-deep text-earth-ink">{product.botanicalName}</span>
              <span className="seed bg-forest text-ivory">{availability}</span>
              {product.variants.some((variant) => variant.isProvisional) && (
                <span className="seed bg-ivory-deep text-earth-ink">Sizes to be confirmed</span>
              )}
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <LeafButton href={href} icon="arrow" size="lg">
                View product
              </LeafButton>
              <LeafLink href="/shop">Visit the shop</LeafLink>
            </div>
          </div>

          <div
            className="product-film__window relative aspect-[4/5] overflow-hidden leaf-plate bg-forest-deep sm:aspect-[5/4] lg:order-1"
            data-surface="dark"
          >
            {/* Botanical ground: a low sun and two moringa leaves, far and near. */}
            <span
              aria-hidden="true"
              className="product-film__sun absolute inset-0 bg-[radial-gradient(ellipse_62%_55%_at_55%_72%,rgb(232_200_120/0.75),rgb(197_161_90/0.22)_45%,transparent_72%)]"
            />
            <div
              aria-hidden="true"
              className="product-film__far absolute -top-[6%] -left-[10%] w-[58%] opacity-60 blur-[2px]"
            >
              <CutoutImage
                cutout="moringaLeafBranch"
                decorative
                sizes="30vw"
                className="rotate-[28deg]"
              />
            </div>
            <div
              aria-hidden="true"
              className="product-film__near absolute -right-[8%] -bottom-[10%] w-[46%]"
            >
              <CutoutImage
                cutout="moringaLeafBranch"
                decorative
                sizes="26vw"
                className="rotate-[-150deg]"
              />
            </div>

            {/* The ingredient line: leaf → powder → pouch. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 80"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <path
                className="product-film__line"
                d="M14 18 C 22 34, 18 52, 26 66 S 44 74, 54 62"
                pathLength={1}
                fill="none"
                stroke="rgb(232 200 120 / 0.8)"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span className="product-film__tag product-film__tag--leaf absolute top-[14%] left-[6%] seed bg-ivory/90 text-ink">
              The leaf
            </span>
            <span className="product-film__tag product-film__tag--powder absolute bottom-[8%] left-[8%] seed bg-ivory/90 text-ink">
              The powder
            </span>

            <div className="product-film__powder absolute bottom-[8%] left-[18%] w-[34%]">
              <CutoutImage cutout="powderMound" decorative sizes="18vw" />
            </div>

            <div className="product-film__pouch absolute inset-y-[7%] left-[44%] w-[44%]">
              <span
                aria-hidden="true"
                className="absolute inset-x-[10%] bottom-[1%] h-[6%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(5_14_8/0.6),transparent)]"
              />
              <CutoutImage
                cutout="svaraPouch"
                sizes="(min-width: 1024px) 26vw, 50vw"
                className="mx-auto h-full max-w-full"
                imageClassName="drop-shadow-[0_26px_26px_rgb(5_14_8/0.5)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
