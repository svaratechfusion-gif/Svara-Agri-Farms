import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Request counts per client and time window, shared by every server
 * instance (the current limiter only counts within one process). Old
 * windows can be deleted by `window_start`.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => [
    primaryKey({ name: "rate_limits_pkey", columns: [t.key, t.windowStart] }),
    index("rate_limits_window_start_idx").on(t.windowStart),
    check("rate_limits_count_positive", sql`${t.count} > 0`),
  ],
);
