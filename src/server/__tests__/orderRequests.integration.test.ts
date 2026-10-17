import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fixtureCatalogue } from "@/lib/commerce/__tests__/fixtures";
import type { DeliveryInput } from "@/lib/commerce/delivery";
import { NO_RULES } from "@/lib/commerce/pricing";
import { orderRequestStoreFromEnv } from "@/lib/commerce/server/configuredStore";
import { submitOrderRequest, type SubmitDeps } from "@/lib/commerce/server/submitOrderRequest";
import {
  changeOrderStatus,
  createDatabaseOrderRequestStore,
  CUSTOMER_ACTOR,
  findOrderByReference,
  listOrders,
  ORDER_PAGE_MAX,
} from "@/server/dal/orderRequests";
import {
  customers,
  orderEvents,
  orderRequestLines,
  orderRequests,
  productVariants,
} from "@/server/db/schema";
import { seedCatalogue } from "@/server/db/seed/catalogueSeed";

import { createTestDatabase, type TestDatabase } from "./testDatabase";

const delivery: DeliveryInput = {
  fullName: "Lakshmi Rao",
  phone: "98765 43210",
  email: "lakshmi@example.com",
  addressLine1: "12, Temple Street",
  addressLine2: "",
  locality: "Kodur",
  city: "Kadapa",
  state: "Andhra Pradesh",
  pinCode: "516101",
  instructions: "",
};
const body = (
  lines: Record<string, unknown>[] = [
    { productSlug: "test-powder", variantId: "test-100g", quantity: 2, seenPriceMinor: 24_900 },
    { productSlug: "test-powder", variantId: "test-250g", quantity: 1, seenPriceMinor: 54_900 },
  ],
) => ({ lines, delivery });
const NOW = new Date("2026-10-14T09:30:00Z");

describe("order requests in PostgreSQL", () => {
  let testDb: TestDatabase;
  let deps: SubmitDeps;
  let counter: number;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    await seedCatalogue(testDb.db, fixtureCatalogue);
    counter = 0;
    deps = {
      catalogue: fixtureCatalogue,
      rules: NO_RULES,
      store: createDatabaseOrderRequestStore(testDb.db),
      notifier: null,
      now: () => NOW,
      randomBytes: (size) => new Uint8Array(size).fill(counter++),
      logError: vi.fn(),
    };
  }, 60_000);

  afterEach(async () => {
    await testDb.close();
  });

  it("saves the request, its lines, the customer and its first event together", async () => {
    const result = await submitOrderRequest(body(), "submission-key-0001", deps);
    expect(result.status).toBe(201);
    if (!result.body.ok) throw new Error("expected success");
    const { order } = result.body;

    const [saved] = await testDb.db.select().from(orderRequests);
    expect(saved).toMatchObject({
      reference: order.reference,
      subtotalMinor: 104_700,
      currency: "INR",
      status: "requested",
      paymentStatus: "not-collected",
      deliveryAddress: order.delivery,
    });
    // The raw submission key is never stored, only its hash.
    expect(saved.submissionKeyHash).toMatch(/^[0-9a-f]{64}$/);

    const lines = await testDb.db
      .select()
      .from(orderRequestLines)
      .where(eq(orderRequestLines.orderRequestId, saved.id));
    expect(
      lines.map(({ variantId, quantity, unitPriceMinor }) => ({
        variantId,
        quantity,
        unitPriceMinor,
      })),
    ).toEqual(
      expect.arrayContaining([
        { variantId: "test-100g", quantity: 2, unitPriceMinor: 24_900 },
        { variantId: "test-250g", quantity: 1, unitPriceMinor: 54_900 },
      ]),
    );

    expect(await testDb.db.select().from(customers)).toMatchObject([
      { fullName: "Lakshmi Rao", phone: "+919876543210", email: "lakshmi@example.com" },
    ]);
    expect(await testDb.db.select().from(orderEvents)).toMatchObject([
      { fromStatus: null, toStatus: "requested", actor: CUSTOMER_ACTOR },
    ]);
  });

  it("answers a repeated or simultaneous submission with the first, saving it once", async () => {
    const [a, b] = await Promise.all([
      submitOrderRequest(body(), "submission-key-0002", deps),
      submitOrderRequest(body(), "submission-key-0002", deps),
    ]);
    const again = await submitOrderRequest(body(), "submission-key-0002", deps);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(again.status).toBe(200);
    const references = [a, b, again].map((r) => (r.body.ok ? r.body.order.reference : null));
    expect(new Set(references).size).toBe(1);
    expect(await testDb.db.select().from(orderRequests)).toHaveLength(1);
    expect(await testDb.db.select().from(orderRequestLines)).toHaveLength(2);
    // The replay carries the same lines and totals as the original answer.
    const first = [a, b].find((r) => r.status === 201)!;
    if (!first.body.ok || !again.body.ok) throw new Error("expected success");
    expect(again.body.order.totals).toEqual(first.body.order.totals);
    expect(again.body.order.lines).toEqual(
      expect.arrayContaining(first.body.order.lines.map((line) => expect.objectContaining(line))),
    );
  });

  it("keeps one customer per phone number, without rewriting their name", async () => {
    await submitOrderRequest(body(), "submission-key-0003", deps);
    await submitOrderRequest(
      { ...body(), delivery: { ...delivery, fullName: "Someone Else" } },
      "submission-key-0004",
      deps,
    );
    expect(await testDb.db.select().from(orderRequests)).toHaveLength(2);
    expect(await testDb.db.select().from(customers)).toMatchObject([{ fullName: "Lakshmi Rao" }]);
  });

  it("draws a new reference when one is already taken", async () => {
    deps.randomBytes = (size) => new Uint8Array(size).fill(7);
    await submitOrderRequest(body(), "submission-key-0005", deps);
    let calls = 0;
    deps.randomBytes = (size) => new Uint8Array(size).fill(calls++ === 0 ? 7 : 9);
    const second = await submitOrderRequest(body(), "submission-key-0006", deps);
    expect(second.status).toBe(201);
    expect(await testDb.db.select().from(orderRequests)).toHaveLength(2);
  });

  it("leaves nothing behind when part of the save fails", async () => {
    // A size the database does not know (e.g. the seed was not run).
    await testDb.db.delete(productVariants).where(eq(productVariants.id, "test-250g"));
    const result = await submitOrderRequest(body(), "submission-key-0007", deps);
    expect(result).toEqual({ status: 500, body: { ok: false, error: "save-failed" } });
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining("could not be saved"),
      expect.objectContaining({ message: expect.stringContaining("db:seed") }),
    );
    expect(await testDb.db.select().from(orderRequests)).toHaveLength(0);
    expect(await testDb.db.select().from(orderRequestLines)).toHaveLength(0);
    expect(await testDb.db.select().from(customers)).toHaveLength(0);
    expect(await testDb.db.select().from(orderEvents)).toHaveLength(0);
  });

  it("reports an unreachable database as a failed save, never as received", async () => {
    await testDb.close();
    const result = await submitOrderRequest(body(), "submission-key-0008", deps);
    expect(result).toEqual({ status: 500, body: { ok: false, error: "save-failed" } });
    testDb = await createTestDatabase(); // for afterEach
  }, 60_000);
});

