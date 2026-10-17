import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { Database } from "@/server/db/client";
import * as schema from "@/server/db/schema";

const MIGRATIONS = fileURLToPath(new URL("../db/migrations", import.meta.url));

export interface TestDatabase {
  db: Database;
  /** The raw PGlite client, for catalogue queries. */
  client: PGlite;
  close: () => Promise<void>;
}

/**
 * A real PostgreSQL running in-process (PGlite), with the project's
 * generated migrations applied — so tests exercise the same SQL that would
 * run against Neon.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return { db, client, close: () => client.close() };
}

/** The database constraint (or error message) a failed write reports. */
export async function violation(write: PromiseLike<unknown>): Promise<string> {
  try {
    await write;
  } catch (error) {
    let current: unknown = error;
    while (current instanceof Error) {
      const named = current as Error & { constraint?: string };
      if (named.constraint) return named.constraint;
      if (!current.cause) return current.message;
      current = current.cause;
    }
    return String(error);
  }
  throw new Error("Expected the write to be rejected, but it succeeded");
}
