import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { productVariants } from "./productVariants";

/**
 * Stock for each size. `reserved` is held for order requests that have not
 * been fulfilled yet, so it can never exceed what is on hand. A size with no
 * row has no recorded stock.
 */
export const inventory = pgTable(
  "inventory",
  {
    variantId: text("variant_id")
      .primaryKey()
      .references(() => productVariants.id, { onDelete: "restrict", onUpdate: "cascade" }),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("inventory_on_hand_non_negative", sql`${t.onHand} >= 0`),
    check("inventory_reserved_non_negative", sql`${t.reserved} >= 0`),
    check("inventory_reserved_within_on_hand", sql`${t.reserved} <= ${t.onHand}`),
  ],
);
