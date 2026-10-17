import { isPriceMinor, MAX_QUANTITY_PER_LINE, MIN_QUANTITY } from "./cart";
import {
  DELIVERY_FIELDS,
  validateDelivery,
  type DeliveryDetails,
  type DeliveryErrors,
  type DeliveryInput,
} from "./delivery";
import { MAX_LINES, onlyPricesChanged, resolveCart, type CartIssue } from "./orderLines";
import { INITIAL_ORDER_STATUS, type OrderStatus } from "./orderStatus";
import type { PaymentState } from "./payment";
import { priceOrder, type CommerceRules, type OrderTotals } from "./pricing";
import type { CartLine, Money, Product } from "./types";

/**
 * An order request: what a customer asks for, before anything is confirmed
 * or paid. Built only from the trusted catalogue — the client's names and
 * totals are never read. The one price the client sends is the unit price it
 * showed for each line (`seenPriceMinor`): it is only compared, never used,
 * so nothing is saved at a price the customer did not see.
 *
 * The server computes every amount: unit price × quantity = line total;
 * subtotal + delivery charge + tax = total (`pricing.ts`).
 *
 * Payment is a separate, future step. A request starts `requested` with
 * payment `not-collected` and no payment reference; a payment integration
 * moves it on (see `payment.ts` and `orderStatus.ts`) without changing how
 * carts or requests are built.
 */

export interface OrderRequestLine {
  productSlug: string;
  variantId: string;
  sku: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface OrderRequest {
  /** The order ID customers and the team quote, e.g. SVF-261014-7K3QPA. */
  reference: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  payment: {
    status: PaymentState;
    /** The payment provider's ID once a payment exists; null until then. */
    reference: string | null;
  };
  lines: OrderRequestLine[];
  totals: OrderTotals;
  /** Customer and delivery details, as entered and cleaned. */
  delivery: DeliveryDetails;
  /** Internal team notes; never set by the customer. */
  notes: string | null;
}

/** What the browser sends. Everything in it is untrusted. */
export interface OrderRequestInput {
  lines: (CartLine & { seenPriceMinor: number })[];
  delivery: DeliveryInput;
}

export type BuildResult =
  | { ok: true; order: OrderRequest }
  | { ok: false; reason: "invalid-request" }
  | { ok: false; reason: "invalid-delivery"; errors: DeliveryErrors }
  | { ok: false; reason: "unavailable-items"; issues: CartIssue[] }
  | { ok: false; reason: "price-changed"; issues: CartIssue[] }
  | { ok: false; reason: "below-minimum"; minimum: Money };

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L

/** e.g. SVF-261014-7K3QPA — date, then 6 random characters from `randomBytes`. */
export function createOrderReference(now: Date, randomBytes: Uint8Array): string {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = Array.from(
    randomBytes.slice(0, 6),
    (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length],
  ).join("");
  return `SVF-${date}-${suffix}`;
}

export const REFERENCE_PATTERN = /^SVF-\d{6}-[2-9A-HJKMNP-Z]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Checks the shape of an untrusted request body; null when it is not one. */
export function parseOrderRequestInput(body: unknown): OrderRequestInput | null {
  if (!isRecord(body) || !Array.isArray(body.lines) || !isRecord(body.delivery)) return null;
  if (body.lines.length === 0 || body.lines.length > MAX_LINES) return null;
  const lines: OrderRequestInput["lines"] = [];
  for (const entry of body.lines) {
    if (!isRecord(entry)) return null;
    const { productSlug, variantId, quantity, seenPriceMinor } = entry;
    if (typeof productSlug !== "string" || typeof variantId !== "string") return null;
    if (!isPriceMinor(seenPriceMinor)) return null;
    if (productSlug.length > 80 || variantId.length > 80) return null;
    if (
      !Number.isInteger(quantity) ||
      (quantity as number) < MIN_QUANTITY ||
      (quantity as number) > MAX_QUANTITY_PER_LINE
    ) {
      return null;
    }
    lines.push({ productSlug, variantId, quantity: quantity as number, seenPriceMinor });
  }
  const delivery = Object.fromEntries(
    DELIVERY_FIELDS.map((field) => {
      const value = (body.delivery as Record<string, unknown>)[field];
      return [field, typeof value === "string" ? value.slice(0, 500) : ""];
    }),
  ) as DeliveryInput;
  return { lines, delivery };
}

/**
 * Merges repeated product/size lines, so one request lists each once. Null
 * when repeats disagree on the price they were shown at.
 */
function mergeLines(lines: OrderRequestInput["lines"]): CartLine[] | null {
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.productSlug}:${line.variantId}`;
    const existing = merged.get(key);
    if (existing && existing.seenPriceMinor !== line.seenPriceMinor) return null;
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + line.quantity } : line);
  }
  return [...merged.values()];
}

/** What we tell a customer whose PIN code is outside every configured delivery zone. */
export const NOT_DELIVERABLE = "We do not deliver to this PIN code yet.";

export function buildOrderRequest(
  input: OrderRequestInput,
  catalogue: readonly Product[],
  reference: string,
  now: Date,
  rules: CommerceRules,
): BuildResult {
  const lines = mergeLines(input.lines);
  if (!lines || lines.some((line) => line.quantity > MAX_QUANTITY_PER_LINE))
    return { ok: false, reason: "invalid-request" };

  const delivery = validateDelivery(input.delivery);
  if (!delivery.ok) return { ok: false, reason: "invalid-delivery", errors: delivery.errors };

  const resolved = resolveCart({ lines }, catalogue);
  if (!resolved.orderable || !resolved.subtotal) {
    return {
      ok: false,
      reason: onlyPricesChanged(resolved) ? "price-changed" : "unavailable-items",
      issues: resolved.issues,
    };
  }

  const priced = priceOrder(resolved.subtotal, delivery.value.pinCode, rules);
  if (!priced.ok) {
    if (priced.reason === "not-deliverable") {
      return { ok: false, reason: "invalid-delivery", errors: { pinCode: NOT_DELIVERABLE } };
    }
    return { ok: false, reason: "below-minimum", minimum: priced.minimum };
  }

  const timestamp = now.toISOString();
  return {
    ok: true,
    order: {
      reference,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: INITIAL_ORDER_STATUS,
      payment: { status: "not-collected", reference: null },
      lines: resolved.lines.map((line) => ({
        productSlug: line.productSlug,
        variantId: line.variantId,
        sku: line.sku,
        productName: line.productName,
        variantLabel: line.variantLabel,
        quantity: line.quantity,
        unitPrice: line.unitPrice!,
        lineTotal: line.lineTotal!,
      })),
      totals: priced.totals,
      delivery: delivery.value,
      notes: null,
    },
  };
}
