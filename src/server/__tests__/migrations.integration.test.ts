import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";

const MIGRATIONS = fileURLToPath(new URL("../db/migrations/", import.meta.url));

async function run(client: PGlite, file: string) {
  const sql = await readFile(`${MIGRATIONS}${file}`, "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) await client.exec(statement);
  }
}

describe("migration 0001 (order lifecycle)", () => {
  let client: PGlite;
  afterEach(() => client?.close());

  it("upgrades a database that already holds order requests, keeping every row", async () => {
    client = new PGlite();
    await run(client, "0000_initial_schema.sql");
    await client.exec(`
      INSERT INTO product_variants (id, product_slug, price_minor, availability, updated_by)
        VALUES ('moringa-powder-100g', 'moringa-powder', 24900, 'available', 'test');
      INSERT INTO customers (id, full_name, phone)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Lakshmi Rao', '+919876543210');
      INSERT INTO order_requests (id, reference, customer_id, delivery_address, subtotal_minor, submission_key_hash, status)
        VALUES
          ('00000000-0000-0000-0000-00000000000a', 'SVF-261014-AAAAAA', '00000000-0000-0000-0000-000000000001', '{}', 49800, repeat('a', 64), 'pending-confirmation'),
          ('00000000-0000-0000-0000-00000000000b', 'SVF-261014-BBBBBB', '00000000-0000-0000-0000-000000000001', '{}', 24900, repeat('b', 64), 'dispatched');
      INSERT INTO order_events (order_request_id, to_status, actor)
        VALUES ('00000000-0000-0000-0000-00000000000a', 'pending-confirmation', 'customer');
    `);

    await run(client, "0001_order_lifecycle.sql");

    const orders = await client.query<{ reference: string; status: string; total_minor: number }>(
      "SELECT reference, status, total_minor FROM order_requests ORDER BY reference",
    );
    expect(orders.rows).toEqual([
      { reference: "SVF-261014-AAAAAA", status: "requested", total_minor: 49800 },
      { reference: "SVF-261014-BBBBBB", status: "shipped", total_minor: 24900 },
    ]);
    const events = await client.query<{ to_status: string }>("SELECT to_status FROM order_events");
    expect(events.rows).toEqual([{ to_status: "requested" }]);

    const statuses = await client.query<{ value: string }>(
      "SELECT unnest(enum_range(NULL::order_request_status))::text AS value",
    );
    expect(statuses.rows.map((row) => row.value)).toEqual([
      "requested",
      "confirmed",
      "payment-pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "failed",
    ]);
    // New rows default to the new initial status, and new values are usable.
    await client.exec(`
      INSERT INTO order_requests (reference, customer_id, delivery_address, subtotal_minor, total_minor, submission_key_hash, payment_status)
        VALUES ('SVF-261014-CCCCCC', '00000000-0000-0000-0000-000000000001', '{}', 100, 100, repeat('c', 64), 'pending');
      UPDATE product_variants SET availability = 'in-preparation';
    `);
    const fresh = await client.query<{ status: string }>(
      "SELECT status FROM order_requests WHERE reference = 'SVF-261014-CCCCCC'",
    );
    expect(fresh.rows).toEqual([{ status: "requested" }]);
  }, 60_000);
});
