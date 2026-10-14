import { afterEach, describe, expect, it, vi } from "vitest";

import type { DeliveryInput } from "../delivery";
import { ORDER_REQUESTS_ENDPOINT, sendOrderRequest } from "../orderRequestClient";

const delivery = { fullName: "A" } as DeliveryInput;
const lines = [{ productSlug: "p", variantId: "v", quantity: 2 }];
const respond = (status: number, body: unknown, json = true) =>
  vi.fn().mockResolvedValue(
    new Response(json ? JSON.stringify(body) : String(body), {
      status,
      headers: json ? { "Content-Type": "application/json" } : {},
    }),
  );

afterEach(() => vi.restoreAllMocks());

describe("sendOrderRequest", () => {
  it("posts only the cart lines and details, with the submission key", async () => {
    const fetchImpl = respond(201, { ok: true, order: { reference: "SVF-261014-AAAAAA" } });
    const result = await sendOrderRequest(
      { lines: [{ ...lines[0], price: 1 } as never], delivery },
      "key-1234567890abcdef",
      fetchImpl,
    );
    expect(result).toEqual({ ok: true, order: { reference: "SVF-261014-AAAAAA" } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(ORDER_REQUESTS_ENDPOINT);
    expect(init.headers["Idempotency-Key"]).toBe("key-1234567890abcdef");
    expect(JSON.parse(init.body)).toEqual({ lines, delivery });
  });

  it.each([
    [503, { ok: false, error: "not-accepting" }, "not-accepting"],
    [422, { ok: false, error: "invalid-delivery", errors: { phone: "x" } }, "invalid-delivery"],
    [409, { ok: false, error: "unavailable-items", issues: [] }, "unavailable-items"],
    [500, { ok: false, error: "save-failed" }, "save-failed"],
  ])("passes on a %i refusal", async (status, body, error) => {
    const result = await sendOrderRequest({ lines, delivery }, "k", respond(status, body));
    expect(result).toMatchObject({ ok: false, error });
  });

  it("never reads an error page or a malformed success as received", async () => {
    expect(await sendOrderRequest({ lines, delivery }, "k", respond(502, "<html>", false))).toEqual(
      {
        ok: false,
        error: "save-failed",
      },
    );
    expect(await sendOrderRequest({ lines, delivery }, "k", respond(200, { ok: true }))).toEqual({
      ok: false,
      error: "invalid-request",
    });
    expect(await sendOrderRequest({ lines, delivery }, "k", respond(429, {}))).toEqual({
      ok: false,
      error: "rate-limited",
    });
  });

  it("reports a network failure", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("offline"));
    expect(await sendOrderRequest({ lines, delivery }, "k", fetchImpl)).toEqual({
      ok: false,
      error: "network",
    });
  });
});
