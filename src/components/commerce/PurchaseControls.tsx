"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import { LeafButton } from "@/components/ui/LeafButton";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { AVAILABILITY_NOTE, sizeAvailability } from "@/lib/commerce/availability";
import { MAX_QUANTITY_PER_LINE } from "@/lib/commerce/cart";
import { findVariant, isPurchasable } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/money";
import type { Product } from "@/lib/commerce/types";
import { productEnquiry } from "@/lib/contact/whatsapp";

import { useCart, type AddResult } from "./CartProvider";
import { QuantitySelector } from "./QuantitySelector";
import { VariantSelector } from "./VariantSelector";

interface PurchaseControlsProps {
  product: Product;
  /** `full` on a product page (price, Buy now); `compact` on a card. */
  layout?: "full" | "compact";
  /** Rendered between the price and the size choice (e.g. the description). */
  children?: ReactNode;
}

/**
 * Choose a size and quantity, then add to the cart — for any catalogue
 * product. Everything comes from the catalogue: when a product or size
 * becomes available there, this enables itself; nothing here changes.
 */
export function PurchaseControls({ product, layout = "full", children }: PurchaseControlsProps) {
  const group = useId();
  const router = useRouter();
  const { addItem } = useCart();
  const firstOrderable = product.variants.find((variant) => isPurchasable(product, variant));
  const [variantId, setVariantId] = useState((firstOrderable ?? product.variants[0]).id);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const variant = findVariant(product, variantId) ?? product.variants[0];
  const canAdd = isPurchasable(product, variant);
  const what = `${product.name}, ${variant.label}`;
  const unavailableNote = `${variant.label}: ${AVAILABILITY_NOTE[sizeAvailability(product, variant)]}`;

  const describe = (result: AddResult): string | null => {
    switch (result) {
      case "added":
        return `${quantity} × ${what} added to your cart.`;
      case "capped":
        return `Added — your cart now holds the most we take per order: ${MAX_QUANTITY_PER_LINE} × ${what}.`;
      case "full":
        return `Your cart already holds the most we take per order: ${MAX_QUANTITY_PER_LINE} × ${what}.`;
      case "repeat":
        return null; // a double click: the first add's message stands
      case "unavailable":
        return unavailableNote;
    }
  };

  const add = (): AddResult => {
    const result = addItem(product.slug, variant.id, quantity);
    const text = describe(result);
    if (text !== null) setMessage(text);
    return result;
  };

  const full = layout === "full";
  return (
    <div className="flex flex-col">
      {full && (
        <p className="mt-8 border-t hairline pt-6 type-h2" aria-live="polite">
          {canAdd && variant.price ? (
            formatMoney(variant.price)
          ) : (
            <span className="type-h3 text-ink-soft">
              {variant.price ? formatMoney(variant.price) : "Price to be announced"}
            </span>
          )}
        </p>
      )}
      {children}
      <form
        data-mascot-avoid=""
        className={full ? "mt-10 flex flex-col gap-8" : "mt-5 flex flex-col gap-5"}
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <VariantSelector
          name={group}
          product={product}
          selectedId={variantId}
          onChange={(id) => {
            setVariantId(id);
            setMessage("");
          }}
          compact={!full}
        />
        <div>
          <p className="type-label text-earth-ink">Quantity</p>
          <div className="mt-3">
            <QuantitySelector
              label={`Quantity of ${product.name}`}
              value={quantity}
              onChange={setQuantity}
            />
          </div>
        </div>
        <div className={full ? "flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row" : "flex"}>
          <LeafButton
            type="submit"
            size="lg"
            icon="leaf"
            fullWidth={!full}
            className={full ? "sm:flex-1" : undefined}
            disabled={!canAdd}
            aria-describedby={canAdd ? undefined : `${group}-unavailable`}
          >
            Add to cart
          </LeafButton>
          {full && (
            <LeafButton
              variant="secondary"
              size="lg"
              icon="arrow"
              className="sm:flex-1"
              disabled={!canAdd}
              onClick={() => {
                if (add() !== "unavailable") router.push("/cart");
              }}
            >
              Buy now
            </LeafButton>
          )}
        </div>
        {!canAdd && (
          <p id={`${group}-unavailable`} className="type-small text-ink-soft">
            {unavailableNote}
          </p>
        )}
        <WhatsAppLink
          className="-my-2 self-start"
          message={productEnquiry({
            productName: product.name,
            weightGrams: variant.weightGrams,
            quantity,
          })}
        >
          {full ? "Ask about this product on WhatsApp" : "Ask on WhatsApp"}
        </WhatsAppLink>
        {/* Space is kept for the message, so nothing below moves when it appears. */}
        <p className="min-h-6 type-small text-botanical" role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </div>
  );
}