describe("managing orders (for the admin dashboard)", () => {
  let testDb: TestDatabase;
  let deps: SubmitDeps;
  let counter: number;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    await seedCatalogue(testDb.db, fixtureCatalogue);
    counter = 0;
    deps = {
      catalogue: fixtureCatalogue,
      rules: NO_RULES,
      store: createDatabaseOrderRequestStore(testDb.db),
      notifier: null,
      now: () => new Date(NOW.getTime() + counter * 60_000),
      randomBytes: (size) => new Uint8Array(size).fill(counter++),
      logError: vi.fn(),
    };
  }, 60_000);

  afterEach(async () => {
    await testDb.close();
  });

  const place = async (key: string) => {
    const result = await submitOrderRequest(body(), key, deps);
    if (!result.body.ok) throw new Error("expected success");
    return result.body.order.reference;
  };

  it("finds an order by reference with everything an admin needs", async () => {
    const reference = await place("submission-key-1001");
    const order = await findOrderByReference(testDb.db, reference);
    expect(order).toMatchObject({
      reference,
      status: "requested",
      payment: { status: "not-collected", reference: null },
      notes: null,
      totals: { subtotal: { amountMinor: 104_700 }, deliveryCharge: null, tax: null },
      delivery: { fullName: "Lakshmi Rao", phone: "+919876543210" },
    });
    expect(order?.lines.map((line) => [line.sku, line.variantLabel, line.quantity])).toEqual([
      ["TEST-TEST-100G", "100 g pouch", 2],
      ["TEST-TEST-250G", "250 g pouch", 1],
    ]);
    expect(await findOrderByReference(testDb.db, "SVF-000000-ZZZZZZ")).toBeNull();
  });

  it("lists newest first, by status, in bounded pages", async () => {
    const first = await place("submission-key-2001");
    const second = await place("submission-key-2002");
    const all = await listOrders(testDb.db);
    expect(all.map((order) => order.reference)).toEqual([second, first]);
    expect((await listOrders(testDb.db, { limit: 1 })).map((o) => o.reference)).toEqual([second]);
    const next = await listOrders(testDb.db, { before: new Date(all[0].createdAt) });
    expect(next.map((o) => o.reference)).toEqual([first]);
    await changeOrderStatus(testDb.db, { reference: first, to: "confirmed", actor: "admin" });
    expect((await listOrders(testDb.db, { status: "confirmed" })).map((o) => o.reference)).toEqual([
      first,
    ]);
    expect(ORDER_PAGE_MAX).toBe(100);
  });

  it("moves an order only along the lifecycle, recording who did it", async () => {
    const reference = await place("submission-key-3001");
    const confirm = await changeOrderStatus(testDb.db, {
      reference,
      to: "confirmed",
      actor: "admin:asha",
      note: "Called the customer",
    });
    expect(confirm).toMatchObject({ ok: true, order: { status: "confirmed" } });
    expect(
      await changeOrderStatus(testDb.db, { reference, to: "payment-pending", actor: "admin" }),
    ).toMatchObject({ ok: true, order: { status: "payment-pending" } });

    // No verified payment exists, so it cannot become paid; nor skip ahead.
    expect(await changeOrderStatus(testDb.db, { reference, to: "paid", actor: "admin" })).toEqual({
      ok: false,
      reason: "payment-not-verified",
    });
    expect(
      await changeOrderStatus(testDb.db, { reference, to: "shipped", actor: "admin" }),
    ).toEqual({ ok: false, reason: "not-allowed" });
    expect(
      await changeOrderStatus(testDb.db, {
        reference: "SVF-000000-ZZZZZZ",
        to: "confirmed",
        actor: "admin",
      }),
    ).toEqual({ ok: false, reason: "not-found" });

    const events = await testDb.db.select().from(orderEvents);
    expect(
      events.map(({ fromStatus, toStatus, actor, note }) => ({
        fromStatus,
        toStatus,
        actor,
        note,
      })),
    ).toEqual([
      { fromStatus: null, toStatus: "requested", actor: CUSTOMER_ACTOR, note: null },
      {
        fromStatus: "requested",
        toStatus: "confirmed",
        actor: "admin:asha",
        note: "Called the customer",
      },
      { fromStatus: "confirmed", toStatus: "payment-pending", actor: "admin", note: null },
    ]);
  });

  it("lets only one of two simultaneous changes to the same order through", async () => {
    const reference = await place("submission-key-4001");
    const results = await Promise.all([
      changeOrderStatus(testDb.db, { reference, to: "confirmed", actor: "a" }),
      changeOrderStatus(testDb.db, { reference, to: "confirmed", actor: "b" }),
    ]);
    expect(results.map((r) => r.ok).sort()).toEqual([false, true]);
  });
});

