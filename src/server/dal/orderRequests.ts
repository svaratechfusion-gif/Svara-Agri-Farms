import "server-only";

import { and, asc, desc, eq, lt, sql } from "drizzle-orm";

import type { OrderRequest } from "@/lib/commerce/orderRequest";
import { transitionOrder, type OrderStatus } from "@/lib/commerce/orderStatus";
import type { Money } from "@/lib/commerce/types";
import {
  DuplicateSubmission,
  hashKey,
  ReferenceTaken,
  type OrderRequestStore,
} from "@/lib/commerce/server/orderRequestStore";
import type { Database } from "@/server/db/client";
import {
  customers,
  orderEvents,
  orderRequestLines,
  orderRequests,
  productVariants,
} from "@/server/db/schema";

/**
 * Orders in PostgreSQL — the store the order API writes to, and the reads and
 * status changes an admin dashboard will use.
 *
 * A request, its lines, the customer and the first history event are written
 * in one transaction, so a failure leaves nothing half-saved. The database's
 * unique indexes do the deduplication: a reused submission key or a reference
 * collision is refused there, even between two server instances.
 */

/** Who records a request's first event. */
export const CUSTOMER_ACTOR = "customer";

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

/** The Postgres error code and constraint, wherever the driver nested them. */
function postgresError(error: unknown): { code?: string; constraint?: string } {
  let current: unknown = error;
  while (current instanceof Error) {
    const named = current as Error & { code?: unknown; constraint?: unknown };
    if (typeof named.code === "string" && /^[0-9A-Z]{5}$/.test(named.code)) {
      return {
        code: named.code,
        constraint: typeof named.constraint === "string" ? named.constraint : undefined,
      };
    }
    current = current.cause;
  }
  return {};
}

const minor = (value: Money | null) => (value === null ? null : value.amountMinor);

async function insertOrder(db: Database, order: OrderRequest, keyHash: string): Promise<void> {
  const createdAt = new Date(order.createdAt);
  const { totals } = order;
  await db.transaction(async (tx) => {
    // One customer per phone number. The first name kept stays: someone else
    // typing that number never rewrites it (each request keeps its own copy).
    const [customer] = await tx
      .insert(customers)
      .values({
        fullName: order.delivery.fullName,
        phone: order.delivery.phone,
        email: order.delivery.email,
      })
      .onConflictDoUpdate({ target: customers.phone, set: { updatedAt: sql`now()` } })
      .returning({ id: customers.id });

    const [saved] = await tx
      .insert(orderRequests)
      .values({
        reference: order.reference,
        customerId: customer.id,
        deliveryAddress: order.delivery,
        subtotalMinor: totals.subtotal.amountMinor,
        deliveryChargeMinor: minor(totals.deliveryCharge),
        taxMinor: minor(totals.tax),
        taxIncluded: totals.taxIncluded,
        totalMinor: totals.total.amountMinor,
        currency: totals.total.currency,
        status: order.status,
        paymentStatus: order.payment.status,
        paymentReference: order.payment.reference,
        notes: order.notes,
        submissionKeyHash: keyHash,
        createdAt,
        updatedAt: new Date(order.updatedAt),
      })
      .returning({ id: orderRequests.id });

    await tx.insert(orderRequestLines).values(
      order.lines.map((line) => ({
        orderRequestId: saved.id,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPriceMinor: line.unitPrice.amountMinor,
        productNameSnapshot: line.productName,
        sizeLabelSnapshot: line.variantLabel,
        skuSnapshot: line.sku,
      })),
    );

    await tx.insert(orderEvents).values({
      orderRequestId: saved.id,
      fromStatus: null,
      toStatus: order.status,
      actor: CUSTOMER_ACTOR,
      createdAt,
    });
  });
}

type OrderRow = typeof orderRequests.$inferSelect;

async function toOrder(db: Database, row: OrderRow): Promise<OrderRequest> {
  const lines = await db
    .select({
      productSlug: productVariants.productSlug,
      variantId: orderRequestLines.variantId,
      sku: orderRequestLines.skuSnapshot,
      productName: orderRequestLines.productNameSnapshot,
      variantLabel: orderRequestLines.sizeLabelSnapshot,
      quantity: orderRequestLines.quantity,
      unitPriceMinor: orderRequestLines.unitPriceMinor,
    })
    .from(orderRequestLines)
    .innerJoin(productVariants, eq(productVariants.id, orderRequestLines.variantId))
    .where(eq(orderRequestLines.orderRequestId, row.id))
    .orderBy(asc(productVariants.productSlug), asc(orderRequestLines.variantId));

  const money = (amountMinor: number): Money => ({ amountMinor, currency: row.currency });
  const maybe = (amountMinor: number | null) => (amountMinor === null ? null : money(amountMinor));
  return {
    reference: row.reference,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status,
    payment: { status: row.paymentStatus, reference: row.paymentReference },
    lines: lines.map(({ unitPriceMinor, sku, ...line }) => ({
      ...line,
      sku: sku ?? "",
      unitPrice: money(unitPriceMinor),
      lineTotal: money(unitPriceMinor * line.quantity),
    })),
    totals: {
      subtotal: money(row.subtotalMinor),
      deliveryCharge: maybe(row.deliveryChargeMinor),
      tax: maybe(row.taxMinor),
      taxIncluded: row.taxIncluded,
      total: money(row.totalMinor),
      isFinal: row.deliveryChargeMinor !== null && row.taxMinor !== null,
    },
    delivery: row.deliveryAddress,
    notes: row.notes,
  };
}

