import type { StaticImageData } from "next/image";

import amla from "@/assets/flow/amla-flow.webp";
import apple from "@/assets/flow/apple-flow.webp";
import beetroot from "@/assets/flow/beetroot-flow.webp";
import carrot from "@/assets/flow/carrot-flow.webp";
import garlic from "@/assets/flow/garlic-flow.webp";
import ginger from "@/assets/flow/ginger-flow.webp";
import hibiscus from "@/assets/flow/hibiscus-flow.webp";
import moringa from "@/assets/cutouts/powder-swoosh.webp";

import type { FlowLevel, FlowPlacement } from "@/lib/flow/flowLayout";

export type FlowIngredient =
  "moringa" | "beetroot" | "carrot" | "apple" | "hibiscus" | "amla" | "ginger" | "garlic";

export interface FlowArt {
  src: StaticImageData;
  /**
   * Angle (degrees) of the powder's main flow in the artwork as supplied,
   * measured from its alpha. Positive descends left → right.
   */
  axis: number;
  /** How the art is levelled into its frame — see `FlowLevel`. */
  level: FlowLevel;
}

/**
 * Supplied ingredient powder splashes, used as section transitions. Each file
 * has real alpha (checked: no baked-in checkerboard, subjects near-opaque,
 * soft dust kept as translucency). They were only trimmed of empty margins and
 * re-encoded as WebP; colours, proportions and detail are untouched.
 *
 * The splashes run diagonally (~35–40°), so on the page each is rotated in CSS
 * to within 6° of level — the sweep then reads across the page at a modest
 * height instead of as a tall square. The
 * `level` numbers were measured from each file's alpha (the rotated content's
 * bounds, ignoring the faintest 0.4 % of dust at either end).
 *
 * Moringa reuses the site's existing powder swoosh (`cutouts.powderSwoosh`) —
 * no separate moringa splash was supplied.
 *
 * Decorative only: never captioned, and never placed beside copy about our
 * farm in a way that implies SVARA grows these ingredients.
 */
export const flowArt: Record<FlowIngredient, FlowArt> = {
  moringa: {
    src: moringa,
    axis: 11.6,
    level: { rotate: -5.6, ratio: 0.48, width: 106.44, height: 120.4, left: -2.9, top: -11.81 },
  },
  beetroot: {
    src: beetroot,
    axis: 34.4,
    level: { rotate: -28.4, ratio: 0.5139, width: 89.57, height: 162.79, left: 5.22, top: -30.04 },
  },
  carrot: {
    src: carrot,
    axis: 36.4,
    level: { rotate: -30.4, ratio: 0.5665, width: 89.27, height: 149.14, left: 4.26, top: -22.25 },
  },
  apple: {
    src: apple,
    axis: 37.1,
    level: { rotate: -31.1, ratio: 0.5676, width: 88.9, height: 145.08, left: 5.97, top: -20.35 },
  },
  hibiscus: {
    src: hibiscus,
    axis: 39.5,
    level: { rotate: -33.5, ratio: 0.4933, width: 90.84, height: 173.29, left: 5.29, top: -36.36 },
  },
  amla: {
    src: amla,
    axis: 40.8,
    level: { rotate: -34.8, ratio: 0.4952, width: 87.81, height: 167.95, left: 6.1, top: -33.01 },
  },
  ginger: {
    src: ginger,
    axis: 39.4,
    level: { rotate: -33.4, ratio: 0.5192, width: 86.92, height: 157.4, left: 6.68, top: -29.22 },
  },
  garlic: {
    src: garlic,
    axis: 40.4,
    level: { rotate: -34.4, ratio: 0.5143, width: 87.69, height: 161.51, left: 5.75, top: -32.08 },
  },
};

/**
 * Every divider on the site, in one place, so the editorial rhythm can be read
 * (and tested) at a glance. Each `overlap` is set from the free space measured
 * in the browser at 390–1440px (the neighbouring padding), with a margin to
 * spare; e2e/flow.spec.ts fails if the art ever meets text or a control.
 * Beyond that: direction alternates down each page and from page
 * to page, and colours move warm ↔ green. Each sits at a real narrative turn —
 * mostly where the story opens onto the packs in preparation.
 */
export const flowPlacements = {
  /** Home: the powder leaves "The Ingredient" and leads into the journey. */
  homeIngredient: {
    ingredient: "moringa",
    align: "start",
    overlap: { above: "soft", below: "soft" },
  },
  /** Home: into the product roadmap. */
  homeRange: {
    ingredient: "beetroot",
    align: "end",
    overlap: { above: "none", below: "none" },
  },
  /** /products: from the Moringa showcase to the packs in preparation. */
  productsRange: {
    ingredient: "carrot",
    align: "start",
    overlap: { above: "none", below: "none" },
  },
  /** Product page: from the process to the wider range. */
  productRelated: {
    ingredient: "apple",
    align: "end",
    from: "ivory",
    to: "ivory-deep",
    overlap: { above: "soft", below: "soft" },
  },
  /** /shop: from what can be ordered to what is coming. */
  shopPreparation: {
    ingredient: "ginger",
    align: "start",
    from: "ivory",
    to: "ivory-deep",
    overlap: { above: "none", below: "soft" },
  },
  /** Our Story: from the process to the future of the range. */
  storyFuture: {
    ingredient: "hibiscus",
    align: "end",
    overlap: { above: "none", below: "soft" },
  },
} as const satisfies Record<string, FlowPlacement<FlowIngredient>>;

export type FlowPlacementKey = keyof typeof flowPlacements;
