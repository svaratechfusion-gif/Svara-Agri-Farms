import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { products } from "@/content/products";

import type { DeliveryInput } from "../delivery";
import {
  buildOrderRequest,
  createOrderReference,
  parseOrderRequestInput,
  REFERENCE_PATTERN,
} from "../orderRequest";
import {
  createFileOrderRequestStore,
  orderRequestStoreFromEnv,
  type OrderRequestStore,
} from "../server/orderRequestStore";
import { createRateLimiter } from "../server/rateLimit";
import { submitOrderRequest, type SubmitDeps } from "../server/submitOrderRequest";
import { fixtureCatalogue } from "./fixtures";

const delivery: DeliveryInput = {
  fullName: "Lakshmi Rao",
  phone: "9876543210",
  email: "",
  addressLine1: "12, Temple Street",
  addressLine2: "",
  locality: "Kodur",
  city: "Kadapa",
  state: "Andhra Pradesh",
  pinCode: "516101",
  instructions: "",
};
const body = (lines = [{ productSlug: "test-powder", variantId: "test-100g", quantity: 2 }]) => ({
  lines,
  delivery,
});
const KEY = "submission-key-0001";
const NOW = new Date("2026-10-14T09:30:00Z");

describe("order references", () => {
  it("read SVF-date-code, from unambiguous characters", () => {
    const reference = createOrderReference(NOW, new Uint8Array([0, 1, 2, 30, 31, 255]));
    expect(reference).toMatch(REFERENCE_PATTERN);
    expect(reference.startsWith("SVF-261014-")).toBe(true);
  });
});

describe("parseOrderRequestInput", () => {
  it.each([
    null,
    "text",
    { lines: [], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 0 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 11 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1.5 }], delivery },
    { lines: [{ productSlug: 1, variantId: "b", quantity: 1 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1 }] },
  ])("rejects %j", (input) => {
    expect(parseOrderRequestInput(input)).toBeNull();
  });

  it("ignores anything the client says about prices or totals", () => {
    const parsed = parseOrderRequestInput({
      ...body(),
      subtotal: 1,
      lines: [{ productSlug: "test-powder", variantId: "test-100g", quantity: 2, price: 1 }],
    });
    expect(parsed?.lines).toEqual([
      { productSlug: "test-powder", variantId: "test-100g", quantity: 2 },
    ]);
  });
});

describe("buildOrderRequest", () => {
  it("prices from the catalogue and starts pending, with no payment collected", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(body())!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.order).toMatchObject({
      status: "pending-confirmation",
      payment: { status: "not-collected" },
      productSubtotal: { amountMinor: 49_800, currency: "INR" },
      lines: [{ productName: "Test Powder", variantLabel: "100 g pouch", quantity: 2 }],
      delivery: { phone: "+919876543210", pinCode: "516101" },
    });
  });

  it("merges repeated lines, refusing more than the per-line limit", () => {
    const twice = parseOrderRequestInput(
      body([
        { productSlug: "test-powder", variantId: "test-100g", quantity: 6 },
        { productSlug: "test-powder", variantId: "test-100g", quantity: 5 },
      ]),
    )!;
    expect(buildOrderRequest(twice, fixtureCatalogue, "SVF-261014-AAAAAA", NOW)).toEqual({
      ok: false,
      reason: "invalid-request",
    });
  });

  it("refuses sizes that cannot be ordered", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(
        body([{ productSlug: "test-powder", variantId: "test-soon", quantity: 1 }]),
      )!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
    );
    expect(built).toMatchObject({ ok: false, reason: "unavailable-items" });
  });

  it("refuses everything in today's real catalogue, which has no prices yet", () => {
    for (const product of products) {
      for (const variant of product.variants) {
        const built = buildOrderRequest(
          parseOrderRequestInput(
            body([{ productSlug: product.slug, variantId: variant.id, quantity: 1 }]),
          )!,
          products,
          "SVF-261014-AAAAAA",
          NOW,
        );
        expect(built.ok).toBe(variant.price !== null && variant.availability === "available");
      }
    }
  });
});

