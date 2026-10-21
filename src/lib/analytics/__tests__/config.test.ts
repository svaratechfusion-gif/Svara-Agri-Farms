import { describe, expect, it } from "vitest";

import { isLocalHostname, parseGa4Id, parseGtmId } from "../config";

describe("parseGtmId", () => {
  it("accepts a container ID, trimmed", () => {
    expect(parseGtmId(" GTM-5PKWRX73 ")).toBe("GTM-5PKWRX73");
  });

  it("is off when unset or blank", () => {
    expect(parseGtmId(undefined)).toBeNull();
    expect(parseGtmId("  ")).toBeNull();
  });

  it("refuses anything that is not a container ID, such as a GA4 measurement ID", () => {
    expect(() => parseGtmId("G-WEWVE2HTJG")).toThrow(/NEXT_PUBLIC_GTM_ID/);
    expect(() => parseGtmId("gtm-5pkwrx73")).toThrow(/NEXT_PUBLIC_GTM_ID/);
  });
});

describe("isLocalHostname", () => {
  it("recognises local builds and test runs", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]"])
      expect(isLocalHostname(host)).toBe(true);
  });

  it("treats real hosts as remote", () => {
    expect(isLocalHostname("svaraagrifarms.vercel.app")).toBe(false);
  });
});

describe("parseGa4Id", () => {
  it("accepts a measurement ID, trimmed", () => {
    expect(parseGa4Id(" G-7X6NW0X8MJ ")).toBe("G-7X6NW0X8MJ");
  });

  it("is off when unset or blank", () => {
    expect(parseGa4Id(undefined)).toBeNull();
    expect(parseGa4Id("")).toBeNull();
  });

  it("refuses anything that is not a measurement ID, such as a GTM container ID", () => {
    expect(() => parseGa4Id("GTM-5PKWRX73")).toThrow(/NEXT_PUBLIC_GA4_ID/);
    expect(() => parseGa4Id("UA-12345-1")).toThrow(/NEXT_PUBLIC_GA4_ID/);
  });
});
