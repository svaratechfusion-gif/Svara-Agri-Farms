import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { PHONE_PATTERN } from "./rules";

/**
 * People who have sent an order request, one per phone number (stored as
 * `normalizePhone` writes it, e.g. +919876543210). What they entered on each
 * request is also kept on the request itself.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("customers_phone_key").on(t.phone),
    check("customers_phone_format", sql`${t.phone} ~ ${sql.raw(`'${PHONE_PATTERN}'`)}`),
    check("customers_full_name_present", sql`length(btrim(${t.fullName})) > 0`),
    check("customers_email_shape", sql`${t.email} IS NULL OR ${t.email} LIKE '_%@_%'`),
  ],
);
