import type { PhotoKey } from "@/content/photos";

export type CurrencyCode = "INR";

/** Money is always stored in minor units (paise) to avoid float rounding. */
export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export type Availability = "available" | "coming-soon" | "sold-out";

export interface ProductVariant {
  id: string;
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

export interface Product {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  botanicalName: string;
  gallery: readonly PhotoKey[];
  variants: readonly ProductVariant[];
  details: readonly ProductDetailSection[];
  howToUse: readonly string[];
}

export interface CartLine {
  productSlug: string;
  variantId: string;
  quantity: number;
}

export interface Cart {
  lines: readonly CartLine[];
}
