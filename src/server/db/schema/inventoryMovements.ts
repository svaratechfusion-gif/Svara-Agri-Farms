import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { inventoryMovementReasonEnum } from "./enums";
import { orderRequests } from "./orderRequests";
import { productVariants } from "./productVariants";

/**
 * Every change to stock, never edited or deleted. `delta` is the change to
 * the column the reason affects (see `INVENTORY_MOVEMENT_REASON_VALUES`):
 * reserving adds to `reserved`, releasing takes from it, fulfilling takes
 * from `on_hand`, and an adjustment moves `on_hand` either way. Reserving,
 * releasing and fulfilling always belong to an order request.
 */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict", onUpdate: "cascade" }),
    delta: integer("delta").notNull(),
    reason: inventoryMovementReasonEnum("reason").notNull(),
    orderRequestId: uuid("order_request_id").references(() => orderRequests.id, {
      onDelete: "restrict",
    }),
    /** Who made the change, e.g. `system` or an admin user. */
    actor: text("actor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inventory_movements_variant_id_created_at_idx").on(t.variantId, t.createdAt),
    index("inventory_movements_order_request_id_idx").on(t.orderRequestId),
    check("inventory_movements_delta_non_zero", sql`${t.delta} <> 0`),
    check(
      "inventory_movements_delta_direction",
      sql`(${t.reason} = 'reserve' AND ${t.delta} > 0) OR (${t.reason} IN ('release', 'fulfil') AND ${t.delta} < 0) OR ${t.reason} = 'adjust'`,
    ),
    check(
      "inventory_movements_order_link",
      sql`${t.reason} = 'adjust' OR ${t.orderRequestId} IS NOT NULL`,
    ),
    check("inventory_movements_actor_present", sql`length(btrim(${t.actor})) > 0`),
  ],
);
