"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { findVariant, isPurchasable } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/money";
import { AVAILABILITY_LABEL } from "@/lib/commerce/availability";
import type { Product } from "@/lib/commerce/types";

import { LeafButton } from "@/components/ui/LeafButton";
import { HandLeafIcon, MillIcon, ShadeTrayIcon, SproutIcon } from "@/components/ui/processIcons";

import { useCart } from "./CartProvider";
import { QuantitySelector } from "./QuantitySelector";
import { VariantSelector } from "./VariantSelector";

/** How the product is made — the same facts the copy states elsewhere. */
const MAKING = [
  { label: "Grown on our farm", Icon: SproutIcon },
  { label: "Gathered by hand", Icon: HandLeafIcon },
  { label: "Dried in the shade", Icon: ShadeTrayIcon },
  { label: "Milled with care", Icon: MillIcon },
] as const;

interface ProductInformationProps {
  product: Product;
  headingLevel: "h1" | "h2";
}

export function ProductInformation({ product, headingLevel }: ProductInformationProps) {
  const Heading = headingLevel;
  const variantGroup = useId();
  const router = useRouter();
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState("");

  const variant = findVariant(product, variantId) ?? product.variants[0];
  // Only a size with a price that is available can go in the cart.
  const canAdd = isPurchasable(variant);
  const hasProvisionalData = product.variants.some((entry) => entry.isProvisional);
  const unavailableNote = `${variant.label} is ${AVAILABILITY_LABEL[variant.availability].toLowerCase()} and cannot be ordered yet.`;

  const handleAdd = () => {
    if (addItem(product.slug, variant.id, quantity) === "added") {
      setConfirmation(`${quantity} × ${product.name}, ${variant.label} added to your cart.`);
    } else {
      setConfirmation(unavailableNote);
    }
  };

  const handleBuyNow = () => {
    if (addItem(product.slug, variant.id, quantity) === "added") router.push("/cart");
    else setConfirmation(unavailableNote);
  };

  return (
    <div className="flex flex-col">
      <p className="flex items-center gap-3 type-label text-earth-ink">
        <span>{product.botanicalName}</span>
        <span aria-hidden="true" className="h-px w-6 bg-harvest" />
        <span>{AVAILABILITY_LABEL[variant.availability]}</span>
      </p>
      <Heading className="mt-5 type-h1 text-forest">{product.name}</Heading>
      <p className="mt-4 type-h3 text-ink-soft italic">{product.tagline}</p>

      <p className="mt-8 border-t hairline pt-6 type-h2">
        {variant.price ? (
          formatMoney(variant.price)
        ) : (
          <span className="type-h3 text-ink-soft">Price to be announced</span>
        )}
      </p>

      <p className="mt-6 max-w-lg type-body text-ink-soft">{product.description}</p>

      <form
        className="mt-10 flex flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          handleAdd();
        }}
      >
        <VariantSelector
          name={variantGroup}
          variants={product.variants}
          selectedId={variantId}
          onChange={setVariantId}
        />

        <div>
          <p className="type-label text-earth-ink">Quantity</p>
          <div className="mt-3">
            <QuantitySelector label="Quantity" value={quantity} onChange={setQuantity} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <LeafButton
            type="submit"
            size="lg"
            icon="leaf"
            className="sm:flex-1"
            disabled={!canAdd}
            aria-describedby={canAdd ? undefined : `${variantGroup}-unavailable`}
          >
            Add to cart
          </LeafButton>
          <LeafButton
            variant="secondary"
            size="lg"
            icon="arrow"
            className="sm:flex-1"
            disabled={!canAdd}
            onClick={handleBuyNow}
          >
            Buy now
          </LeafButton>
        </div>
        {!canAdd && (
          <p id={`${variantGroup}-unavailable`} className="type-small text-ink-soft">
            {unavailableNote}
          </p>
        )}
        <p className="min-h-6 type-small text-botanical" role="status" aria-live="polite">
          {confirmation}
        </p>
      </form>

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
