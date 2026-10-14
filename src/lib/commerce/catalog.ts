import { products } from "@/content/products";
import type { Product, ProductVariant } from "./types";

/**
 * Read-only product repository. Today it reads local content; replace the
 * implementation with a commerce backend (Shopify, Medusa, custom API) without
 * changing any call sites.
 */
export interface ProductRepository {
  findAll(): Promise<readonly Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}

export const localProductRepository: ProductRepository = {
  async findAll() {
    return products;
  },
  async findBySlug(slug) {
    return products.find((product) => product.slug === slug) ?? null;
  },
};

/** Synchronous lookup for client UI (cart lines) against bundled data. */
export function findProductSync(slug: string): Product | null {
  return products.find((product) => product.slug === slug) ?? null;
}

export function findVariant(product: Product, variantId: string): ProductVariant | null {
  return product.variants.find((variant) => variant.id === variantId) ?? null;
}

export function isPurchasable(variant: ProductVariant): boolean {
  return variant.availability === "available" && variant.price !== null;
}
