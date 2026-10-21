import { catalogue } from "@/content/products";
import { findProductSync, findVariant } from "@/lib/commerce/catalog";
import type { CurrencyCode, Product } from "@/lib/commerce/types";

/**
 * GA4 ecommerce items, built from the catalogue — the one source of product
 * names, sizes and prices. Nothing here names a product or a price itself.
 */

/** The site's only currency; every catalogue price is in it. */
const CURRENCY: CurrencyCode = "INR";

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  /** The catalogue has no categories; the ingredient (e.g. "Moringa leaf") groups products. */
  item_category: string;
  /** The pack size, e.g. "250 g". */
  item_variant: string;
  /** Unit price in rupees; absent while a size has no price. */
  price?: number;
  quantity: number;
  currency?: CurrencyCode;
}

export interface Ecommerce {
  currency: CurrencyCode;
  /** Sum of price × quantity, in rupees. */
  value: number;
  items: AnalyticsItem[];
}

/** A product, size and quantity — a cart line, or what a customer is choosing. */
export interface ItemChoice {
  productSlug: string;
  variantId: string;
  quantity: number;
}

export function analyticsItem(
  choice: ItemChoice,
  entries: readonly Product[] = catalogue,
): AnalyticsItem | null {
  const product = findProductSync(choice.productSlug, entries);
  const variant = product ? findVariant(product, choice.variantId) : null;
  if (!product || !variant) return null;
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.ingredient,
    item_variant: `${variant.weightGrams} g`,
    ...(variant.price && {
      price: variant.price.amountMinor / 100,
      currency: variant.price.currency,
    }),
    quantity: choice.quantity,
  };
}

/** Items for every line the catalogue knows; unknown lines are left out. */
export function analyticsItems(
  choices: readonly ItemChoice[],
  entries: readonly Product[] = catalogue,
): AnalyticsItem[] {
  return choices.flatMap((choice) => analyticsItem(choice, entries) ?? []);
}

export function ecommerceFor(items: AnalyticsItem[]): Ecommerce {
  // Summed in paise, so ₹0.1 + ₹0.2 style float drift never reaches a report.
  const paise = items.reduce(
    (total, item) => total + Math.round((item.price ?? 0) * 100) * item.quantity,
    0,
  );
  return { currency: CURRENCY, value: paise / 100, items };
}
