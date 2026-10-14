import type { StaticImageData } from "next/image";

import type { RangeItem } from "@/content/range";

import { AVAILABILITY_LABEL } from "./availability";
import type { Product } from "./types";

/**
 * The homepage product roadmap, derived from the catalogue: the first real
 * product opens the journey, and each pack in preparation follows as its own
 * stop. Nothing here is written by hand — availability comes from the
 * product's variants, and packs in preparation never get a link or a cart.
 */

/** The only state a pack in `range` can be in (see `content/range.ts`). */
export const IN_PREPARATION = "In preparation";

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
  tone: RangeItem["tone"];
  status: typeof IN_PREPARATION;
  /** Image on this side, details towards the vein. */
  side: "left" | "right";
  scale: (typeof MILESTONE_SCALES)[number];
}

export interface Roadmap {
  featured: FeaturedStop;
  milestones: Milestone[];
}

const stepLabel = (position: number) => String(position).padStart(2, "0");

export function buildRoadmap(
  catalogue: readonly Product[],
  inPreparation: readonly RangeItem[],
): Roadmap {
  const [first] = catalogue;
  if (!first) throw new Error("The roadmap needs at least one product to begin with.");

  const featured: FeaturedStop = {
    step: stepLabel(1),
    slug: first.slug,
    name: first.name,
    shortName: first.shortName,
    tagline: first.tagline,
    botanicalName: first.botanicalName,
    href: `/products/${first.slug}`,
    availability: [...new Set(first.variants.map((v) => AVAILABILITY_LABEL[v.availability]))],
    sizesProvisional: first.variants.some((variant) => variant.isProvisional),
  };

  const milestones = inPreparation.map((item, index): Milestone => ({
    step: stepLabel(index + 2),
    id: item.id,
    name: item.name,
    ingredient: item.ingredient,
    image: item.image,
    alt: item.alt,
    tone: item.tone,
    status: IN_PREPARATION,
    side: index % 2 === 0 ? "left" : "right",
    scale: MILESTONE_SCALES[index % MILESTONE_SCALES.length],
  }));

  return { featured, milestones };
}