describe("choosing the order-request store", () => {
  const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

  it("is off unless a store is named", () => {
    const logError = vi.fn();
    expect(orderRequestStoreFromEnv(env({}), undefined, logError)).toBeNull();
    expect(orderRequestStoreFromEnv(env({ ORDER_REQUESTS_STORE: "" }), undefined, logError)).toBe(
      null,
    );
    expect(logError).not.toHaveBeenCalled();
  });

  it("uses PostgreSQL when asked and DATABASE_URL is valid", () => {
    const connect = vi.fn(() => ({}) as never);
    const store = orderRequestStoreFromEnv(
      env({ ORDER_REQUESTS_STORE: "database", DATABASE_URL: "postgres://u:p@host/db" }),
      connect,
    );
    expect(store).not.toBeNull();
    expect(connect).toHaveBeenCalledWith("postgres://u:p@host/db");
  });

  it("stays off, and says why without the secret, when the database is misconfigured", () => {
    const logError = vi.fn();
    const connect = vi.fn();
    expect(
      orderRequestStoreFromEnv(
        env({ ORDER_REQUESTS_STORE: "database", DATABASE_URL: "mysql://u:secret@host/db" }),
        connect,
        logError,
      ),
    ).toBeNull();
    expect(connect).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining("DATABASE_URL"));
    expect(logError.mock.calls[0][0]).not.toContain("secret");
  });

  it("refuses an unknown store name", () => {
    const logError = vi.fn();
    expect(
      orderRequestStoreFromEnv(env({ ORDER_REQUESTS_STORE: "s3" }), undefined, logError),
    ).toBeNull();
    expect(logError).toHaveBeenCalled();
  });
});
