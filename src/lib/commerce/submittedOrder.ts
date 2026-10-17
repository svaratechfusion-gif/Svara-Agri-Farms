import { ORDER_ID_PATTERN } from "./orderId";
import { MAX_LINES } from "./orderLines";
import type { OrderDetails } from "./orderDetails";
import type { OrderTotals } from "./pricing";
import type { Money } from "./types";

/**
 * The order as it was placed: a fixed copy taken the moment WhatsApp opened
 * with it. The confirmation page shows this copy, never the live cart (which
 * is emptied as the order is placed), so it reads the same on every visit
 * and every refresh. It is kept for the browser session only.
 */

export interface SubmittedLine {
  key: string;
  productName: string;
  sku: string;
  weightGrams: number;
  variantLabel: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface SubmittedOrder {
  orderId: string;
  /** ISO 8601. */
  submittedAt: string;
  customer: OrderDetails;
  lines: SubmittedLine[];
  /** Delivery is `null` while it is still to be confirmed by the team. */
  totals: OrderTotals;
  /** The WhatsApp link the order was opened with, to open it again. */
  whatsappUrl: string;
}

export const SUBMITTED_ORDER_KEY = "svara.submitted-order.v1";

const WHATSAPP_PREFIX = "https://wa.me/";

type Unknown = Record<string, unknown>;

const isRecord = (value: unknown): value is Unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const isMoney = (value: unknown): value is Money =>
  isRecord(value) &&
  value.currency === "INR" &&
  typeof value.amountMinor === "number" &&
  Number.isSafeInteger(value.amountMinor) &&
  value.amountMinor >= 0;
const isMoneyOrNull = (value: unknown) => value === null || isMoney(value);

function isLine(value: unknown): value is SubmittedLine {
  return (
    isRecord(value) &&
    isText(value.key) &&
    isText(value.productName) &&
    isText(value.sku) &&
    isCount(value.weightGrams) &&
    isText(value.variantLabel) &&
    isCount(value.quantity) &&
    isMoney(value.unitPrice) &&
    isMoney(value.lineTotal)
  );
}

function isCustomer(value: unknown): value is OrderDetails {
  if (!isRecord(value)) return false;
  const required = ["fullName", "mobile", "address", "city", "state", "pinCode"];
  const optional = ["landmark", "instructions"];
  return (
    required.every((field) => isText(value[field])) &&
    optional.every((field) => value[field] === null || isText(value[field]))
  );
}

function isTotals(value: unknown): value is OrderTotals {
  return (
    isRecord(value) &&
    isMoney(value.subtotal) &&
    isMoneyOrNull(value.deliveryCharge) &&
    isMoneyOrNull(value.tax) &&
    typeof value.taxIncluded === "boolean" &&
    isMoney(value.total) &&
    typeof value.isFinal === "boolean"
  );
}

/** Restores a placed order from untrusted storage; anything malformed is no order at all. */
export function parseSubmittedOrder(raw: string | null): SubmittedOrder | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const { orderId, submittedAt, customer, lines, totals, whatsappUrl } = value;
  const valid =
    typeof orderId === "string" &&
    ORDER_ID_PATTERN.test(orderId) &&
    typeof submittedAt === "string" &&
    !Number.isNaN(Date.parse(submittedAt)) &&
    isCustomer(customer) &&
    Array.isArray(lines) &&
    lines.length > 0 &&
    lines.length <= MAX_LINES &&
    lines.every(isLine) &&
    isTotals(totals) &&
    // It becomes a link on the page: only ever a WhatsApp one.
    typeof whatsappUrl === "string" &&
    whatsappUrl.startsWith(WHATSAPP_PREFIX);
  if (!valid) return null;
  return { orderId, submittedAt, customer, lines, totals, whatsappUrl };
}

/** The order placed in this browser session, if any. */
export function createSubmittedOrderStore(storage: () => Storage | null) {
  // Also kept in memory, for browsers that refuse session storage.
  let latest: SubmittedOrder | null = null;
  return {
    save(order: SubmittedOrder): void {
      latest = order;
      try {
        storage()?.setItem(SUBMITTED_ORDER_KEY, JSON.stringify(order));
      } catch {
        // Kept in memory for this visit.
      }
    },
    read(): SubmittedOrder | null {
      try {
        return parseSubmittedOrder(storage()?.getItem(SUBMITTED_ORDER_KEY) ?? null) ?? latest;
      } catch {
        return latest;
      }
    },
  };
}

export const submittedOrders = createSubmittedOrderStore(() =>
  typeof window === "undefined" ? null : window.sessionStorage,
);
