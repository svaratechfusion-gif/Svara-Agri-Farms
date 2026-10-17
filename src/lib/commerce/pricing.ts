import type { Money } from "./types";

/**
 * Order totals and the business rules behind them: delivery zones and
 * charges, tax (GST) and a minimum order value. Pure, so the browser shows
 * the same totals the server saves — the server's copy is the one that
 * counts. Every rule is optional: an unset rule is "not configured", which
 * is shown as "to be confirmed", never as zero or free.
 *
 * The rules themselves are business data, set in `src/content/commerce.ts`.
 */

export interface DeliveryZone {
  id: string;
  /** Shown to the team, e.g. "Andhra Pradesh". */
  label: string;
  /** PIN codes served, by leading digits, e.g. ["516", "517"]. */
  pinCodePrefixes: readonly string[];
  charge: Money;
  /** Orders whose subtotal reaches this are delivered without charge. */
  freeFrom: Money | null;
}

export interface TaxRule {
  /** e.g. "GST". */
  label: string;
  /** Rate in basis points: 500 = 5%. */
  rateBasisPoints: number;
  /** True when catalogue prices already include it (tax is then shown, not added). */
  pricesIncludeTax: boolean;
}

export interface CommerceRules {
  /** `null` = not configured: no delivery charge is calculated and no PIN code is refused. */
  deliveryZones: readonly DeliveryZone[] | null;
  /** `null` = not configured. */
  tax: TaxRule | null;
  /** `null` = no minimum. */
  minimumOrder: Money | null;
}

export const NO_RULES: CommerceRules = { deliveryZones: null, tax: null, minimumOrder: null };

export interface OrderTotals {
  subtotal: Money;
  /** `null` while no delivery charge can be calculated (rules unset, or PIN not known yet). */
  deliveryCharge: Money | null;
  /** `null` while tax is not configured. */
  tax: Money | null;
  /** True when `tax` is already inside the prices rather than added. */
  taxIncluded: boolean;
  /** Subtotal + known delivery charge + tax added on top. */
  total: Money;
  /** False while the delivery charge or tax is still to be confirmed by the team. */
  isFinal: boolean;
}

export type PricingResult =
  | { ok: true; totals: OrderTotals }
  | { ok: false; reason: "below-minimum"; minimum: Money }
  | { ok: false; reason: "not-deliverable" };

const money = (amountMinor: number, like: Money): Money => ({
  amountMinor,
  currency: like.currency,
});

/** The zone serving this PIN code (longest matching prefix), or null. */
export function deliveryZoneFor(
  pinCode: string,
  zones: readonly DeliveryZone[],
): DeliveryZone | null {
  let best: { zone: DeliveryZone; length: number } | null = null;
  for (const zone of zones) {
    for (const prefix of zone.pinCodePrefixes) {
      if (pinCode.startsWith(prefix) && (!best || prefix.length > best.length)) {
        best = { zone, length: prefix.length };
      }
    }
  }
  return best?.zone ?? null;
}

function deliveryCharge(
  subtotal: Money,
  pinCode: string | null,
  zones: readonly DeliveryZone[] | null,
): Money | null | "not-deliverable" {
  if (zones === null || pinCode === null) return null;
  const zone = deliveryZoneFor(pinCode, zones);
  if (!zone) return "not-deliverable";
  if (zone.freeFrom && subtotal.amountMinor >= zone.freeFrom.amountMinor) return money(0, subtotal);
  return zone.charge;
}

/**
 * Totals for a subtotal the server has already priced. `pinCode` is null
 * before the customer has entered one (in the cart).
 */
export function priceOrder(
  subtotal: Money,
  pinCode: string | null,
  rules: CommerceRules,
): PricingResult {
  if (rules.minimumOrder && subtotal.amountMinor < rules.minimumOrder.amountMinor) {
    return { ok: false, reason: "below-minimum", minimum: rules.minimumOrder };
  }
  const delivery = deliveryCharge(subtotal, pinCode, rules.deliveryZones);
  if (delivery === "not-deliverable") return { ok: false, reason: "not-deliverable" };

  const base = subtotal.amountMinor + (delivery?.amountMinor ?? 0);
  let tax: Money | null = null;
  let added = 0;
  if (rules.tax) {
    const rate = rules.tax.rateBasisPoints;
    if (rules.tax.pricesIncludeTax) {
      tax = money(Math.round((base * rate) / (10_000 + rate)), subtotal);
    } else {
      added = Math.round((base * rate) / 10_000);
      tax = money(added, subtotal);
    }
  }
  return {
    ok: true,
    totals: {
      subtotal,
      deliveryCharge: delivery,
      tax,
      taxIncluded: rules.tax?.pricesIncludeTax ?? false,
      total: money(base + added, subtotal),
      isFinal: delivery !== null && rules.tax !== null,
    },
  };
}

/** Totals for a cart before a PIN code is known, or null when nothing can be priced. */
export function cartTotals(subtotal: Money | null, rules: CommerceRules): PricingResult | null {
  return subtotal ? priceOrder(subtotal, null, rules) : null;
}
