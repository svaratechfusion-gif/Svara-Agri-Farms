import "server-only";

import { z } from "zod";

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

const postgresUrl = z
  .string()
  .trim()
  .min(1, "is required")
  .refine((value) => {
    try {
      return POSTGRES_PROTOCOLS.has(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "must be a postgres:// or postgresql:// connection string");

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Pooled connection string (Neon's `-pooler` host). Server only. */
  DATABASE_URL: postgresUrl,
  /** Public origin of the site. Optional: `lib/seo.ts` falls back to Vercel's URL. */
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Raw variables, as in `process.env`. */
export type EnvSource = Readonly<Record<string, string | undefined>>;

/**
 * A `NEXT_PUBLIC_*` variable is copied into the browser bundle, so a
 * database connection string must never be in one.
 */
function publicConnectionStrings(source: EnvSource): string[] {
  return Object.entries(source)
    .filter(
      ([key, value]) => key.startsWith("NEXT_PUBLIC_") && /^postgres(ql)?:\/\//i.test(value ?? ""),
    )
    .map(([key]) => key);
}

/**
 * Validates the server's environment. Messages name the variable and the
 * problem, never its value, so they are safe to log.
 */
export function parseServerEnv(source: EnvSource): ServerEnv {
  const leaked = publicConnectionStrings(source);
  if (leaked.length > 0) {
    throw new Error(
      `Invalid environment: ${leaked.join(", ")} holds a database connection string, which would be sent to browsers. Use DATABASE_URL instead.`,
    );
  }
  const result = serverEnvSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    DATABASE_URL: source.DATABASE_URL ?? "",
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL || undefined,
  });
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`);
    throw new Error(`Invalid environment: ${problems.join("; ")}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/**
 * The validated environment, read on first use. It is not checked at
 * build or start-up: only the database order-request store
 * (`ORDER_REQUESTS_STORE=database`) needs it.
 */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
