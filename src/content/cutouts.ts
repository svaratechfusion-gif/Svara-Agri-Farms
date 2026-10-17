import type { StaticImageData } from "next/image";

import driedBranch from "@/assets/cutouts/moringa-dried-branch.webp";
import leafSingle from "@/assets/cutouts/leaf-single-cutout.webp";
import moringaLeafBranch from "@/assets/cutouts/moringa-leaf-branch.webp";
import powderMound from "@/assets/cutouts/moringa-powder-mound.webp";
import powderSwoosh from "@/assets/cutouts/powder-swoosh.webp";
import svaraPouch from "@/assets/cutouts/svara-moringa-pouch.webp";

export interface Cutout {
  src: StaticImageData;
  /** Empty for purely decorative layers. */
  alt: string;
}

/**
 * Isolated images with real alpha transparency (verified: subjects at near-full
 * opacity, thin anti-aliased edges, no matte or checkerboard). Trimmed of empty
 * margins and re-encoded as WebP; originals are kept outside the project.
 *
 * These are generated illustrations, used for composition, not as evidence of
 * a process or facility.
 */
export const cutouts = {
  /** A whole compound moringa leaf: rachis, paired leaflets, terminal leaflet. */
  moringaLeafBranch: {
    src: moringaLeafBranch,
    alt: "A single compound moringa leaf: a slender stem with pairs of small, rounded leaflets and one leaflet at its tip.",
  },
  /**
   * A single large leaf whose species is not identifiable from the image. Used
   * only as an out-of-focus depth layer, never labelled as moringa.
   */
  leafSingle: { src: leafSingle, alt: "" },
  /**
   * The SVARA pouch — cream packaging, the chosen direction. Retouched on
   * 2026-10-18: the printed "NET WT. 250 g" (both sizes are sold) and the
   * unverified claims ("Rich in natural nutrients", "Plant based",
   * "Sustainably farmed", "No additives") were removed. The seal's "100%
   * ORGANIC" remains until the designer supplies a corrected mark; none of it
   * is repeated in site copy, metadata or structured data (README → Before launch).
   */
  svaraPouch: {
    src: svaraPouch,
    alt: "The SVARA Moringa Leaf Powder pouch, cream with the circular SVARA seal, beside a wooden bowl of green powder and fresh moringa leaves.",
  },
  powderMound: {
    src: powderMound,
    alt: "A soft mound of fine green moringa powder.",
  },
  /**
   * A sweep of green powder with scattered leaves. The leaves are generic (not
   * identifiable as moringa), so it is used only as an atmospheric layer —
   * never captioned as moringa, never in place of the standalone powder mound.
   */
  /**
   * A shade-dried moringa branch, taken off its white studio ground by a
   * colour-to-alpha pass (its soft shadow kept as translucency). For light
   * grounds only — on forest the paler leaflets read as translucent.
   */
  driedBranch: {
    src: driedBranch,
    alt: "A shade-dried moringa branch, its leaflets curled and darkened.",
  },
  powderSwoosh: {
    src: powderSwoosh,
    alt: "",
  },
} satisfies Record<string, Cutout>;

export type CutoutKey = keyof typeof cutouts;
