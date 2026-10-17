import { createHash, randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DeliveryDetails } from "@/lib/commerce/delivery";
import {
  adminUsers,
  customers,
  inventory,
  inventoryMovements,
  orderEvents,
  orderRequestLines,
  orderRequests,
  productVariants,
  rateLimits,
} from "@/server/db/schema";

import { createTestDatabase, violation, type TestDatabase } from "./testDatabase";

// Test rows only — none of this is product or customer data.
const DELIVERY: DeliveryDetails = {
  fullName: "Test Customer",
  phone: "+919876543210",
  email: null,
  addressLine1: "1 Test Street",
  addressLine2: null,
  locality: "Test Locality",
  city: "Test City",
  state: "Karnataka",
  pinCode: "560001",
  instructions: null,
};

let testDb: TestDatabase;
let sequence = 0;

const db = () => testDb.db;
const hash = (seed: string) => createHash("sha256").update(seed).digest("hex");
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A unique, well-formed order reference (SVF-YYMMDD-XXXXXX). */
function reference(): string {
  let n = ++sequence;
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix = REFERENCE_ALPHABET[n % REFERENCE_ALPHABET.length] + suffix;
    n = Math.floor(n / REFERENCE_ALPHABET.length);
  }
  return `SVF-260101-${suffix}`;
}

async function addVariant(overrides: Partial<typeof productVariants.$inferInsert> = {}) {
  const id = overrides.id ?? `test-variant-${++sequence}`;
  await db()
    .insert(productVariants)
    .values({
      id,
      productSlug: "test-powder",
      availability: "coming-soon",
      updatedBy: "test",
      ...overrides,
    });
  return id;
}

async function addCustomer(phone = `+9198765${String(++sequence).padStart(5, "0")}`) {
  const [row] = await db()
    .insert(customers)
    .values({ fullName: "Test Customer", phone })
    .returning({ id: customers.id });
  return row.id;
}

async function addOrderRequest(overrides: Partial<typeof orderRequests.$inferInsert> = {}) {
  const customerId = overrides.customerId ?? (await addCustomer());
  const [row] = await db()
    .insert(orderRequests)
    .values({
      reference: reference(),
      customerId,
      deliveryAddress: DELIVERY,
      subtotalMinor: 24_900,
      totalMinor: 24_900,
      submissionKeyHash: hash(randomUUID()),
      ...overrides,
    })
    .returning();
  return row;
}

beforeAll(async () => {
  testDb = await createTestDatabase();
}, 60_000);

afterAll(async () => {
  await testDb?.close();
});

describe("migrations", () => {
  it("create every table", async () => {
    const result = await testDb.client.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([
      "admin_users",
      "customers",
      "inventory",
      "inventory_movements",
      "order_events",
      "order_request_lines",
      "order_requests",
      "product_variants",
      "rate_limits",
    ]);
  });
});

describe("product_variants", () => {
  it("keeps a size without a price as long as it is not available", async () => {
    const id = await addVariant();
    const [row] = await db().select().from(productVariants).where(eq(productVariants.id, id));
    expect(row).toMatchObject({ priceMinor: null, currency: "INR", availability: "coming-soon" });
  });

  it("refuses an available size without a price", async () => {
    expect(await violation(addVariant({ availability: "available" }))).toBe(
      "product_variants_available_requires_price",
    );
  });

  it("refuses a zero or negative price", async () => {
    expect(await violation(addVariant({ priceMinor: 0 }))).toBe("product_variants_price_positive");
  });

  it("refuses malformed IDs and unknown availability", async () => {
    expect(await violation(addVariant({ id: "Bad ID" }))).toBe("product_variants_id_format");
    expect(await violation(addVariant({ availability: "preorder" as "available" }))).toMatch(
      /invalid input value for enum availability/,
    );
  });
});

