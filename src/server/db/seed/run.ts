/**
 * `npm run db:seed` — copies the sizes in `content/products.ts` into
 * `product_variants`. Safe to run again: existing rows are never changed.
 */
import { catalogue } from "@/content/products";

import { createDatabase } from "../client";
import { loadLocalEnvFiles, toolingDatabaseUrl } from "../toolingEnv";

import { seedCatalogue } from "./catalogueSeed";

async function main(): Promise<number> {
  loadLocalEnvFiles();
  const url = toolingDatabaseUrl(process.env);
  if (!url) {
    console.error(
      "db:seed needs DATABASE_URL (or DATABASE_URL_UNPOOLED) in the environment or .env.local.",
    );
    return 1;
  }

  const db = createDatabase(url);
  try {
    const report = await seedCatalogue(db, catalogue);
    console.log(`Added ${report.inserted.length}: ${report.inserted.join(", ") || "none"}`);
    console.log(
      `Already present, unchanged ${report.kept.length}: ${report.kept.join(", ") || "none"}`,
    );
    for (const difference of report.differences) {
      console.log(
        `  ${difference.id}.${difference.field}: database ${String(difference.inDatabase)}, catalogue ${String(difference.inCatalogue)} (database kept)`,
      );
    }
    return 0;
  } finally {
    await db.$client.end();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    // The database's own reason (e.g. connection refused) is on `cause`.
    const reason =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : String(error);
    console.error("db:seed failed:", reason);
    process.exitCode = 1;
  },
);
