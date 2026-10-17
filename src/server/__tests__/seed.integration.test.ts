import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { catalogue } from "@/content/products";
import { fixtureCatalogue } from "@/lib/commerce/__tests__/fixtures";
import type { Product } from "@/lib/commerce/types";
import { listVariantCommercialState } from "@/server/dal/productVariants";
import { productVariants } from "@/server/db/schema";
import { catalogueSeedRows, seedCatalogue, SEED_ACTOR } from "@/server/db/seed/catalogueSeed";

import { createTestDatabase, type TestDatabase } from "./testDatabase";

describe("catalogueSeedRows", () => {
  it("copies every size in the real catalogue as it is, unpriced sizes staying unpriced", () => {
    const rows = catalogueSeedRows(catalogue);
    const expected = catalogue.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        productSlug: product.slug,
        priceMinor: variant.price?.amountMinor ?? null,
        currency: "INR",
        availability: variant.availability,
        updatedBy: SEED_ACTOR,
      })),
    );
    expect(rows).toEqual(expected);
    // Nothing that cannot be ordered on the site becomes orderable here.
    for (const row of rows) {
      if (row.priceMinor === null) expect(row.availability).not.toBe("available");
    }
  });

  it("refuses a duplicate variant ID", () => {
    const duplicate: Product[] = [
      fixtureCatalogue[0],
      {
        ...fixtureCatalogue[0],
        id: "other",
        slug: "other",
        displayOrder: 9,
        variants: [fixtureCatalogue[0].variants[0]],
      },
    ];
    expect(() => catalogueSeedRows(duplicate)).toThrow("Duplicate size ID: test-100g");
  });

  it("gives each size of a product that is not available the product's state", () => {
    const rows = catalogueSeedRows(fixtureCatalogue);
    expect(rows.find((row) => row.id === "test-later-100g")?.availability).toBe("in-preparation");
  });

  it("refuses an available size without a price", () => {
    const broken: Product[] = [
      {
        ...fixtureCatalogue[0],
        variants: [{ ...fixtureCatalogue[0].variants[0], price: null }],
      },
    ];
    expect(() => catalogueSeedRows(broken)).toThrow('test-100g is "available" without a price');
  });
});

describe("seedCatalogue", () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  }, 60_000);

  afterEach(async () => {
    await testDb.close();
  });

  it("adds the real catalogue's sizes with their prices and availability", async () => {
    const report = await seedCatalogue(testDb.db, catalogue);
    const ids = catalogue.flatMap((product) => product.variants.map((variant) => variant.id));
    expect(report).toEqual({ inserted: ids, kept: [], differences: [] });

    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    const state = await listVariantCommercialState(testDb.db);
    expect(
      state
        .map(({ id, price, availability, updatedBy }) => ({ id, price, availability, updatedBy }))
        .sort(byId),
    ).toEqual(
      catalogue
        .flatMap((product) =>
          product.variants.map((variant) => ({
            id: variant.id,
            price: variant.price,
            availability: variant.availability,
            updatedBy: SEED_ACTOR,
          })),
        )
        .sort(byId),
    );
    expect(state.every((row) => row.availability === "available")).toBe(true);
    expect(new Set(state.map((row) => row.price?.amountMinor))).toEqual(new Set([25_000, 35_000]));
  });

  it("copies prices that the catalogue does have", async () => {
    await seedCatalogue(testDb.db, fixtureCatalogue);
    const state = await listVariantCommercialState(testDb.db);
    expect(state.find((row) => row.id === "test-250g")?.price).toEqual({
      amountMinor: 54_900,
      currency: "INR",
    });
    expect(state.find((row) => row.id === "test-soon")?.price).toBeNull();
  });

  it("is safe to run again and never overwrites values managed in the database", async () => {
    await seedCatalogue(testDb.db, fixtureCatalogue);
    await testDb.db
      .update(productVariants)
      .set({ availability: "sold-out", updatedBy: "admin" })
      .where(eq(productVariants.id, "test-100g"));

    const again = await seedCatalogue(testDb.db, fixtureCatalogue);
    expect(again.inserted).toEqual([]);
    expect(again.kept).toEqual([
      "test-100g",
      "test-250g",
      "test-soon",
      "test-sold",
      "test-later-100g",
    ]);
    expect(again.differences).toEqual([
      { id: "test-100g", field: "availability", inCatalogue: "available", inDatabase: "sold-out" },
    ]);
    const [row] = await testDb.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "test-100g"));
    expect(row).toMatchObject({ availability: "sold-out", updatedBy: "admin" });
  });

  it("adds only sizes that are new", async () => {
    await seedCatalogue(testDb.db, catalogue);
    const extra = fixtureCatalogue.map((p) => ({ ...p, displayOrder: p.displayOrder + 100 }));
    const report = await seedCatalogue(testDb.db, [...catalogue, ...extra]);
    expect(report.inserted).toEqual([
      "test-100g",
      "test-250g",
      "test-soon",
      "test-sold",
      "test-later-100g",
    ]);
    expect(report.differences).toEqual([]);
  });

  it("does nothing for an empty catalogue", async () => {
    expect(await seedCatalogue(testDb.db, [])).toEqual({ inserted: [], kept: [], differences: [] });
  });
});