describe("inventory", () => {
  it("never lets stock go negative or reservations exceed stock", async () => {
    const id = await addVariant();
    expect(await violation(db().insert(inventory).values({ variantId: id, onHand: -1 }))).toBe(
      "inventory_on_hand_non_negative",
    );
    expect(
      await violation(db().insert(inventory).values({ variantId: id, onHand: 2, reserved: 3 })),
    ).toBe("inventory_reserved_within_on_hand");

    await db().insert(inventory).values({ variantId: id, onHand: 5, reserved: 2 });
    expect(
      await violation(db().update(inventory).set({ onHand: 1 }).where(eq(inventory.variantId, id))),
    ).toBe("inventory_reserved_within_on_hand");
  });

  it("only holds stock for sizes that exist, which then cannot be deleted", async () => {
    expect(
      await violation(db().insert(inventory).values({ variantId: "no-such-size", onHand: 1 })),
    ).toBe("inventory_variant_id_product_variants_id_fk");

    const id = await addVariant();
    await db().insert(inventory).values({ variantId: id, onHand: 1 });
    expect(await violation(db().delete(productVariants).where(eq(productVariants.id, id)))).toBe(
      "inventory_variant_id_product_variants_id_fk",
    );
  });
});

describe("inventory_movements", () => {
  it("ties reservations to an order request and checks their direction", async () => {
    const variantId = await addVariant();
    const order = await addOrderRequest();
    const movement = { variantId, actor: "system" };

    expect(
      await violation(
        db()
          .insert(inventoryMovements)
          .values({ ...movement, delta: 1, reason: "reserve" }),
      ),
    ).toBe("inventory_movements_order_link");
    expect(
      await violation(
        db()
          .insert(inventoryMovements)
          .values({ ...movement, delta: -1, reason: "reserve", orderRequestId: order.id }),
      ),
    ).toBe("inventory_movements_delta_direction");
    expect(
      await violation(
        db()
          .insert(inventoryMovements)
          .values({ ...movement, delta: 0, reason: "adjust" }),
      ),
    ).toBe("inventory_movements_delta_non_zero");

    await db()
      .insert(inventoryMovements)
      .values([
        { ...movement, delta: 2, reason: "reserve", orderRequestId: order.id },
        { ...movement, delta: -2, reason: "release", orderRequestId: order.id },
        { ...movement, delta: -3, reason: "adjust" },
      ]);
  });
});

describe("customers", () => {
  it("stores one customer per normalised phone number", async () => {
    await addCustomer("+919000000001");
    expect(await violation(addCustomer("+919000000001"))).toBe("customers_phone_key");
    expect(await violation(addCustomer("9000000002"))).toBe("customers_phone_format");
  });
});

describe("order_requests", () => {
  it("starts requested, with payment not collected and no charges set", async () => {
    const order = await addOrderRequest();
    expect(order).toMatchObject({
      status: "requested",
      paymentStatus: "not-collected",
      paymentReference: null,
      deliveryChargeMinor: null,
      taxMinor: null,
      notes: null,
      currency: "INR",
      deliveryAddress: DELIVERY,
    });
  });

  it("refuses a total that does not add up, or a negative charge", async () => {
    expect(await violation(addOrderRequest({ totalMinor: 1 }))).toBe(
      "order_requests_total_adds_up",
    );
    // Subtotal + delivery + tax added on top adds up.
    await addOrderRequest({ deliveryChargeMinor: 5_000, taxMinor: 1_495, totalMinor: 31_395 });
    // Tax included in prices is shown, not added.
    await addOrderRequest({ taxMinor: 1_186, taxIncluded: true, totalMinor: 24_900 });
    expect(await violation(addOrderRequest({ deliveryChargeMinor: -1, totalMinor: 24_899 }))).toBe(
      "order_requests_charges_not_negative",
    );
  });

  it("keeps payment references unique", async () => {
    await addOrderRequest({ paymentReference: "pay_123" });
    expect(await violation(addOrderRequest({ paymentReference: "pay_123" }))).toBe(
      "order_requests_payment_reference_key",
    );
  });

  it("saves a submission only once and keeps references unique", async () => {
    const order = await addOrderRequest();
    expect(await violation(addOrderRequest({ submissionKeyHash: order.submissionKeyHash }))).toBe(
      "order_requests_submission_key_hash_key",
    );
    expect(await violation(addOrderRequest({ reference: order.reference }))).toBe(
      "order_requests_reference_key",
    );
  });

  it("refuses malformed references, hashes and totals", async () => {
    expect(await violation(addOrderRequest({ reference: "ORDER-1" }))).toBe(
      "order_requests_reference_format",
    );
    expect(await violation(addOrderRequest({ submissionKeyHash: "plain-key" }))).toBe(
      "order_requests_submission_key_hash_format",
    );
    expect(await violation(addOrderRequest({ subtotalMinor: 0 }))).toBe(
      "order_requests_subtotal_positive",
    );
  });

  it("accepts only the lifecycle's statuses", async () => {
    expect(
      await violation(addOrderRequest({ paymentStatus: "settled" as "not-collected" })),
    ).toMatch(/invalid input value for enum payment_status/);
    expect(
      await violation(addOrderRequest({ status: "pending-confirmation" as "confirmed" })),
    ).toMatch(/invalid input value for enum order_request_status/);
  });

  it("needs an existing customer", async () => {
    expect(await violation(addOrderRequest({ customerId: randomUUID() }))).toBe(
      "order_requests_customer_id_customers_id_fk",
    );
  });
});

