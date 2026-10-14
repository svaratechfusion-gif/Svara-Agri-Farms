import type { DeliveryErrors } from "../delivery";
import type { CartIssue } from "../orderLines";
import {
  buildOrderRequest,
  createOrderReference,
  parseOrderRequestInput,
  type OrderRequest,
} from "../orderRequest";
import type { Product } from "../types";

import { DuplicateSubmission, ReferenceTaken, type OrderRequestStore } from "./orderRequestStore";

/**
 * Submitting an order request, server side: check the request, re-price it
 * from the trusted catalogue, save it, and only then report success. No
 * payment is taken or implied. Framework-free, so it is tested directly.
 */

export type SubmitError =
  "not-accepting" | "invalid-request" | "invalid-delivery" | "unavailable-items" | "save-failed";

export type SubmitBody =
  | { ok: true; order: OrderRequest }
  | { ok: false; error: SubmitError; errors?: DeliveryErrors; issues?: CartIssue[] };

export interface SubmitResult {
  status: number;
  body: SubmitBody;
}

export interface SubmitDeps {
  catalogue: readonly Product[];
  store: OrderRequestStore | null;
  now: () => Date;
  randomBytes: (size: number) => Uint8Array;
  /** Server-side log for failures (never the customer's details). */
  logError: (message: string, detail?: unknown) => void;
}

export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
const REFERENCE_ATTEMPTS = 3;

const fail = (
  status: number,
  error: SubmitError,
  extra: Partial<SubmitBody> = {},
): SubmitResult => ({
  status,
  body: { ok: false, error, ...extra } as SubmitBody,
});

export async function submitOrderRequest(
  body: unknown,
  idempotencyKey: string | null,
  deps: SubmitDeps,
): Promise<SubmitResult> {
  if (!deps.store) return fail(503, "not-accepting");
  if (!idempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey))
    return fail(400, "invalid-request");

  const input = parseOrderRequestInput(body);
  if (!input) return fail(400, "invalid-request");

  // The same submission again (a retry, a double click): answer with the first.
  const earlier = await deps.store.findByIdempotencyKey(idempotencyKey).catch(() => null);
  if (earlier) return { status: 200, body: { ok: true, order: earlier } };

  for (let attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt += 1) {
    const now = deps.now();
    const built = buildOrderRequest(
      input,
      deps.catalogue,
      createOrderReference(now, deps.randomBytes(6)),
      now,
    );
    if (!built.ok) {
      if (built.reason === "invalid-delivery")
        return fail(422, "invalid-delivery", { errors: built.errors });
      if (built.reason === "unavailable-items")
        return fail(409, "unavailable-items", { issues: built.issues });
      return fail(400, "invalid-request");
    }
    try {
      await deps.store.save(built.order, idempotencyKey);
      return { status: 201, body: { ok: true, order: built.order } };
    } catch (error) {
      if (error instanceof ReferenceTaken) continue;
      if (error instanceof DuplicateSubmission) {
        const first = await deps.store.findByIdempotencyKey(idempotencyKey).catch(() => null);
        if (first) return { status: 200, body: { ok: true, order: first } };
      }
      deps.logError(`Order request ${built.order.reference} could not be saved`, error);
      return fail(500, "save-failed");
    }
  }
  deps.logError("Order request: no free reference after retries");
  return fail(500, "save-failed");
}
