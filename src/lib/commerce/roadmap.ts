import { catalogueImages } from "@/content/catalogueImages";
import type { StaticImageData } from "next/image";

import { AVAILABILITY_LABEL, productAvailability, sizeAvailability } from "./availability";
import { isPurchasable } from "./catalog";
import type { FeaturedProduct, Product } from "./types";

/**
 * The homepage product roadmap, derived from the catalogue: the first real
 * product opens the journey, and each pack in preparation follows as its own
 * stop. Nothing here is written by hand — every state comes from the
 * catalogue, and packs without a product page never get a link.
 */

/** Relative image sizes, cycled so neighbouring stops never match. */
export const MILESTONE_SCALES = [1, 0.93, 0.98, 0.9, 0.96] as const;

export interface FeaturedStop {
  step: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  botanicalName: string;
  href: string;
  /** Every distinct availability across its sizes, as customers read it. */
  availability: string[];
  sizesProvisional: boolean;
}

export interface Milestone {
  step: string;
  id: string;
  name: string;
  ingredient: string;
  image: StaticImageData;
  alt: string;
  tone: Product["tone"];
  /** As customers read it, e.g. "In preparation". */
  status: string;
  /** Image on this side, details towards the vein. */
  side: "left" | "right";
  scale: (typeof MILESTONE_SCALES)[number];
}

export interface Roadmap {
  featured: FeaturedStop;
  milestones: Milestone[];
  /** Some size of the wider range can be ordered now. */
  widerOrderable: boolean;
}

const stepLabel = (position: number) => String(position).padStart(2, "0");

export function buildRoadmap(
  featuredProducts: readonly FeaturedProduct[],
  wider: readonly Product[],
): Roadmap {
  const [first] = featuredProducts;
  if (!first) throw new Error("The roadmap needs at least one product to begin with.");

  const featured: FeaturedStop = {
    step: stepLabel(1),
    slug: first.slug,
    name: first.name,
    shortName: first.shortName,
    tagline: first.tagline,
    botanicalName: first.botanicalName,
    href: `/products/${first.slug}`,
    availability: [
      ...new Set(first.variants.map((v) => AVAILABILITY_LABEL[sizeAvailability(first, v)])),
    ],
    sizesProvisional: first.variants.some((variant) => variant.isProvisional),
  };

  const milestones = wider.map((item, index): Milestone => ({
    step: stepLabel(index + 2),
    id: item.id,
    name: item.name,
    ingredient: item.ingredient,
    image: catalogueImages[item.image].src,
    alt: catalogueImages[item.image].alt,
    tone: item.tone,
    status: AVAILABILITY_LABEL[productAvailability(item)],
    side: index % 2 === 0 ? "left" : "right",
    scale: MILESTONE_SCALES[index % MILESTONE_SCALES.length],
  }));

  const widerOrderable = wider.some((item) =>
    item.variants.some((variant) => isPurchasable(item, variant)),
  );
  return { featured, milestones, widerOrderable };
}
