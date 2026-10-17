import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { adminRoleEnum } from "./enums";

/**
 * People who can manage orders. Emails are stored lower-case so each person
 * has one account. Nothing signs in yet: authentication is a later phase,
 * and only a password hash (never a password) may be stored here.
 */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: adminRoleEnum("role").notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("admin_users_email_key").on(t.email),
    check("admin_users_email_normalised", sql`${t.email} = lower(btrim(${t.email}))`),
    check("admin_users_email_shape", sql`${t.email} LIKE '_%@_%'`),
    check("admin_users_password_hash_present", sql`length(${t.passwordHash}) > 0`),
  ],
);
