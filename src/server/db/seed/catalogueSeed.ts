import { inArray } from "drizzle-orm";

import { catalogueProblems } from "@/lib/commerce/catalogueRules";
import type { Availability, Product } from "@/lib/commerce/types";

import type { Database } from "../client";
import { productVariants } from "../schema";

export const SEED_ACTOR = "seed";

export interface VariantSeedRow {
  id: string;
  productSlug: string;
  priceMinor: number | null;
  currency: "INR";
  availability: Availability;
  updatedBy: string;
}

/**
 * One row per size in the catalogue (`content/products.ts`), copied as it
 * is: a missing price stays `null` and availability is unchanged, so nothing
 * becomes orderable that is not orderable on the site today. A size of a
 * product that is not available takes the product's state.
 */
export function catalogueSeedRows(catalogue: readonly Product[]): VariantSeedRow[] {
  const problems = catalogueProblems(catalogue);
  if (problems.length > 0) throw new Error(`Catalogue is not valid: ${problems.join("; ")}`);
  const seen = new Set<string>();
  return catalogue.flatMap((product) =>
    product.variants.map((variant) => {
      if (seen.has(variant.id)) throw new Error(`Duplicate variant ID in catalogue: ${variant.id}`);
      seen.add(variant.id);
      if (variant.availability === "available" && variant.price === null) {
        throw new Error(`Variant ${variant.id} is "available" without a price`);
      }
      return {
        id: variant.id,
        productSlug: product.slug,
        priceMinor: variant.price?.amountMinor ?? null,
        currency: variant.price?.currency ?? "INR",
        availability:
          product.availability === "available" ? variant.availability : product.availability,
        updatedBy: SEED_ACTOR,
      };
    }),
  );
}

export interface SeedDifference {
  id: string;
  field: "productSlug" | "priceMinor" | "availability";
  inCatalogue: string | number | null;
  inDatabase: string | number | null;
}

export interface SeedReport {
  /** Sizes added to the database by this run. */
  inserted: string[];
  /** Sizes already in the database, left exactly as they were. */
  kept: string[];
  /** Where a kept size's database values differ from `content/products.ts`. */
  differences: SeedDifference[];
}

const COMPARED_FIELDS = ["productSlug", "priceMinor", "availability"] as const;

/**
 * Adds sizes that are missing from the database and never changes existing
 * ones: once a size is in the database, its price and availability are
 * managed there. Differences are reported instead of overwritten. Stock is
 * not seeded, since no stock figures exist yet.
 */
export async function seedCatalogue(
  db: Database,
  catalogue: readonly Product[],
): Promise<SeedReport> {
  const rows = catalogueSeedRows(catalogue);
  if (rows.length === 0) return { inserted: [], kept: [], differences: [] };

  const inserted = await db
    .insert(productVariants)
    .values(rows)
    .onConflictDoNothing({ target: productVariants.id })
    .returning({ id: productVariants.id });
  const insertedIds = new Set(inserted.map((row) => row.id));

  const keptRows = rows.filter((row) => !insertedIds.has(row.id));
  const stored =
    keptRows.length === 0
      ? []
      : await db
          .select()
          .from(productVariants)
          .where(
            inArray(
              productVariants.id,
              keptRows.map((row) => row.id),
            ),
          );
  const storedById = new Map(stored.map((row) => [row.id, row]));

  const differences = keptRows.flatMap((row) => {
    const current = storedById.get(row.id);
    if (!current) return [];
    return COMPARED_FIELDS.filter((field) => current[field] !== row[field]).map((field) => ({
      id: row.id,
      field,
      inCatalogue: row[field],
      inDatabase: current[field],
    }));
  });

  return {
    inserted: rows.filter((row) => insertedIds.has(row.id)).map((row) => row.id),
    kept: keptRows.map((row) => row.id),
    differences,
  };
}
