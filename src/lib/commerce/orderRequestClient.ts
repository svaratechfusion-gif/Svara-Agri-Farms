import type { DeliveryErrors, DeliveryInput } from "./delivery";
import type { CartIssue } from "./orderLines";
import type { OrderRequest } from "./orderRequest";
import type { CartLine } from "./types";

/**
 * Sending an order request from the browser, and remembering the confirmed
 * one for the confirmation page (this tab only — the server copy is the real
 * record). Every failure becomes a typed outcome; nothing throws.
 */

export type SendError =
  | "not-accepting"
  | "invalid-request"
  | "invalid-delivery"
  | "unavailable-items"
  | "save-failed"
  | "rate-limited"
  | "network";

export type SendResult =
  | { ok: true; order: OrderRequest }
  | { ok: false; error: SendError; errors?: DeliveryErrors; issues?: CartIssue[] };

export const ORDER_REQUESTS_ENDPOINT = "/api/order-requests";
const LAST_ORDER_KEY = "svara.order-request.last";

/** A fresh key per checkout; reused on retry so a request is saved once. */
export function newSubmissionKey(): string {
  return crypto.randomUUID();
}

export async function sendOrderRequest(
  input: { lines: readonly CartLine[]; delivery: DeliveryInput },
  submissionKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetchImpl(ORDER_REQUESTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey },
      body: JSON.stringify({
        lines: input.lines.map(({ productSlug, variantId, quantity }) => ({
          productSlug,
          variantId,
          quantity,
        })),
        delivery: input.delivery,
      }),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (response.status === 429) return { ok: false, error: "rate-limited" };
  try {
    const body = (await response.json()) as SendResult;
    if (body.ok && response.ok && body.order?.reference) return body;
    if (!body.ok && typeof body.error === "string") return body;
  } catch {
    // Not JSON: a proxy error page or similar.
  }
  return { ok: false, error: response.status >= 500 ? "save-failed" : "invalid-request" };
}

let lastOrder: OrderRequest | null = null;

export function rememberOrderRequest(order: OrderRequest): void {
  lastOrder = order;
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Kept in memory for this visit.
  }
}

export function recallOrderRequest(): OrderRequest | null {
  if (lastOrder) return lastOrder;
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    const parsed = raw ? (JSON.parse(raw) as OrderRequest) : null;
    // Cached, so repeated reads return the same object (a stable snapshot).
    lastOrder = parsed?.reference && Array.isArray(parsed.lines) ? parsed : null;
    return lastOrder;
  } catch {
    return null;
  }
}