async function findOne(db: Database, where: ReturnType<typeof eq>): Promise<OrderRequest | null> {
  const [row] = await db.select().from(orderRequests).where(where).limit(1);
  return row ? toOrder(db, row) : null;
}

export function createDatabaseOrderRequestStore(db: Database): OrderRequestStore {
  return {
    async save(order, idempotencyKey) {
      const keyHash = hashKey(idempotencyKey);
      try {
        await insertOrder(db, order, keyHash);
      } catch (error) {
        const { code, constraint } = postgresError(error);
        if (code === UNIQUE_VIOLATION && constraint === "order_requests_reference_key") {
          throw new ReferenceTaken(order.reference);
        }
        if (code === UNIQUE_VIOLATION && constraint === "order_requests_submission_key_hash_key") {
          const first = await findOne(db, eq(orderRequests.submissionKeyHash, keyHash));
          throw new DuplicateSubmission(first?.reference ?? "");
        }
        if (code === FOREIGN_KEY_VIOLATION && constraint?.includes("variant_id")) {
          throw new Error(
            "A size in this request is missing from product_variants — run `npm run db:seed`",
            { cause: error },
          );
        }
        throw error;
      }
    },
    findByIdempotencyKey(idempotencyKey) {
      return findOne(db, eq(orderRequests.submissionKeyHash, hashKey(idempotencyKey)));
    },
  };
}

/* ---- For the admin dashboard (not exposed on any route yet) ---------------- */

export function findOrderByReference(db: Database, reference: string) {
  return findOne(db, eq(orderRequests.reference, reference));
}

export const ORDER_PAGE_MAX = 100;

/**
 * Newest first, optionally one status, in pages: pass the last order's
 * `createdAt` as `before` for the next page.
 */
export async function listOrders(
  db: Database,
  options: { status?: OrderStatus; before?: Date; limit?: number } = {},
): Promise<OrderRequest[]> {
  const limit = Math.min(Math.max(1, options.limit ?? 25), ORDER_PAGE_MAX);
  const conditions = [
    options.status ? eq(orderRequests.status, options.status) : undefined,
    options.before ? lt(orderRequests.createdAt, options.before) : undefined,
  ].filter((condition) => condition !== undefined);
  const rows = await db
    .select()
    .from(orderRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orderRequests.createdAt))
    .limit(limit);
  return Promise.all(rows.map((row) => toOrder(db, row)));
}

export type StatusChange =
  | { ok: true; order: OrderRequest }
  | { ok: false; reason: "not-found" | "not-allowed" | "payment-not-verified" };

/**
 * Moves an order to `to` if `orderStatus.ts` allows it, recording who did it
 * in `order_events` — both in one transaction, with the row locked so two
 * people changing the same order cannot both succeed. `paid` is refused unless
 * a verified payment already set `payment_status` to `paid`.
 */
export async function changeOrderStatus(
  db: Database,
  change: { reference: string; to: OrderStatus; actor: string; note?: string; now?: Date },
): Promise<StatusChange> {
  const now = change.now ?? new Date();
  const outcome = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(orderRequests)
      .where(eq(orderRequests.reference, change.reference))
      .for("update");
    if (!row) return { ok: false, reason: "not-found" } as const;
    const result = transitionOrder(
      { status: row.status, paymentStatus: row.paymentStatus },
      change.to,
    );
    if (!result.ok) return result;
    await tx
      .update(orderRequests)
      .set({ status: result.status, updatedAt: now })
      .where(eq(orderRequests.id, row.id));
    await tx.insert(orderEvents).values({
      orderRequestId: row.id,
      fromStatus: row.status,
      toStatus: result.status,
      actor: change.actor,
      note: change.note ?? null,
      createdAt: now,
    });
    return { ok: true } as const;
  });
  if (!outcome.ok) return outcome;
  const order = await findOrderByReference(db, change.reference);
  return order ? { ok: true, order } : { ok: false, reason: "not-found" };
}
