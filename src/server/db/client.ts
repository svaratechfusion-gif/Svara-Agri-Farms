import "server-only";

import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { serverEnv } from "@/server/env";

import * as schema from "./schema";

/**
 * Any Drizzle database with this schema: the Neon/Postgres pool in the app,
 * or an in-process Postgres in tests. Data-access code takes this type.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** A few connections per server instance; Neon's pooler does the rest. */
const POOL_MAX = 5;
const IDLE_TIMEOUT_MS = 10_000;
const CONNECT_TIMEOUT_MS = 10_000;

export function createDatabase(connectionString: string): NodePgDatabase<typeof schema> & {
  $client: Pool;
} {
  const pool = new Pool({
    connectionString,
    max: POOL_MAX,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  // An idle connection dropped by the server must not crash the process.
  pool.on("error", (error) => {
    console.error("[db] idle connection error:", error.message);
  });
  return drizzle({ client: pool, schema });
}

// Kept on globalThis so development reloads reuse one pool.
const globalForDb = globalThis as typeof globalThis & { svaraDb?: Database };

/** The app's database, connected on first use from `DATABASE_URL`. */
export function getDb(): Database {
  globalForDb.svaraDb ??= createDatabase(serverEnv().DATABASE_URL);
  return globalForDb.svaraDb;
}
