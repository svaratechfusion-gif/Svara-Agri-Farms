import type {
  Availability,
  FeaturedProduct,
  Money,
  Product,
  ProductVariant,
} from "@/lib/commerce/types";

import { range, type RangeEntry } from "./range";

/**
 * THE PRODUCT CATALOGUE — the one place to set what is sold, in which sizes,
 * at what price, and whether it can be ordered. Cards, product pages, the
 * cart, checkout and the order API all read it; no component needs editing
 * when a product changes state.
 *
 * PRICES live in `STANDARD_PRICES` (one price per pack size, used by every
 * product); give a single size its own price with `size(…, { price: inr(…) })`.
 * AVAILABILITY is set per product (and, if needed, per size): a size can be
 * ordered only when the product and the size are "available" and it has a
 * price. Setting a price never makes anything available by itself.
 * `src/lib/commerce/catalogueRules.ts` refuses a catalogue that breaks the
 * rules (e.g. an available size without a price); a unit test runs it.
 *
 * Prices and availability confirmed by the business on 2026-10-17: every
 * product, 100 g ₹250 and 250 g ₹350, available to order. SKUs follow the
 * business's pattern SVARA-[PRODUCT]-100 / -250 (confirmed 2026-10-18), derived
 * from each product's ID by `skuFor`. Do not add nutrition, health or
 * certification claims here unless they are verified and approved.
 *
 * TODO: VERIFY ORGANIC CLAIM/CERTIFICATION BEFORE PUBLIC LAUNCH.
 * The official logo, and the SVARA seal on every pack, read "100% ORGANIC"
 * and "ORGANIC • HEALTHY • TRUSTED" (and "TRUELY INDIAN"). The seal is the
 * brand mark and is shown unchanged until the designer supplies a corrected
 * one; the site copy makes no organic claim of its own until certification or
 * business documentation is supplied. Do not add organic wording before then.
 */

/** A price in rupees, stored in paise: `inr(249)` is ₹249.00. */
export function inr(rupees: number): Money {
  return { amountMinor: Math.round(rupees * 100), currency: "INR" };
}

/** The pack sizes every product is defined in. */
export const PACK_SIZES_GRAMS = [100, 250] as const;

/** The current price of each pack size, for every product. */
export const STANDARD_PRICES: Readonly<Record<(typeof PACK_SIZES_GRAMS)[number], Money>> = {
  100: inr(250),
  250: inr(350),
};

/**
 * The SKU of one pack size, from its product's ID: `ginger-powder`, 250 g →
 * `SVARA-GINGER-250`; `raw-banana-powder`, 100 g → `SVARA-RAW-BANANA-100`.
 * Deterministic, so a product's SKUs never need typing (or drift).
 */
export function skuFor(productId: string, grams: (typeof PACK_SIZES_GRAMS)[number]): string {
  return `SVARA-${productId.replace(/-powder$/, "").toUpperCase()}-${grams}`;
}

/** One pack size. Its ID is `<product id>-<grams>g`; its SKU comes from `skuFor`. */
function size(
  productId: string,
  grams: (typeof PACK_SIZES_GRAMS)[number],
  overrides: Partial<Pick<ProductVariant, "price" | "availability" | "isProvisional">> = {},
): ProductVariant {
  return {
    id: `${productId}-${grams}g`,
    sku: skuFor(productId, grams),
    weightGrams: grams,
    label: `${grams} g pouch`,
    price: STANDARD_PRICES[grams],
    availability: "available",
    isProvisional: false,
    ...overrides,
  };
}

/** Products with their own page. */
export const products: readonly FeaturedProduct[] = [
  {
    id: "moringa-powder",
    slug: "moringa-powder",
    hasProductPage: true,
    displayOrder: 1,
    availability: "available",
    ingredient: "Moringa leaf",
    tone: "forest",
    image: "moringaPouch",
    name: "SVARA Moringa Powder",
    shortName: "Moringa Powder",
    tagline: "Farm-grown moringa, gathered by hand and milled into a fine green powder.",
    description:
      "Moringa leaves from our farm, plucked by hand, sorted on cloth and dried slowly in the shade before being milled into a fine powder.",
    botanicalName: "Moringa oleifera",
    gallery: ["productPouch", "powderMound", "powderMacro", "leafMacroDew", "leafDriedScatter"],
    variants: [size("moringa-powder", 100), size("moringa-powder", 250)],
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
        body: "Each pouch carries the SVARA mark. Once opened, reseal it and keep it somewhere cool, dry and out of direct light.",
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

type PreviewEntry = RangeEntry & { availability?: Availability };

/**
 * Packs beyond Moringa, shown as cards with their supplied pack shots (sizes,
 * prices and Add to cart on the card); no product page or description exists
 * until approved copy does. The pack shots show no net weight (both sizes
 * use the same picture) and no claims beyond the SVARA seal (see `range.ts`).
 */
function preview(entry: PreviewEntry, displayOrder: number): Product {
  const availability = entry.availability ?? "available";
  return {
    id: entry.id,
    slug: entry.id,
    name: entry.name,
    shortName: entry.name,
    ingredient: entry.ingredient,
    description: null,
    image: entry.image,
    availability,
    displayOrder,
    tone: entry.tone,
    hasProductPage: false,
    variants: PACK_SIZES_GRAMS.map((grams) => size(entry.id, grams, { availability })),
  };
}

/** Every product, in display order — what commerce reads. */
export const catalogue: readonly Product[] = [
  ...products,
  ...range.map((entry, index) => preview(entry, products.length + index + 1)),
].sort((a, b) => a.displayOrder - b.displayOrder);
