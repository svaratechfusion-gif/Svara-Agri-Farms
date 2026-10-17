import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { orderRequests } from "./orderRequests";
import { productVariants } from "./productVariants";
import { MAX_LINE_QUANTITY, MIN_LINE_QUANTITY } from "./rules";

/**
 * One size on an order request. The price, product name and size label are
 * copied as they were when the request was sent, so later catalogue changes
 * never rewrite a past request.
 */
export const orderRequestLines = pgTable(
  "order_request_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderRequestId: uuid("order_request_id")
      .notNull()
      .references(() => orderRequests.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict", onUpdate: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    sizeLabelSnapshot: text("size_label_snapshot").notNull(),
    /** The size's SKU when ordered (null on requests saved before SKUs existed). */
    skuSnapshot: text("sku_snapshot"),
  },
  (t) => [
    unique("order_request_lines_order_variant_key").on(t.orderRequestId, t.variantId),
    index("order_request_lines_variant_id_idx").on(t.variantId),
    check(
      "order_request_lines_quantity_range",
      sql`${t.quantity} BETWEEN ${sql.raw(String(MIN_LINE_QUANTITY))} AND ${sql.raw(String(MAX_LINE_QUANTITY))}`,
    ),
    check("order_request_lines_unit_price_positive", sql`${t.unitPriceMinor} > 0`),
    check(
      "order_request_lines_snapshots_present",
      sql`length(btrim(${t.productNameSnapshot})) > 0 AND length(btrim(${t.sizeLabelSnapshot})) > 0`,
    ),
  ],
);
