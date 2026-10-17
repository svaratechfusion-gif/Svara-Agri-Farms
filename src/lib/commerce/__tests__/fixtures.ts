import type { Product, ProductVariant } from "../types";

/**
 * A test catalogue. The real one has no prices yet, so tests that need a
 * product that can actually be ordered use this — it never ships.
 */
function variant(overrides: Partial<ProductVariant> & Pick<ProductVariant, "id">): ProductVariant {
  return {
    sku: `TEST-${overrides.id.toUpperCase()}`,
    weightGrams: 100,
    label: "100 g pouch",
    price: { amountMinor: 24_900, currency: "INR" },
    availability: "available",
    isProvisional: false,
    ...overrides,
  };
}

const base = {
  shortName: "",
  ingredient: "Test leaf",
  description: null,
  image: "moringaPouch",
  tone: "forest",
  hasProductPage: false,
} as const;

export const fixtureCatalogue: readonly Product[] = [
  {
    ...base,
    id: "test-powder",
    slug: "test-powder",
    name: "Test Powder",
    shortName: "Test Powder",
    availability: "available",
    displayOrder: 1,
    variants: [
      variant({ id: "test-100g", label: "100 g pouch" }),
      variant({
        id: "test-250g",
        label: "250 g pouch",
        weightGrams: 250,
        price: { amountMinor: 54_900, currency: "INR" },
      }),
      variant({ id: "test-soon", label: "500 g pouch", price: null, availability: "coming-soon" }),
      variant({ id: "test-sold", label: "1 kg pouch", availability: "sold-out" }),
    ],
  },
  {
    // In preparation as a whole: even its priced, "available" size cannot be ordered.
    ...base,
    id: "test-later",
    slug: "test-later",
    name: "Later Powder",
    availability: "in-preparation",
    displayOrder: 2,
    variants: [variant({ id: "test-later-100g" })],
  },
];
