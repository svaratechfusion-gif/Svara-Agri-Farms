import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { availabilityEnum, currencyEnum } from "./enums";
import { VARIANT_ID_PATTERN } from "./rules";

/**
 * The commercial state of each size: price and availability. Editorial copy
 * (names, descriptions, photos) stays in `src/content/products.ts`; `id` is
 * the variant ID used there and in carts.
 *
 * A size can only be `available` with a price, matching the site's rule that
 * only priced, available sizes can be ordered.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productSlug: text("product_slug").notNull(),
    /** Minor units (paise). `null` until the business sets a price. */
    priceMinor: integer("price_minor"),
    currency: currencyEnum("currency").notNull().default("INR"),
    availability: availabilityEnum("availability").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    /** Who made the last change, e.g. `seed` or an admin user. */
    updatedBy: text("updated_by").notNull(),
  },
  (t) => [
    index("product_variants_product_slug_idx").on(t.productSlug),
    check("product_variants_id_format", sql`${t.id} ~ ${sql.raw(`'${VARIANT_ID_PATTERN}'`)}`),
    check(
      "product_variants_product_slug_format",
      sql`${t.productSlug} ~ ${sql.raw(`'${VARIANT_ID_PATTERN}'`)}`,
    ),
    check("product_variants_price_positive", sql`${t.priceMinor} IS NULL OR ${t.priceMinor} > 0`),
    check(
      "product_variants_available_requires_price",
      sql`${t.availability} <> 'available' OR ${t.priceMinor} IS NOT NULL`,
    ),
    check("product_variants_updated_by_present", sql`length(btrim(${t.updatedBy})) > 0`),
  ],
);
