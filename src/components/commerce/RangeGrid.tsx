import { catalogueImages } from "@/content/catalogueImages";
import Image from "next/image";

import { catalogue } from "@/content/products";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_NOTE,
  productAvailability,
} from "@/lib/commerce/availability";
import { isPurchasable } from "@/lib/commerce/catalog";
import type { Product } from "@/lib/commerce/types";

import { PurchaseControls } from "./PurchaseControls";

/** Catalogue entries without their own page: the wider range. */
export const rangeProducts = catalogue.filter((product) => !product.hasProductPage);

const ARC_TONE: Record<Product["tone"], string> = {
  earth:
    "bg-[radial-gradient(circle_at_50%_100%,rgb(197_161_90/0.55)_0%,rgb(197_161_90/0.22)_52%,transparent_72%)]",
  forest:
    "bg-[radial-gradient(circle_at_50%_100%,rgb(92_120_61/0.42)_0%,rgb(92_120_61/0.16)_52%,transparent_72%)]",
};

/**
 * One frame for every packshot (the widest pack's proportions), so packs of
 * different shapes align and none reaches into its card's text. Images are
 * contained, never cropped.
 */
const PACK_FRAME = "1400 / 1105";

function RangeCard({ item }: { item: Product }) {
  const availability = productAvailability(item);
  const orderable = item.variants.some((variant) => isPurchasable(item, variant));
  return (
    <li className="range-card group relative pt-[42%]">
      <span
        aria-hidden="true"
        className={`range-card__arc absolute inset-x-[6%] top-0 mt-[6%] aspect-[2/1] rounded-t-full ${ARC_TONE[item.tone]}`}
      />
      <div className="relative leaf-plate-sm px-4 pt-[46%] pb-5 card-float sm:px-5">
        <h3 className="type-h4 text-forest">{item.name}</h3>
        <p className="mt-1 type-small text-ink-soft">{item.ingredient}</p>
        <p className="mt-4 seed bg-ivory-deep text-earth-ink">{AVAILABILITY_LABEL[availability]}</p>
        {orderable ? (
          <PurchaseControls product={item} layout="compact" />
        ) : (
          <p className="sr-only">{AVAILABILITY_NOTE[availability]}</p>
        )}
      </div>
      <div className="range-card__pack pointer-events-none absolute inset-x-[2%] top-0 mt-[3%]">
        <div className="relative" style={{ aspectRatio: PACK_FRAME }}>
          <Image
            src={catalogueImages[item.image].src}
            alt={catalogueImages[item.image].alt}
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 22vw, 46vw"
            className="object-contain object-bottom drop-shadow-[0_18px_18px_rgb(24_32_25/0.18)]"
          />
        </div>
      </div>
    </li>
  );
}

interface RangeGridProps {
  /** Heading id the list is labelled by. */
  labelledBy: string;
  className?: string;
}

/**
 * The wider range, as catalogue cards: a sun arc tinted from the pack's band,
 * the supplied packshot standing above its card, the name, its ingredient and
 * its availability from the catalogue. A pack that cannot be ordered is a
 * preview; once the catalogue makes a size orderable, the card offers sizes
 * and Add to cart by itself.
 */
export function RangeGrid({ labelledBy, className = "" }: RangeGridProps) {
  // Cards that sell need room for sizes and Add to cart: one column on phones.
  const sells = rangeProducts.some((product) =>
    product.variants.some((variant) => isPurchasable(product, variant)),
  );
  const columns = sells
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-2 lg:grid-cols-4";
  return (
    <ul
      aria-labelledby={labelledBy}
      className={`grid ${columns} gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8 lg:gap-y-14 ${className}`}
      data-reveal="stagger"
    >
      {rangeProducts.map((item) => (
        <RangeCard key={item.id} item={item} />
      ))}
    </ul>
  );
}
