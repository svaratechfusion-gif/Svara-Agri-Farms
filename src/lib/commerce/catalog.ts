import { catalogue, products } from "@/content/products";

import { sizeAvailability } from "./availability";
import type { FeaturedProduct, Product, ProductVariant } from "./types";

/**
 * Read-only access to the catalogue. Today it reads `content/products.ts`;
 * a database-backed implementation can replace it without changing callers.
 */
export interface ProductRepository {
  /** Products with their own page. */
  findAll(): Promise<readonly FeaturedProduct[]>;
  findBySlug(slug: string): Promise<FeaturedProduct | null>;
}

export const localProductRepository: ProductRepository = {
  async findAll() {
    return products;
  },
  async findBySlug(slug) {
    return products.find((product) => product.slug === slug) ?? null;
  },
};

/** Any catalogue entry by slug, for client UI (cart lines). */
export function findProductSync(slug: string, entries: readonly Product[] = catalogue) {
  return entries.find((product) => product.slug === slug) ?? null;
}

export function findVariant(product: Product, variantId: string): ProductVariant | null {
  return product.variants.find((variant) => variant.id === variantId) ?? null;
}

/** Can this size be added to a cart and ordered now: available, at product and size, with a price. */
export function isPurchasable(product: Product, variant: ProductVariant): boolean {
  return sizeAvailability(product, variant) === "available" && variant.price !== null;
}
