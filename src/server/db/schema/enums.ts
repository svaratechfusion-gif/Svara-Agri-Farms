import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Value sets shared by several tables. Each mirrors a rule that already
 * exists in `src/lib/commerce`; `__tests__/schemaRules.test.ts` fails if
 * they drift apart.
 */

/** Same values as `Availability` in `lib/commerce/types.ts`. */
export const AVAILABILITY_VALUES = [
  "available",
  "coming-soon",
  "sold-out",
  "in-preparation",
] as const;

/** Same values as `CurrencyCode` in `lib/commerce/types.ts`. */
export const CURRENCY_VALUES = ["INR"] as const;

/** Same values as `ORDER_STATUSES` in `lib/commerce/orderStatus.ts`. */
export const ORDER_REQUEST_STATUS_VALUES = [
  "requested",
  "confirmed",
  "payment-pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;

/** Same values as `PaymentState` in `lib/commerce/payment.ts`. */
export const PAYMENT_STATUS_VALUES = [
  "not-collected",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "expired",
] as const;

/**
 * Why stock changed. `delta` on a movement is the change to the column the
 * reason affects: `reserve`/`release` change `inventory.reserved`;
 * `fulfil`/`adjust` change `inventory.on_hand`.
 */
export const INVENTORY_MOVEMENT_REASON_VALUES = ["reserve", "release", "fulfil", "adjust"] as const;

export const ADMIN_ROLE_VALUES = ["owner", "staff"] as const;

export const availabilityEnum = pgEnum("availability", AVAILABILITY_VALUES);
export const currencyEnum = pgEnum("currency", CURRENCY_VALUES);
export const orderRequestStatusEnum = pgEnum("order_request_status", ORDER_REQUEST_STATUS_VALUES);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUS_VALUES);
export const inventoryMovementReasonEnum = pgEnum(
  "inventory_movement_reason",
  INVENTORY_MOVEMENT_REASON_VALUES,
);
export const adminRoleEnum = pgEnum("admin_role", ADMIN_ROLE_VALUES);

export type OrderRequestStatusValue = (typeof ORDER_REQUEST_STATUS_VALUES)[number];
export type AdminRole = (typeof ADMIN_ROLE_VALUES)[number];
