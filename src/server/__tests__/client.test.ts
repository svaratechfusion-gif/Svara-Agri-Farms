import { afterEach, describe, expect, it, vi } from "vitest";

describe("database client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    delete (globalThis as { svaraDb?: unknown }).svaraDb;
  });

  it("creates a pool without connecting until a query runs", async () => {
    const { createDatabase } = await import("@/server/db/client");
    const db = createDatabase("postgresql://user:pw@localhost:1/none");
    expect(db.$client.totalCount).toBe(0);
    await db.$client.end();
  });

  it("refuses to connect without a valid DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { getDb } = await import("@/server/db/client");
    expect(() => getDb()).toThrow("DATABASE_URL is required");
  });

  it("reuses one database for the whole server", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pw@localhost:1/none");
    const { getDb } = await import("@/server/db/client");
    const first = getDb();
    expect(getDb()).toBe(first);
    await (first as unknown as { $client: { end: () => Promise<void> } }).$client.end();
  });
});
