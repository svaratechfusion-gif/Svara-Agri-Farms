"use client";

import { HandLeafIcon, MillIcon, ShadeTrayIcon, SproutIcon } from "@/components/ui/processIcons";
import { AVAILABILITY_LABEL, productAvailability } from "@/lib/commerce/availability";
import type { FeaturedProduct } from "@/lib/commerce/types";

import { PurchaseControls } from "./PurchaseControls";

/** How the product is made — the same facts the copy states elsewhere. */
const MAKING = [
  { label: "Grown on our farm", Icon: SproutIcon },
  { label: "Gathered by hand", Icon: HandLeafIcon },
  { label: "Dried in the shade", Icon: ShadeTrayIcon },
  { label: "Milled with care", Icon: MillIcon },
] as const;

interface ProductInformationProps {
  product: FeaturedProduct;
  headingLevel: "h1" | "h2";
}

export function ProductInformation({ product, headingLevel }: ProductInformationProps) {
  const Heading = headingLevel;
  const hasProvisionalData = product.variants.some((entry) => entry.isProvisional);

  return (
    <div className="flex flex-col">
      <p className="flex items-center gap-3 type-label text-earth-ink">
        <span>{product.botanicalName}</span>
        <span aria-hidden="true" className="h-px w-6 bg-harvest" />
        <span>{AVAILABILITY_LABEL[productAvailability(product)]}</span>
      </p>
      <Heading className="mt-5 type-h1 text-forest">{product.name}</Heading>
      <p className="mt-4 type-h3 text-ink-soft italic">{product.tagline}</p>

      <PurchaseControls product={product}>
        <p className="mt-6 max-w-lg type-body text-ink-soft">{product.description}</p>
      </PurchaseControls>

      <ul className="mb-8 grid grid-cols-2 gap-x-4 gap-y-3 border-t hairline pt-6">
        {MAKING.map(({ label, Icon }) => (
          <li key={label} className="flex items-center gap-2.5 type-small text-ink-soft">
            <Icon size={20} className="shrink-0 text-botanical" />
            {label}
          </li>
        ))}
      </ul>

      {hasProvisionalData && (
        <p className="border-l-2 border-harvest pl-4 type-small text-ink-soft">
          Pack sizes and pricing are being finalised. Ordering opens for each size once its price
          and availability are confirmed.
        </p>
      )}
    </div>
  );
}