describe("order_request_lines and order_events", () => {
  it("enforce the cart's quantity limits and one line per size", async () => {
    const variantId = await addVariant();
    const order = await addOrderRequest();
    const line = {
      orderRequestId: order.id,
      variantId,
      unitPriceMinor: 24_900,
      productNameSnapshot: "Test Powder",
      sizeLabelSnapshot: "100 g pouch",
    };
    expect(
      await violation(
        db()
          .insert(orderRequestLines)
          .values({ ...line, quantity: 0 }),
      ),
    ).toBe("order_request_lines_quantity_range");
    expect(
      await violation(
        db()
          .insert(orderRequestLines)
          .values({ ...line, quantity: 11 }),
      ),
    ).toBe("order_request_lines_quantity_range");
    await db()
      .insert(orderRequestLines)
      .values({ ...line, quantity: 10 });
    expect(
      await violation(
        db()
          .insert(orderRequestLines)
          .values({ ...line, quantity: 1 }),
      ),
    ).toBe("order_request_lines_order_variant_key");
  });

  it("keep their request's lines and history together", async () => {
    const variantId = await addVariant();
    const order = await addOrderRequest();
    await db().insert(orderRequestLines).values({
      orderRequestId: order.id,
      variantId,
      quantity: 1,
      unitPriceMinor: 24_900,
      productNameSnapshot: "Test Powder",
      sizeLabelSnapshot: "100 g pouch",
    });
    await db()
      .insert(orderEvents)
      .values({ orderRequestId: order.id, toStatus: "requested", actor: "customer" });

    await db().delete(orderRequests).where(eq(orderRequests.id, order.id));
    const lines = await db()
      .select()
      .from(orderRequestLines)
      .where(eq(orderRequestLines.orderRequestId, order.id));
    const events = await db()
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderRequestId, order.id));
    expect([lines.length, events.length]).toEqual([0, 0]);
  });

  it("protect stock history from a request being deleted", async () => {
    const variantId = await addVariant();
    const order = await addOrderRequest();
    await db().insert(inventoryMovements).values({
      variantId,
      delta: 1,
      reason: "reserve",
      orderRequestId: order.id,
      actor: "system",
    });
    expect(await violation(db().delete(orderRequests).where(eq(orderRequests.id, order.id)))).toBe(
      "inventory_movements_order_request_id_order_requests_id_fk",
    );
  });
});

describe("admin_users", () => {
  const admin = { passwordHash: "hash-placeholder", role: "staff" as const };

  it("keeps one lower-case email per person, with owner or staff roles only", async () => {
    await db()
      .insert(adminUsers)
      .values({ ...admin, email: "person@example.invalid" });
    expect(
      await violation(
        db()
          .insert(adminUsers)
          .values({ ...admin, email: "person@example.invalid" }),
      ),
    ).toBe("admin_users_email_key");
    expect(
      await violation(
        db()
          .insert(adminUsers)
          .values({ ...admin, email: "Person@Example.invalid" }),
      ),
    ).toBe("admin_users_email_normalised");
    expect(
      await violation(
        db()
          .insert(adminUsers)
          .values({ ...admin, email: "other@example.invalid", role: "admin" as "owner" }),
      ),
    ).toMatch(/invalid input value for enum admin_role/);
  });
});

describe("rate_limits", () => {
  it("counts once per key and window", async () => {
    const windowStart = new Date("2026-01-01T00:00:00Z");
    await db().insert(rateLimits).values({ key: "client-a", windowStart });
    expect(await violation(db().insert(rateLimits).values({ key: "client-a", windowStart }))).toBe(
      "rate_limits_pkey",
    );
    expect(
      await violation(db().insert(rateLimits).values({ key: "client-b", windowStart, count: 0 })),
    ).toBe("rate_limits_count_positive");
  });
});
