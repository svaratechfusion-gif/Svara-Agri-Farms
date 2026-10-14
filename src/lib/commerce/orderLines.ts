import { findVariant, isPurchasable } from "./catalog";
import { multiplyMoney, sumMoney } from "./money";
import type { Cart, Money, Product } from "./types";

/**
 * Pricing and availability: the cart (what the customer chose) read against
 * a catalogue (what is true). The browser uses the bundled catalogue for
 * display; the server re-runs this on the trusted one before saving anything.
 */

/** Distinct product/size lines one order request may hold. */
export const MAX_LINES = 20;

export interface ResolvedLine {
  productSlug: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: Money | null;
  lineTotal: Money | null;
  /** Has a price and is available to order right now. */
  purchasable: boolean;
}

export interface CartIssue {
  productSlug: string;
  variantId: string;
  reason: "unknown-product" | "not-purchasable";
}

export interface ResolvedCart {
  lines: ResolvedLine[];
  issues: CartIssue[];
  itemCount: number;
  /** Sum of the purchasable lines; null when none can be priced. */
  subtotal: Money | null;
  /** Everything in the cart can be ordered, and there is something to order. */
  orderable: boolean;
}

export function canAddToCart(
  catalogue: readonly Product[],
  productSlug: string,
  variantId: string,
): boolean {
  const product = catalogue.find((entry) => entry.slug === productSlug);
  const variant = product ? findVariant(product, variantId) : null;
  return variant !== null && isPurchasable(variant);
}

export function resolveCart(cart: Cart, catalogue: readonly Product[]): ResolvedCart {
  const lines: ResolvedLine[] = [];
  const issues: CartIssue[] = [];

  for (const line of cart.lines) {
    const product = catalogue.find((entry) => entry.slug === line.productSlug);
    const variant = product ? findVariant(product, line.variantId) : null;
    if (!product || !variant) {
      issues.push({
        productSlug: line.productSlug,
        variantId: line.variantId,
        reason: "unknown-product",
      });
      continue;
    }
    const purchasable = isPurchasable(variant);
    if (!purchasable) {
      issues.push({
        productSlug: line.productSlug,
        variantId: line.variantId,
        reason: "not-purchasable",
      });
    }
    lines.push({
      productSlug: product.slug,
      variantId: variant.id,
      productName: product.name,
      variantLabel: variant.label,
      quantity: line.quantity,
      unitPrice: variant.price,
      lineTotal: purchasable && variant.price ? multiplyMoney(variant.price, line.quantity) : null,
      purchasable,
    });
  }

  const priced = lines.filter((line) => line.lineTotal !== null).map((line) => line.lineTotal);
  return {
    lines,
    issues,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal: priced.length > 0 ? sumMoney(priced) : null,
    orderable: lines.length > 0 && lines.length <= MAX_LINES && issues.length === 0,
  };
}
