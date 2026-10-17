import type { CatalogueImageKey } from "@/content/catalogueImages";
import type { PhotoKey } from "@/content/photos";

export type CurrencyCode = "INR";

/** Money is always stored in minor units (paise) to avoid float rounding. */
export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

/**
 * What a customer may do with a product or size:
 *   available       — priced, and can be added to the cart
 *   coming-soon     — defined, but not open for orders until its price is confirmed
 *   in-preparation  — a pack still being prepared; shown as a preview only
 *   sold-out        — was available; none to order right now
 */
export type Availability = "available" | "coming-soon" | "in-preparation" | "sold-out";

/** One pack size of a product. */
export interface ProductVariant {
  /** Stable size ID used in carts, orders and the database, e.g. `moringa-powder-100g`. */
  id: string;
  /** Stock-keeping unit for this size. */
  sku: string;
  /** Net weight in grams. */
  weightGrams: number;
  /** Human label shown in the size selector, e.g. "100 g pouch". */
  label: string;
  /** `null` until real pricing is confirmed by the business. */
  price: Money | null;
  availability: Availability;
  /** Marks values that are design placeholders awaiting business data. */
  isProvisional: boolean;
}

export interface ProductDetailSection {
  id: string;
  label: string;
  title: string;
  body: string;
  photo: PhotoKey;
}

/**
 * A catalogue entry: everything commerce needs to show, price and order a
 * product. Every product in `content/products.ts` is one of these.
 */
export interface Product {
  /** Stable product ID. */
  id: string;
  slug: string;
  name: string;
  shortName: string;
  /** What it is made from, e.g. "Beetroot". */
  ingredient: string;
  /** `null` until approved copy exists. */
  description: string | null;
  /** Key of the pack shot (`content/catalogueImages.ts`) used on cards and in the cart. */
  image: CatalogueImageKey;
  /** The product as a whole. A size can be ordered only if this is `available` too. */
  availability: Availability;
  /** Position in listings, lowest first. */
  displayOrder: number;
  /** Tint of the sun arc behind the pack on preview cards. */
  tone: "earth" | "forest";
  variants: readonly ProductVariant[];
  /** Whether `/products/[slug]` exists for it (a `FeaturedProduct`). */
  hasProductPage: boolean;
}

/** A product with its own editorial product page. */
export interface FeaturedProduct extends Product {
  hasProductPage: true;
  description: string;
  tagline: string;
  botanicalName: string;
  gallery: readonly PhotoKey[];
  details: readonly ProductDetailSection[];
  howToUse: readonly string[];
}

export interface CartLine {
  productSlug: string;
  variantId: string;
  quantity: number;
  /**
   * The unit price (paise) the customer was shown for this size when they
   * added it or last accepted a price change. If the catalogue price differs,
   * the cart explains the change before the customer can go on.
   */
  seenPriceMinor?: number;
}

export interface Cart {
  lines: readonly CartLine[];
}
