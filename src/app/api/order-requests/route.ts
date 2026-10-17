import { randomBytes } from "node:crypto";

import { commerceRules } from "@/content/commerce";
import { catalogue } from "@/content/products";
import { orderNotifier } from "@/lib/commerce/notifications";
import { orderRequestStoreFromEnv } from "@/lib/commerce/server/configuredStore";
import { createRateLimiter } from "@/lib/commerce/server/rateLimit";
import { clientOf, isSameOrigin } from "@/lib/commerce/server/requestGuards";
import { submitOrderRequest, type SubmitBody } from "@/lib/commerce/server/submitOrderRequest";

/**
 * POST /api/order-requests — receives an order request (no payment).
 *
 * Accepts only same-origin JSON under 16 KB, at most 5 per minute per
 * client, with an `Idempotency-Key` header so a retried or double-clicked
 * submission is saved once. Prices and availability come from the catalogue
 * on the server, never from the request. Saving is switched off unless
 * `ORDER_REQUESTS_STORE` is `database` or `file` (see configuredStore.ts).
 */

const MAX_BODY_BYTES = 16 * 1024;
const allow = createRateLimiter(5, 60_000);
const store = orderRequestStoreFromEnv();

function reply(status: number, body: SubmitBody): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const refuse = (status: number) => reply(status, { ok: false, error: "invalid-request" });

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers)) return refuse(403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return refuse(415);
  }
  if (!allow(clientOf(request.headers))) return refuse(429);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return refuse(413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return refuse(400);
  }

  const result = await submitOrderRequest(body, request.headers.get("idempotency-key"), {
    catalogue,
    rules: commerceRules,
    store,
    notifier: orderNotifier,
    now: () => new Date(),
    randomBytes: (size) => randomBytes(size),
    logError: (message, detail) => console.error(`[order-requests] ${message}`, detail),
  });
  return reply(result.status, result.body);
}
