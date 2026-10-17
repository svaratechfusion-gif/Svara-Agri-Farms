import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Environment for command-line tools (drizzle-kit, the seed), which Next.js
 * does not load. Next's own files are used, without overriding anything
 * already set in the shell.
 */
const LOCAL_ENV_FILES = [".env.local", ".env"];

export function loadLocalEnvFiles(directory: string = process.cwd()): void {
  for (const file of LOCAL_ENV_FILES) {
    const full = path.join(directory, file);
    if (existsSync(full)) process.loadEnvFile(full);
  }
}

/**
 * Migrations and the seed prefer Neon's direct connection
 * (`DATABASE_URL_UNPOOLED`, set by Vercel's Neon integration) over the
 * pooled one.
 */
export function toolingDatabaseUrl(
  env: Readonly<Record<string, string | undefined>>,
): string | undefined {
  return env.DATABASE_URL_UNPOOLED?.trim() || env.DATABASE_URL?.trim() || undefined;
}
