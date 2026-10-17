import { describe, expect, it } from "vitest";

import {
  catalogue,
  inr,
  PACK_SIZES_GRAMS,
  products,
  skuFor,
  STANDARD_PRICES,
} from "@/content/products";
import { formatMoney } from "@/lib/commerce/money";

import {
  AVAILABILITY_LABEL,
  AVAILABILITY_NOTE,
  productAvailability,
  sizeAvailability,
} from "../availability";
import { canAddToCart } from "../orderLines";
import { catalogueProblems } from "../catalogueRules";
import type { Product } from "../types";
import { fixtureCatalogue } from "./fixtures";

describe("the real catalogue", () => {
  it("passes every catalogue rule", () => {
    expect(catalogueProblems(catalogue)).toEqual([]);
  });

  it("lists every product once, in display order, Moringa first", () => {
    const orders = catalogue.map((product) => product.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(catalogue[0].id).toBe("moringa-powder");
    expect(catalogue).toHaveLength(12);
  });

  it("defines every product in 100 g and 250 g, each with its own ID, SKU and weight", () => {
    for (const product of catalogue) {
      expect(product.variants.map((v) => v.weightGrams)).toEqual([...PACK_SIZES_GRAMS]);
      for (const variant of product.variants) {
        expect(variant.id).toBe(`${product.id}-${variant.weightGrams}g`);
        expect(variant.sku).toBe(skuFor(product.id, variant.weightGrams as 100 | 250));
        expect(variant.sku).toMatch(new RegExp(`^SVARA-[A-Z]+(-[A-Z]+)*-${variant.weightGrams}$`));
      }
    }
  });

  it("prices every 100 g pouch at ₹250 and every 250 g pouch at ₹350, from one table", () => {
    expect(STANDARD_PRICES).toEqual({ 100: inr(250), 250: inr(350) });
    expect(inr(250)).toEqual({ amountMinor: 25_000, currency: "INR" });
    for (const product of catalogue) {
      const [small, large] = product.variants;
      expect(small.price, product.id).toEqual(inr(250));
      expect(large.price, product.id).toEqual(inr(350));
      expect(formatMoney(small.price!)).toBe("₹250");
      expect(formatMoney(large.price!)).toBe("₹350");
    }
  });

  it("opens every size of every product for ordering, as the business decided", () => {
    for (const product of catalogue) {
      for (const variant of product.variants) {
        expect(variant.isProvisional).toBe(false);
        expect(canAddToCart(catalogue, product.slug, variant.id)).toBe(true);
      }
    }
  });

  it("lists every product as available; only Moringa has its own page", () => {
    expect(productAvailability(catalogue[0])).toBe("available");
    for (const product of catalogue.slice(1)) {
      expect(productAvailability(product)).toBe("available");
      expect(product.hasProductPage).toBe(false);
      expect(product.description).toBeNull();
    }
  });

  it("gives a product page only to products with full editorial content", () => {
    expect(products.map((p) => p.id)).toEqual(
      catalogue.filter((p) => p.hasProductPage).map((p) => p.id),
    );
  });
});

describe("inr", () => {
  it("stores rupees as whole paise", () => {
    expect(inr(249)).toEqual({ amountMinor: 24_900, currency: "INR" });
    expect(inr(12.5)).toEqual({ amountMinor: 1_250, currency: "INR" });
  });
});

describe("catalogueProblems", () => {
  const [good] = fixtureCatalogue;
  const withSize = (overrides: Partial<Product["variants"][number]>): Product => ({
    ...good,
    variants: [{ ...good.variants[0], ...overrides }],
  });

  it("names each problem", () => {
    expect(catalogueProblems([withSize({ price: null })])).toEqual([
      'test-100g is "available" without a price',
    ]);
    expect(catalogueProblems([withSize({ price: inr(0) })])).toEqual([
      "test-100g has an invalid price",
    ]);
    expect(catalogueProblems([withSize({ price: { amountMinor: 1.5, currency: "INR" } })])).toEqual(
      ["test-100g has an invalid price"],
    );
    expect(catalogueProblems([withSize({ weightGrams: 0 })])).toEqual([
      "test-100g has no valid weight",
    ]);
    expect(catalogueProblems([withSize({ sku: "bad sku" })])).toEqual([
      'SKU "bad sku" is malformed',
    ]);
    expect(catalogueProblems([withSize({ id: "Bad_ID" })])).toEqual([
      'Size ID "Bad_ID" is not kebab-case',
    ]);
    expect(catalogueProblems([{ ...good, variants: [] }])).toEqual(["test-powder has no sizes"]);
  });

  it("finds duplicates across products", () => {
    expect(catalogueProblems([good, good])).toEqual(
      expect.arrayContaining([
        "Duplicate product ID: test-powder",
        "Duplicate product slug: test-powder",
        "Duplicate display order: 1",
        "Duplicate size ID: test-100g",
        "Duplicate SKU: TEST-TEST-100G",
      ]),
    );
  });
});

describe("availability", () => {
  const [open, later] = fixtureCatalogue;

  it("labels and explains every state", () => {
    expect(AVAILABILITY_LABEL).toEqual({
      available: "Available",
      "coming-soon": "Coming soon",
      "in-preparation": "In preparation",
      "sold-out": "Sold out",
    });
    for (const note of Object.values(AVAILABILITY_NOTE)) expect(note.length).toBeGreaterThan(10);
  });

  it("lets a product that is not available decide for all its sizes", () => {
    expect(sizeAvailability(later, later.variants[0])).toBe("in-preparation");
    expect(productAvailability(later)).toBe("in-preparation");
  });

  it("calls an available size without a price only coming soon", () => {
    const unpriced = { ...open.variants[0], price: null };
    expect(sizeAvailability(open, unpriced)).toBe("coming-soon");
  });

  it("reads a product as available when any size can be ordered", () => {
    expect(productAvailability(open)).toBe("available");
    const allSold: Product = {
      ...open,
      variants: open.variants.map((v) => ({ ...v, availability: "sold-out" as const })),
    };
    expect(productAvailability(allSold)).toBe("sold-out");
  });
});

describe("the confirmed catalogue (2026-10-18)", () => {
  const POWDERS: [string, string][] = [
    ["Beetroot Powder", "BEETROOT"],
    ["Carrot Powder", "CARROT"],
    ["Apple Powder", "APPLE"],
    ["Garlic Powder", "GARLIC"],
    ["Onion Powder", "ONION"],
    ["Ginger Powder", "GINGER"],
    ["Neem Powder", "NEEM"],
    ["Raw Banana Powder", "RAW-BANANA"],
    ["Hibiscus Leaf Powder", "HIBISCUS-LEAF"],
    ["Hibiscus Flower Powder", "HIBISCUS-FLOWER"],
    ["Amla Powder", "AMLA"],
  ];

  it("holds the 11 powders, by name, plus SVARA Moringa Powder — nothing else", () => {
    expect(catalogue.map((product) => product.name)).toEqual([
      "SVARA Moringa Powder",
      ...POWDERS.map(([name]) => name),
    ]);
  });

  it("gives each exactly two variants, 100 g at ₹250 and 250 g at ₹350, with unique SKUs", () => {
    const rows = catalogue.map((product) =>
      product.variants.map((variant) => [variant.sku, variant.weightGrams, variant.price]),
    );
    expect(rows).toEqual(
      [["SVARA Moringa Powder", "MORINGA"] as [string, string], ...POWDERS].map(([, code]) => [
        [`SVARA-${code}-100`, 100, inr(250)],
        [`SVARA-${code}-250`, 250, inr(350)],
      ]),
    );
    const skus = rows.flat().map(([sku]) => sku);
    expect(new Set(skus).size).toBe(skus.length);
    expect(skus).toHaveLength(24);
  });
});
