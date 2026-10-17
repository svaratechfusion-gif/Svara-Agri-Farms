import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { DeliveryDetails } from "@/lib/commerce/delivery";

import { customers } from "./customers";
import { currencyEnum, orderRequestStatusEnum, paymentStatusEnum } from "./enums";
import { ORDER_REFERENCE_PATTERN, SHA256_HEX_PATTERN } from "./rules";

/**
 * An order: what the customer asked for, where to deliver it, what it costs
 * and where it stands. Amounts are computed by the server (`lib/commerce/
 * pricing.ts`): total = subtotal + delivery charge + tax (unless the tax is
 * already included in prices). A null delivery charge or tax means "not
 * configured — to be confirmed by the team", never zero.
 *
 * `status` follows `lib/commerce/orderStatus.ts`; `payment_status` and
 * `payment_reference` change only through a verified payment provider event.
 *
 * `delivery_address` is the cleaned delivery details exactly as submitted
 * (`DeliveryDetails`), kept even if the customer's record changes later.
 * `submission_key_hash` makes a retried submission save only once.
 */
export const orderRequests = pgTable(
  "order_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    deliveryAddress: jsonb("delivery_address").$type<DeliveryDetails>().notNull(),
    /** Products only, in minor units. */
    subtotalMinor: integer("subtotal_minor").notNull(),
    /** Null while no delivery rule is configured. */
    deliveryChargeMinor: integer("delivery_charge_minor"),
    /** Null while no tax rule is configured. */
    taxMinor: integer("tax_minor"),
    /** The tax is already inside the prices (shown, not added). */
    taxIncluded: boolean("tax_included").notNull().default(false),
    totalMinor: integer("total_minor").notNull(),
    currency: currencyEnum("currency").notNull().default("INR"),
    status: orderRequestStatusEnum("status").notNull().default("requested"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("not-collected"),
    /** The payment provider's payment ID, once one exists. */
    paymentReference: text("payment_reference"),
    /** Internal team notes. */
    notes: text("notes"),
    submissionKeyHash: text("submission_key_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("order_requests_reference_key").on(t.reference),
    uniqueIndex("order_requests_submission_key_hash_key").on(t.submissionKeyHash),
    uniqueIndex("order_requests_payment_reference_key").on(t.paymentReference),
    index("order_requests_customer_id_idx").on(t.customerId),
    index("order_requests_status_created_at_idx").on(t.status, t.createdAt.desc()),
    index("order_requests_created_at_idx").on(t.createdAt.desc()),
    check(
      "order_requests_reference_format",
      sql`${t.reference} ~ ${sql.raw(`'${ORDER_REFERENCE_PATTERN}'`)}`,
    ),
    check(
      "order_requests_submission_key_hash_format",
      sql`${t.submissionKeyHash} ~ ${sql.raw(`'${SHA256_HEX_PATTERN}'`)}`,
    ),
    check("order_requests_subtotal_positive", sql`${t.subtotalMinor} > 0`),
    check(
      "order_requests_charges_not_negative",
      sql`coalesce(${t.deliveryChargeMinor}, 0) >= 0 AND coalesce(${t.taxMinor}, 0) >= 0`,
    ),
    check(
      "order_requests_total_adds_up",
      sql`${t.totalMinor} = ${t.subtotalMinor} + coalesce(${t.deliveryChargeMinor}, 0) + CASE WHEN ${t.taxIncluded} THEN 0 ELSE coalesce(${t.taxMinor}, 0) END`,
    ),
    check(
      "order_requests_delivery_address_object",
      sql`jsonb_typeof(${t.deliveryAddress}) = 'object'`,
    ),
  ],
);
