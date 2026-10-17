import { describe, expect, it } from "vitest";

import { clientOf, isSameOrigin } from "../server/requestGuards";

const headers = (values: Record<string, string>) => new Headers(values);

describe("isSameOrigin", () => {
  it("accepts only this site's own origin", () => {
    expect(isSameOrigin(headers({ origin: "https://svara.example", host: "svara.example" }))).toBe(
      true,
    );
    expect(isSameOrigin(headers({ origin: "https://evil.example", host: "svara.example" }))).toBe(
      false,
    );
    expect(isSameOrigin(headers({ host: "svara.example" }))).toBe(false);
    expect(isSameOrigin(headers({ origin: "not a url", host: "svara.example" }))).toBe(false);
    expect(
      isSameOrigin(
        headers({
          origin: "https://svara.example",
          host: "internal:3000",
          "x-forwarded-host": "svara.example",
        }),
      ),
    ).toBe(true);
  });
});

describe("clientOf", () => {
  it("never trusts the client-written first X-Forwarded-For entry", () => {
    expect(clientOf(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientOf(headers({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "6.6.6.6" }))).toBe(
      "203.0.113.9",
    );
    expect(clientOf(headers({}))).toBe("direct");
  });
});
