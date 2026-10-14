import type { Product, ProductVariant } from "../types";

/**
 * A test catalogue. The real one has no prices yet, so tests that need a
 * product that can actually be ordered use this — it never ships.
 */
function variant(overrides: Partial<ProductVariant> & Pick<ProductVariant, "id">): ProductVariant {
  return {
    label: "100 g pouch",
    price: { amountMinor: 24_900, currency: "INR" },
    availability: "available",
    isProvisional: false,
    ...overrides,
  };
}

export const fixtureCatalogue: readonly Product[] = [
  {
    slug: "test-powder",
    name: "Test Powder",
    shortName: "Test Powder",
    tagline: "",
    description: "",
    botanicalName: "Testus",
    gallery: ["productPouch"],
    variants: [
      variant({ id: "test-100g", label: "100 g pouch" }),
      variant({
        id: "test-250g",
        label: "250 g pouch",
        price: { amountMinor: 54_900, currency: "INR" },
      }),
      variant({ id: "test-soon", label: "500 g pouch", price: null, availability: "coming-soon" }),
      variant({ id: "test-sold", label: "1 kg pouch", availability: "sold-out" }),
    ],
    details: [],
    howToUse: [],
  },
];
