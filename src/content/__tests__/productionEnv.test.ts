import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** `.env.production` is committed: it may hold public settings only. */
function productionEnv(): Record<string, string> {
  const text = readFileSync(path.join(process.cwd(), ".env.production"), "utf8");
  return Object.fromEntries(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1)];
      }),
  );
}

describe("the committed production settings", () => {
  it("name the canonical origin: https, no path, no trailing slash", () => {
    const url = productionEnv().NEXT_PUBLIC_SITE_URL;
    expect(url).toBe("https://aimhightechnologies.com");
    expect(new URL(url).origin).toBe(url);
  });

  it("hold nothing but public NEXT_PUBLIC_* values", () => {
    for (const name of Object.keys(productionEnv())) {
      expect(name).toMatch(/^NEXT_PUBLIC_/);
    }
  });
});
