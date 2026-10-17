import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { catalogue } from "@/content/products";

import type { DeliveryInput } from "../delivery";
import {
  buildOrderRequest,
  createOrderReference,
  parseOrderRequestInput,
  REFERENCE_PATTERN,
} from "../orderRequest";
import { orderRequestStoreFromEnv } from "../server/configuredStore";
import { createFileOrderRequestStore, type OrderRequestStore } from "../server/orderRequestStore";
import { NO_RULES, type CommerceRules } from "../pricing";
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
const LINE_100G = { productSlug: "test-powder", variantId: "test-100g", seenPriceMinor: 24_900 };
const body = (lines: Record<string, unknown>[] = [{ ...LINE_100G, quantity: 2 }]) => ({
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
    { lines: [{ productSlug: "a", variantId: "b", quantity: 0, seenPriceMinor: 100 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 11, seenPriceMinor: 100 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1.5, seenPriceMinor: 100 }], delivery },
    { lines: [{ productSlug: 1, variantId: "b", quantity: 1, seenPriceMinor: 100 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1, seenPriceMinor: 100 }] },
    // The price the customer was shown is required, and must be a whole number of paise.
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1, seenPriceMinor: 0 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1, seenPriceMinor: 9.5 }], delivery },
    { lines: [{ productSlug: "a", variantId: "b", quantity: 1, seenPriceMinor: "100" }], delivery },
  ])("rejects %j", (input) => {
    expect(parseOrderRequestInput(input)).toBeNull();
  });

  it("ignores anything the client says about totals or other prices", () => {
    const parsed = parseOrderRequestInput({
      ...body(),
      subtotal: 1,
      lines: [{ ...LINE_100G, quantity: 2, price: 1 }],
    });
    expect(parsed?.lines).toEqual([{ ...LINE_100G, quantity: 2 }]);
  });
});

