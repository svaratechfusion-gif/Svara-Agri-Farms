import type { Product } from "./types";

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKU_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;

/**
 * Everything wrong with a catalogue, as readable sentences; empty when it is
 * sound. Guards the hand-edited `content/products.ts` (a unit test runs it
 * against the real catalogue) and the database seed.
 */
export function catalogueProblems(entries: readonly Product[]): string[] {
  const problems: string[] = [];
  const seen = {
    id: new Set<string>(),
    slug: new Set<string>(),
    size: new Set<string>(),
    sku: new Set<string>(),
    order: new Set<number>(),
  };
  const once = (set: Set<string | number>, value: string | number, what: string) => {
    if (set.has(value)) problems.push(`Duplicate ${what}: ${value}`);
    set.add(value);
  };

  for (const product of entries) {
    once(seen.id, product.id, "product ID");
    once(seen.slug, product.slug, "product slug");
    once(seen.order, product.displayOrder, "display order");
    if (!ID_PATTERN.test(product.id)) problems.push(`Product ID "${product.id}" is not kebab-case`);
    if (product.variants.length === 0) problems.push(`${product.id} has no sizes`);

    for (const variant of product.variants) {
      once(seen.size, variant.id, "size ID");
      once(seen.sku, variant.sku, "SKU");
      if (!ID_PATTERN.test(variant.id)) problems.push(`Size ID "${variant.id}" is not kebab-case`);
      if (!SKU_PATTERN.test(variant.sku)) problems.push(`SKU "${variant.sku}" is malformed`);
      if (!(Number.isInteger(variant.weightGrams) && variant.weightGrams > 0)) {
        problems.push(`${variant.id} has no valid weight`);
      }
      if (variant.price !== null) {
        const { amountMinor } = variant.price;
        if (!(Number.isSafeInteger(amountMinor) && amountMinor > 0)) {
          problems.push(`${variant.id} has an invalid price`);
        }
      }
      if (variant.availability === "available" && variant.price === null) {
        problems.push(`${variant.id} is "available" without a price`);
      }
    }
  }
  return problems;
}
