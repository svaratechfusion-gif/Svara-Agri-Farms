import { sizeAvailability } from "./availability";
import type { SeenPrice } from "./cart";
import { findVariant, isPurchasable } from "./catalog";
import { multiplyMoney, sumMoney } from "./money";
import type { Availability, Cart, Money, Product } from "./types";

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
  sku: string;
  weightGrams: number;
  quantity: number;
  unitPrice: Money | null;
  lineTotal: Money | null;
  /** Has a price and is available to order right now. */
  purchasable: boolean;
  /** How this size reads to the customer now (e.g. "coming-soon"). */
  availability: Availability;
  /** The price the customer last saw, when it differs from `unitPrice`. */
  previousUnitPrice: Money | null;
}

export interface CartIssue {
  productSlug: string;
  variantId: string;
  /** `price-changed`: still orderable, but not at the price the customer saw. */
  reason: "unknown-product" | "not-purchasable" | "price-changed";
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
  return product !== undefined && variant !== null && isPurchasable(product, variant);
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
    const purchasable = isPurchasable(product, variant);
    const priceChanged =
      purchasable &&
      line.seenPriceMinor !== undefined &&
      line.seenPriceMinor !== variant.price!.amountMinor;
    if (!purchasable || priceChanged) {
      issues.push({
        productSlug: line.productSlug,
        variantId: line.variantId,
        reason: purchasable ? "price-changed" : "not-purchasable",
      });
    }
    lines.push({
      productSlug: product.slug,
      variantId: variant.id,
      productName: product.name,
      variantLabel: variant.label,
      sku: variant.sku,
      weightGrams: variant.weightGrams,
      quantity: line.quantity,
      unitPrice: variant.price,
      lineTotal: purchasable && variant.price ? multiplyMoney(variant.price, line.quantity) : null,
      purchasable,
      availability: sizeAvailability(product, variant),
      previousUnitPrice: priceChanged
        ? { amountMinor: line.seenPriceMinor!, currency: variant.price!.currency }
        : null,
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

/** Some lines changed price since the customer saw them; nothing else is wrong. */
export function onlyPricesChanged(resolved: ResolvedCart): boolean {
  return (
    resolved.issues.length > 0 && resolved.issues.every((issue) => issue.reason === "price-changed")
  );
}

/** Today's prices for every orderable line, to record once the customer has read them. */
export function currentPrices(resolved: ResolvedCart): SeenPrice[] {
  return resolved.lines
    .filter((line) => line.purchasable && line.unitPrice)
    .map((line) => ({
      productSlug: line.productSlug,
      variantId: line.variantId,
      priceMinor: line.unitPrice!.amountMinor,
    }));
}
