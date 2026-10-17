import { describe, expect, it } from "vitest";

import { newOrderId, ORDER_ID_PATTERN, orderDate } from "../orderId";

describe("order IDs", () => {
  it("read SVARA-YYYYMMDD-XXXXXX, dated in India", () => {
    const bytes = () => Uint8Array.from([0, 7, 31, 32, 200, 255]);
    // 20:00 on 17 October in London is already 18 October in India.
    expect(newOrderId(new Date("2026-10-17T19:00:00Z"), bytes)).toBe("SVARA-20261018-07Z08Z");
    expect(orderDate(new Date("2026-10-17T18:00:00Z"))).toBe("20261017");
  });

  it("never use letters that read like others (I, L, O, U)", () => {
    const all = Uint8Array.from({ length: 256 }, (_, index) => index);
    let cursor = 0;
    const bytes = (count: number) => all.slice(cursor, (cursor += count));
    for (let made = 0; made < 40; made += 1) {
      const id = newOrderId(new Date("2026-10-18T08:30:00Z"), bytes);
      expect(id).toMatch(ORDER_ID_PATTERN);
      expect(id.split("-")[2]).not.toMatch(/[ILOU]/);
      if (cursor >= 250) cursor = 0;
    }
  });

  it("are different every time", () => {
    const now = new Date();
    const ids = new Set(Array.from({ length: 2_000 }, () => newOrderId(now)));
    expect(ids.size).toBe(2_000);
    for (const id of ids) expect(id).toMatch(ORDER_ID_PATTERN);
  });
});