describe("buildOrderRequest", () => {
  it("prices from the catalogue and starts pending, with no payment collected", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(body())!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.order).toEqual({
      reference: "SVF-261014-AAAAAA",
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      status: "requested",
      payment: { status: "not-collected", reference: null },
      lines: [
        {
          productSlug: "test-powder",
          variantId: "test-100g",
          sku: "TEST-TEST-100G",
          productName: "Test Powder",
          variantLabel: "100 g pouch",
          quantity: 2,
          unitPrice: { amountMinor: 24_900, currency: "INR" },
          lineTotal: { amountMinor: 49_800, currency: "INR" },
        },
      ],
      // No delivery or tax rule is configured: those stay unknown, never zero.
      totals: {
        subtotal: { amountMinor: 49_800, currency: "INR" },
        deliveryCharge: null,
        tax: null,
        taxIncluded: false,
        total: { amountMinor: 49_800, currency: "INR" },
        isFinal: false,
      },
      delivery: expect.objectContaining({ phone: "+919876543210", pinCode: "516101" }),
      notes: null,
    });
  });

  it("applies configured delivery, tax and minimum-order rules on the server", () => {
    const rules: CommerceRules = {
      deliveryZones: [
        {
          id: "ap",
          label: "Andhra Pradesh",
          pinCodePrefixes: ["516"],
          charge: { amountMinor: 5_000, currency: "INR" },
          freeFrom: null,
        },
      ],
      tax: { label: "GST", rateBasisPoints: 500, pricesIncludeTax: false },
      minimumOrder: { amountMinor: 30_000, currency: "INR" },
    };
    const build = (quantity: number, pinCode = "516101") =>
      buildOrderRequest(
        parseOrderRequestInput({
          lines: [{ ...LINE_100G, quantity }],
          delivery: { ...delivery, pinCode },
        })!,
        fixtureCatalogue,
        "SVF-261014-AAAAAA",
        NOW,
        rules,
      );

    const priced = build(2);
    if (!priced.ok) throw new Error("expected success");
    // 498.00 + 50.00 delivery = 548.00; 5% tax = 27.40; total 575.40.
    expect(priced.order.totals).toEqual({
      subtotal: { amountMinor: 49_800, currency: "INR" },
      deliveryCharge: { amountMinor: 5_000, currency: "INR" },
      tax: { amountMinor: 2_740, currency: "INR" },
      taxIncluded: false,
      total: { amountMinor: 57_540, currency: "INR" },
      isFinal: true,
    });
    expect(build(1)).toEqual({
      ok: false,
      reason: "below-minimum",
      minimum: { amountMinor: 30_000, currency: "INR" },
    });
    expect(build(2, "110001")).toEqual({
      ok: false,
      reason: "invalid-delivery",
      errors: { pinCode: "We do not deliver to this PIN code yet." },
    });
  });

  it("refuses a size whose product is in preparation, whatever the size says", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(
        body([
          {
            productSlug: "test-later",
            variantId: "test-later-100g",
            quantity: 1,
            seenPriceMinor: 24_900,
          },
        ]),
      )!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    expect(built).toMatchObject({ ok: false, reason: "unavailable-items" });
  });

  it("refuses unknown products and sizes, and a size under the wrong product", () => {
    for (const line of [
      { productSlug: "no-such-powder", variantId: "test-100g" },
      { productSlug: "test-powder", variantId: "no-such-size" },
      { productSlug: "test-later", variantId: "test-100g" },
    ]) {
      const built = buildOrderRequest(
        parseOrderRequestInput(body([{ ...line, quantity: 1, seenPriceMinor: 24_900 }]))!,
        fixtureCatalogue,
        "SVF-261014-AAAAAA",
        NOW,
        NO_RULES,
      );
      expect(built).toMatchObject({
        ok: false,
        reason: "unavailable-items",
        issues: [{ reason: "unknown-product" }],
      });
    }
  });

  it("merges repeated lines, refusing more than the per-line limit", () => {
    const twice = parseOrderRequestInput(
      body([
        { ...LINE_100G, quantity: 6 },
        { ...LINE_100G, quantity: 5 },
      ]),
    )!;
    expect(buildOrderRequest(twice, fixtureCatalogue, "SVF-261014-AAAAAA", NOW, NO_RULES)).toEqual({
      ok: false,
      reason: "invalid-request",
    });
  });

  it("refuses sizes that cannot be ordered", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(
        body([
          { productSlug: "test-powder", variantId: "test-soon", quantity: 1, seenPriceMinor: 100 },
        ]),
      )!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    expect(built).toMatchObject({ ok: false, reason: "unavailable-items" });
  });

  it("refuses a price the customer was not shown, saying the price changed", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(body([{ ...LINE_100G, quantity: 1, seenPriceMinor: 19_900 }]))!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    expect(built).toEqual({
      ok: false,
      reason: "price-changed",
      issues: [{ productSlug: "test-powder", variantId: "test-100g", reason: "price-changed" }],
    });
  });

  it("reports unavailable items first when a cart has both problems", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(
        body([
          { ...LINE_100G, quantity: 1, seenPriceMinor: 19_900 },
          { productSlug: "test-powder", variantId: "test-sold", quantity: 1, seenPriceMinor: 100 },
        ]),
      )!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    expect(built).toMatchObject({ ok: false, reason: "unavailable-items" });
  });

  it("refuses repeated lines that were shown at different prices", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(
        body([
          { ...LINE_100G, quantity: 1 },
          { ...LINE_100G, quantity: 1, seenPriceMinor: 19_900 },
        ]),
      )!,
      fixtureCatalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    expect(built).toEqual({ ok: false, reason: "invalid-request" });
  });

  it("prices today's real catalogue on the server: ₹250 per 100 g, ₹350 per 250 g", () => {
    const built = buildOrderRequest(
      parseOrderRequestInput(
        body([
          {
            productSlug: "moringa-powder",
            variantId: "moringa-powder-100g",
            quantity: 2,
            seenPriceMinor: 25_000,
          },
          {
            productSlug: "ginger-powder",
            variantId: "ginger-powder-250g",
            quantity: 1,
            seenPriceMinor: 35_000,
          },
        ]),
      )!,
      catalogue,
      "SVF-261014-AAAAAA",
      NOW,
      NO_RULES,
    );
    if (!built.ok) throw new Error(`expected success, got ${built.reason}`);
    expect(
      built.order.lines.map(({ sku, unitPrice, lineTotal }) => [
        sku,
        unitPrice.amountMinor,
        lineTotal.amountMinor,
      ]),
    ).toEqual([
      ["SVARA-MORINGA-100", 25_000, 50_000],
      ["SVARA-GINGER-250", 35_000, 35_000],
    ]);
    expect(built.order.totals.subtotal).toEqual({ amountMinor: 85_000, currency: "INR" });
  });

  it("refuses a real size at any price but the catalogue's, whatever the browser claims", () => {
    for (const claimed of [1, 24_900, 35_000]) {
      const built = buildOrderRequest(
        parseOrderRequestInput(
          body([
            {
              productSlug: "moringa-powder",
              variantId: "moringa-powder-100g",
              quantity: 1,
              seenPriceMinor: claimed,
            },
          ]),
        )!,
        catalogue,
        "SVF-261014-AAAAAA",
        NOW,
        NO_RULES,
      );
      expect(built, String(claimed)).toMatchObject({ ok: false, reason: "price-changed" });
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
      rules: NO_RULES,
      store,
      notifier: null,
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
      body([
        { productSlug: "test-powder", variantId: "test-sold", quantity: 1, seenPriceMinor: 100 },
      ]),
      KEY,
      deps,
    );
    expect(unavailable).toMatchObject({ status: 409, body: { error: "unavailable-items" } });
    const repriced = await submitOrderRequest(
      body([{ ...LINE_100G, quantity: 1, seenPriceMinor: 19_900 }]),
      KEY,
      deps,
    );
    expect(repriced).toMatchObject({
      status: 409,
      body: { error: "price-changed", issues: [{ reason: "price-changed" }] },
    });
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
  it("accepts nothing unless a store is switched on", () => {
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

describe("notifications after an order request", () => {
  it("are sent once for a new request — not for a replay, and a failure never fails the order", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "svara-orders-"));
    const sent: string[] = [];
    const deps: SubmitDeps = {
      catalogue: fixtureCatalogue,
      rules: NO_RULES,
      store: createFileOrderRequestStore(directory),
      notifier: {
        send: async (n) => {
          sent.push(`${n.kind}:${n.order.reference}`);
          if (n.audience === "team") throw new Error("no channel");
        },
      },
      now: () => NOW,
      randomBytes: (size) => new Uint8Array(size).fill(3),
      logError: vi.fn(),
    };
    try {
      const first = await submitOrderRequest(body(), KEY, deps);
      const replay = await submitOrderRequest(body(), KEY, deps);
      expect([first.status, replay.status]).toEqual([201, 200]);
      if (!first.body.ok) throw new Error("expected success");
      expect(sent).toEqual([
        `order-request-received:${first.body.order.reference}`,
        `team-new-order-request:${first.body.order.reference}`,
      ]);
      expect(deps.logError).toHaveBeenCalledTimes(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
