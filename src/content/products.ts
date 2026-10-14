import type { Product } from "@/lib/commerce/types";

/**
 * Product catalogue source data.
 *
 * BUSINESS DATA REQUIRED before launch — values marked `isProvisional` are
 * design placeholders (sizes follow the Stitch design; prices are unset):
 *   - confirm pack sizes and net weights
 *   - set prices (in paise) and stock availability
 * Do not add nutrition, health or certification claims here unless they are
 * verified and approved.
 *
 * TODO: VERIFY ORGANIC CLAIM/CERTIFICATION BEFORE PUBLIC LAUNCH.
 * The official logo and pouch artwork read "100% ORGANIC" (and the logo
 * "TRUELY INDIAN"). Those supplied brand assets are shown unchanged, but the
 * site copy makes no organic claim of its own until certification or business
 * documentation is supplied. Do not add organic wording to any copy before then.
 */
export const products: readonly Product[] = [
  {
    slug: "moringa-powder",
    name: "SVARA Moringa Powder",
    shortName: "Moringa Powder",
    tagline: "Farm-grown moringa, gathered by hand and milled into a fine green powder.",
    description:
      "Moringa leaves from our farm, plucked by hand, sorted on cloth and dried slowly in the shade before being milled into a fine powder.",
    botanicalName: "Moringa oleifera",
    gallery: ["productPouch", "powderMound", "powderMacro", "leafMacroDew", "leafDriedScatter"],
    variants: [
      {
        id: "moringa-powder-100g",
        label: "100 g pouch",
        price: null,
        availability: "coming-soon",
        isProvisional: true,
      },
      {
        id: "moringa-powder-250g",
        label: "250 g pouch",
        price: null,
        availability: "coming-soon",
        isProvisional: true,
      },
    ],
    details: [
      {
        id: "ingredient",
        label: "The Ingredient",
        title: "The moringa leaf.",
        body: "Moringa oleifera, grown on our farm. Everything in the pouch begins as a leaf on one of our trees.",
        photo: "leafMacroDew",
      },
      {
        id: "process",
        label: "The Process",
        title: "Harvested, sorted, shade dried, milled.",
        body: "Leaves are gathered by hand, sorted on cloth, spread to dry in a shaded shelter away from direct sun, and then milled into powder.",
        photo: "stageMill",
      },
      {
        id: "pack",
        label: "The Pack",
        title: "Sealed in a SVARA pouch.",
        body: "Each pouch carries the SVARA Farms mark. Once opened, reseal it and keep it somewhere cool, dry and out of direct light.",
        photo: "productPouchWide",
      },
    ],
    howToUse: [
      "Stir a small spoonful into a glass of water.",
      "Blend into a smoothie or a bowl of yoghurt.",
      "Fold into dough, dals or soups at the end of cooking.",
    ],
  },
];
