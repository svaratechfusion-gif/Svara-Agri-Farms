import { defineConfig } from "drizzle-kit";

import { loadLocalEnvFiles, toolingDatabaseUrl } from "./src/server/db/toolingEnv";

loadLocalEnvFiles();
const url = toolingDatabaseUrl(process.env);

// `db:generate` needs no database; `db:migrate` needs DATABASE_URL(_UNPOOLED).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  strict: true,
  verbose: true,
  ...(url ? { dbCredentials: { url } } : {}),
});
