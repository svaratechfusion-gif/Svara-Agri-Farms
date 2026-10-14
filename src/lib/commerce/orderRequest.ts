import { MAX_QUANTITY_PER_LINE, MIN_QUANTITY } from "./cart";
import {
  DELIVERY_FIELDS,
  validateDelivery,
  type DeliveryDetails,
  type DeliveryErrors,
  type DeliveryInput,
} from "./delivery";
import { MAX_LINES, resolveCart, type CartIssue } from "./orderLines";
import type { CartLine, Money, Product } from "./types";

/**
 * An order request: what a customer asks for, before anything is confirmed
 * or paid. Built only from the trusted catalogue — the client's own prices,
 * names or totals are never read.
 *
 * Payment is a separate, future step. A request starts `pending-confirmation`
 * with payment `not-collected`; a payment integration would later move it on
 * (see `payment.ts`), without changing how carts or requests are built.
 */

export type OrderRequestStatus = "pending-confirmation";
export type PaymentStatus = "not-collected";

export interface OrderRequestLine {
  productSlug: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface OrderRequest {
  reference: string;
  createdAt: string;
  status: OrderRequestStatus;
  payment: { status: PaymentStatus };
  lines: OrderRequestLine[];
  /** Products only. Delivery charges, taxes and discounts are not set by the site. */
  productSubtotal: Money;
  delivery: DeliveryDetails;
}

/** What the browser sends. Everything in it is untrusted. */
export interface OrderRequestInput {
  lines: CartLine[];
  delivery: DeliveryInput;
}

export type BuildResult =
  | { ok: true; order: OrderRequest }
  | { ok: false; reason: "invalid-request" }
  | { ok: false; reason: "invalid-delivery"; errors: DeliveryErrors }
  | { ok: false; reason: "unavailable-items"; issues: CartIssue[] };

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
  const lines: CartLine[] = [];
  for (const entry of body.lines) {
    if (!isRecord(entry)) return null;
    const { productSlug, variantId, quantity } = entry;
    if (typeof productSlug !== "string" || typeof variantId !== "string") return null;
    if (productSlug.length > 80 || variantId.length > 80) return null;
    if (
      !Number.isInteger(quantity) ||
      (quantity as number) < MIN_QUANTITY ||
      (quantity as number) > MAX_QUANTITY_PER_LINE
    ) {
      return null;
    }
    lines.push({ productSlug, variantId, quantity: quantity as number });
  }
  const delivery = Object.fromEntries(
    DELIVERY_FIELDS.map((field) => {
      const value = (body.delivery as Record<string, unknown>)[field];
      return [field, typeof value === "string" ? value.slice(0, 500) : ""];
    }),
  ) as DeliveryInput;
  return { lines, delivery };
}

/** Merges repeated product/size lines, so one request lists each once. */
function mergeLines(lines: readonly CartLine[]): CartLine[] {
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.productSlug}:${line.variantId}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + line.quantity } : line);
  }
  return [...merged.values()];
}

export function buildOrderRequest(
  input: OrderRequestInput,
  catalogue: readonly Product[],
  reference: string,
  now: Date,
): BuildResult {
  const lines = mergeLines(input.lines);
  if (lines.some((line) => line.quantity > MAX_QUANTITY_PER_LINE))
    return { ok: false, reason: "invalid-request" };

  const delivery = validateDelivery(input.delivery);
  if (!delivery.ok) return { ok: false, reason: "invalid-delivery", errors: delivery.errors };

  const resolved = resolveCart({ lines }, catalogue);
  if (!resolved.orderable || !resolved.subtotal) {
    return { ok: false, reason: "unavailable-items", issues: resolved.issues };
  }

  return {
    ok: true,
    order: {
      reference,
      createdAt: now.toISOString(),
      status: "pending-confirmation",
      payment: { status: "not-collected" },
      lines: resolved.lines.map((line) => ({
        productSlug: line.productSlug,
        variantId: line.variantId,
        productName: line.productName,
        variantLabel: line.variantLabel,
        quantity: line.quantity,
        unitPrice: line.unitPrice!,
        lineTotal: line.lineTotal!,
      })),
      productSubtotal: resolved.subtotal,
      delivery: delivery.value,
    },
  };
}
