import "server-only";

import { asc } from "drizzle-orm";

import type { Availability, Money } from "@/lib/commerce/types";
import type { Database } from "@/server/db/client";
import { productVariants } from "@/server/db/schema";

/** A size's commercial state as stored in the database. */
export interface VariantCommercialState {
  id: string;
  productSlug: string;
  price: Money | null;
  availability: Availability;
  updatedAt: Date;
  updatedBy: string;
}

/** Every size's price and availability, ordered by product then size ID. */
export async function listVariantCommercialState(db: Database): Promise<VariantCommercialState[]> {
  const rows = await db
    .select()
    .from(productVariants)
    .orderBy(asc(productVariants.productSlug), asc(productVariants.id));
  return rows.map((row) => ({
    id: row.id,
    productSlug: row.productSlug,
    price: row.priceMinor === null ? null : { amountMinor: row.priceMinor, currency: row.currency },
    availability: row.availability,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  }));
}
