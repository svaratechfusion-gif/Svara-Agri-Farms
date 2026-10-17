import path from "node:path";

import type { Database } from "@/server/db/client";
import { createDatabase } from "@/server/db/client";
import { createDatabaseOrderRequestStore } from "@/server/dal/orderRequests";
import { parseServerEnv } from "@/server/env";

import { createFileOrderRequestStore, type OrderRequestStore } from "./orderRequestStore";

/**
 * The order-request store this server is configured with, or null when order
 * requests are not being accepted (the endpoint then answers `not-accepting`).
 *
 *   ORDER_REQUESTS_STORE=database  PostgreSQL at DATABASE_URL (any host)
 *   ORDER_REQUESTS_STORE=file      JSON files in ORDER_REQUESTS_DIR (one long-running server)
 *   unset                          off
 *
 * A misconfigured database is logged and treated as off, so customers are
 * told requests cannot be received rather than shown a false success.
 */
export function orderRequestStoreFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  connect: (connectionString: string) => Database = createDatabase,
  logError: (message: string) => void = (message) => console.error(`[order-requests] ${message}`),
): OrderRequestStore | null {
  switch (env.ORDER_REQUESTS_STORE) {
    case "database": {
      try {
        return createDatabaseOrderRequestStore(connect(parseServerEnv(env).DATABASE_URL));
      } catch (error) {
        // parseServerEnv names the variable and the problem, never its value.
        logError(`database store is off: ${(error as Error).message}`);
        return null;
      }
    }
    case "file": {
      // A runtime location, not a bundled file: keep the bundler from tracing it.
      const directory = path.resolve(
        /*turbopackIgnore: true*/ process.cwd(),
        env.ORDER_REQUESTS_DIR || ".data/order-requests",
      );
      return createFileOrderRequestStore(directory);
    }
    case undefined:
    case "":
      return null;
    default:
      logError(`unknown ORDER_REQUESTS_STORE; expected "database" or "file"`);
      return null;
  }
}

export type CommerceStoreMode = "database" | "file" | "disabled";

export interface CommerceSetup {
  store: CommerceStoreMode;
  /** Plain lines for logs: names variables and problems, never values. */
  lines: string[];
}

/**
 * What this server is set up to do, for the start-up log and
 * `npm run commerce:status`. Reads the environment only — it connects to
 * nothing and prints no secret.
 */
export function describeCommerceSetup(
  env: NodeJS.ProcessEnv,
  extras: { paymentConnected: boolean; notificationsConnected: boolean; rulesConfigured: string[] },
): CommerceSetup {
  let store: CommerceStoreMode = "disabled";
  let storeLine =
    "Commerce store: DISABLED — the order-request API refuses requests (the site orders via WhatsApp). Set ORDER_REQUESTS_STORE=database and DATABASE_URL to enable it.";
  if (env.ORDER_REQUESTS_STORE === "database") {
    try {
      parseServerEnv(env);
      store = "database";
      storeLine =
        "Commerce store: DATABASE — order requests are saved to PostgreSQL (DATABASE_URL).";
    } catch (error) {
      storeLine = `Commerce store: DISABLED — ORDER_REQUESTS_STORE=database, but ${(error as Error).message.replace(/^Invalid environment: /, "")}.`;
    }
  } else if (env.ORDER_REQUESTS_STORE === "file") {
    store = "file";
    storeLine =
      "Commerce store: FILE — order requests are saved as files on this server (one long-running server only).";
  } else if (env.ORDER_REQUESTS_STORE) {
    storeLine = `Commerce store: DISABLED — unknown ORDER_REQUESTS_STORE; expected "database" or "file".`;
  }
  return {
    store,
    lines: [
      storeLine,
      extras.paymentConnected
        ? "Payment: CONNECTED"
        : "Payment: NOT CONNECTED — customers order via WhatsApp from the cart; no payment is taken on the site.",
      extras.notificationsConnected
        ? "Notifications: CONNECTED"
        : "Notifications: NONE — nobody is told about new requests automatically.",
      extras.rulesConfigured.length > 0
        ? `Delivery/tax rules: ${extras.rulesConfigured.join(", ")}`
        : "Delivery/tax rules: NOT CONFIGURED — delivery charges and tax are confirmed by the team.",
    ],
  };
}
