import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { orderRequestStatusEnum } from "./enums";
import { orderRequests } from "./orderRequests";

/**
 * The history of an order request: every status change, and notes. The
 * first event of a request has no `from_status`. Rows are only ever added.
 */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderRequestId: uuid("order_request_id")
      .notNull()
      .references(() => orderRequests.id, { onDelete: "cascade" }),
    fromStatus: orderRequestStatusEnum("from_status"),
    toStatus: orderRequestStatusEnum("to_status").notNull(),
    /** Who made the change, e.g. `customer` or an admin user. */
    actor: text("actor").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("order_events_order_request_id_created_at_idx").on(t.orderRequestId, t.createdAt),
    check("order_events_actor_present", sql`length(btrim(${t.actor})) > 0`),
  ],
);
