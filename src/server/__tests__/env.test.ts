import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { loadLocalEnvFiles, toolingDatabaseUrl } from "@/server/db/toolingEnv";
import { parseServerEnv } from "@/server/env";

// Placeholder connection strings for validation only; nothing connects.
const URL_POOLED = "postgresql://user:pw@example-pooler.invalid/db?sslmode=require";
const URL_DIRECT = "postgresql://user:pw@example.invalid/db?sslmode=require";

describe("parseServerEnv", () => {
  it("accepts a postgres connection string and an optional site URL", () => {
    expect(
      parseServerEnv({
        NODE_ENV: "production",
        DATABASE_URL: URL_POOLED,
        NEXT_PUBLIC_SITE_URL: "https://example.invalid",
      }),
    ).toEqual({
      NODE_ENV: "production",
      DATABASE_URL: URL_POOLED,
      NEXT_PUBLIC_SITE_URL: "https://example.invalid",
    });
    expect(parseServerEnv({ DATABASE_URL: URL_POOLED, NEXT_PUBLIC_SITE_URL: "" })).toEqual({
      NODE_ENV: "development",
      DATABASE_URL: URL_POOLED,
    });
  });

  it("requires DATABASE_URL", () => {
    expect(() => parseServerEnv({})).toThrow("Invalid environment: DATABASE_URL is required");
  });

  it("rejects connection strings that are not postgres", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://user@host/db" })).toThrow(
      "DATABASE_URL must be a postgres:// or postgresql:// connection string",
    );
    expect(() => parseServerEnv({ DATABASE_URL: "not a url" })).toThrow("DATABASE_URL must be");
  });

  it("rejects an invalid site URL", () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: URL_POOLED, NEXT_PUBLIC_SITE_URL: "example" }),
    ).toThrow("NEXT_PUBLIC_SITE_URL");
  });

  it("refuses a connection string in a public variable, without printing it", () => {
    const attempt = () =>
      parseServerEnv({ DATABASE_URL: URL_POOLED, NEXT_PUBLIC_DATABASE_URL: URL_DIRECT });
    expect(attempt).toThrow("NEXT_PUBLIC_DATABASE_URL holds a database connection string");
    expect(attempt).not.toThrow(/pw@/);
  });

  it("never includes the value in validation errors", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://secret-user:secret@host/db" })).toThrow(
      /^(?!.*secret).*$/,
    );
  });
});

describe("serverEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("validates process.env on first use", async () => {
    vi.stubEnv("DATABASE_URL", URL_POOLED);
    const { serverEnv } = await import("@/server/env");
    expect(serverEnv().DATABASE_URL).toBe(URL_POOLED);
  });

  it("throws when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { serverEnv } = await import("@/server/env");
    expect(() => serverEnv()).toThrow("DATABASE_URL is required");
  });
});

describe("tooling environment", () => {
  it("prefers the direct connection for migrations and the seed", () => {
    expect(
      toolingDatabaseUrl({ DATABASE_URL: URL_POOLED, DATABASE_URL_UNPOOLED: URL_DIRECT }),
    ).toBe(URL_DIRECT);
    expect(toolingDatabaseUrl({ DATABASE_URL: URL_POOLED, DATABASE_URL_UNPOOLED: " " })).toBe(
      URL_POOLED,
    );
    expect(toolingDatabaseUrl({})).toBeUndefined();
  });

  it("loads .env.local before .env without overriding the shell", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "svara-env-"));
    try {
      writeFileSync(path.join(directory, ".env.local"), "SVARA_TEST_A=local\n");
      writeFileSync(path.join(directory, ".env"), "SVARA_TEST_A=base\nSVARA_TEST_B=base\n");
      vi.stubEnv("SVARA_TEST_B", "shell");
      loadLocalEnvFiles(directory);
      expect(process.env.SVARA_TEST_A).toBe("local");
      expect(process.env.SVARA_TEST_B).toBe("shell");
    } finally {
      delete process.env.SVARA_TEST_A;
      vi.unstubAllEnvs();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does nothing when there are no env files", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "svara-env-"));
    try {
      expect(() => loadLocalEnvFiles(directory)).not.toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