describe("submitting an order request", () => {
  let directory: string;
  let store: OrderRequestStore;
  let deps: SubmitDeps;
  let counter: number;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "svara-orders-"));
    store = createFileOrderRequestStore(directory);
    counter = 0;
    deps = {
      catalogue: fixtureCatalogue,
      store,
      now: () => NOW,
      randomBytes: (size) => new Uint8Array(size).fill(counter++),
      logError: vi.fn(),
    };
  });
  afterEach(() => rm(directory, { recursive: true, force: true }));

  const savedFiles = () => readdir(path.join(directory, "requests"));

  it("saves the request, privately, and returns it", async () => {
    const result = await submitOrderRequest(body(), KEY, deps);
    expect(result.status).toBe(201);
    if (!result.body.ok) throw new Error("expected success");
    const { reference } = result.body.order;
    expect(await savedFiles()).toEqual([`${reference}.json`]);
    const file = path.join(directory, "requests", `${reference}.json`);
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual(result.body.order);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  it("refuses honestly when no store is configured", async () => {
    const result = await submitOrderRequest(body(), KEY, { ...deps, store: null });
    expect(result).toEqual({ status: 503, body: { ok: false, error: "not-accepting" } });
  });

  it("refuses invalid requests and keys without saving", async () => {
    expect((await submitOrderRequest({ nope: true }, KEY, deps)).status).toBe(400);
    expect((await submitOrderRequest(body(), null, deps)).status).toBe(400);
    expect((await submitOrderRequest(body(), "short", deps)).status).toBe(400);
    const badDelivery = await submitOrderRequest(
      { ...body(), delivery: { ...delivery, pinCode: "12" } },
      KEY,
      deps,
    );
    expect(badDelivery).toMatchObject({
      status: 422,
      body: { error: "invalid-delivery", errors: { pinCode: expect.any(String) } },
    });
    const unavailable = await submitOrderRequest(
      body([{ productSlug: "test-powder", variantId: "test-sold", quantity: 1 }]),
      KEY,
      deps,
    );
    expect(unavailable).toMatchObject({ status: 409, body: { error: "unavailable-items" } });
    expect(await savedFiles()).toEqual([]);
  });

  it("answers a repeated submission with the first request, saving it once", async () => {
    const first = await submitOrderRequest(body(), KEY, deps);
    const again = await submitOrderRequest(body(), KEY, deps);
    expect(again.status).toBe(200);
    expect(again.body).toEqual(first.body);
    expect(await savedFiles()).toHaveLength(1);
  });

  it("saves only one of two simultaneous identical submissions", async () => {
    const [a, b] = await Promise.all([
      submitOrderRequest(body(), KEY, deps),
      submitOrderRequest(body(), KEY, deps),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(a.body.ok && b.body.ok && a.body.order.reference === b.body.order.reference).toBe(true);
    expect(await savedFiles()).toHaveLength(1);
  });

  it("reports a failed save as a failure, never as received", async () => {
    const broken: OrderRequestStore = {
      save: () => Promise.reject(new Error("disk full")),
      findByIdempotencyKey: () => Promise.resolve(null),
    };
    const result = await submitOrderRequest(body(), KEY, { ...deps, store: broken });
    expect(result).toEqual({ status: 500, body: { ok: false, error: "save-failed" } });
    expect(deps.logError).toHaveBeenCalled();
  });

  it("draws a new reference if one is already taken", async () => {
    deps.randomBytes = (size) => new Uint8Array(size).fill(7); // always the same reference
    const first = await submitOrderRequest(body(), "first-submission-key", deps);
    let calls = 0;
    deps.randomBytes = (size) => new Uint8Array(size).fill(calls++ === 0 ? 7 : 9);
    const second = await submitOrderRequest(body(), "second-submission-key", deps);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await savedFiles()).toHaveLength(2);
  });
});

describe("configuration", () => {
  it("accepts nothing unless the file store is switched on", () => {
    expect(orderRequestStoreFromEnv({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(
      orderRequestStoreFromEnv({
        ORDER_REQUESTS_STORE: "file",
        ORDER_REQUESTS_DIR: tmpdir(),
      } as unknown as NodeJS.ProcessEnv),
    ).not.toBeNull();
  });
});

describe("rate limit", () => {
  it("allows a few requests per window per client", () => {
    let time = 0;
    const allow = createRateLimiter(2, 60_000, () => time);
    expect([allow("a"), allow("a"), allow("a"), allow("b")]).toEqual([true, true, false, true]);
    time = 60_000;
    expect(allow("a")).toBe(true);
  });
});
