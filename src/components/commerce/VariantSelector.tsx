"use client";

import { AVAILABILITY_LABEL, sizeAvailability } from "@/lib/commerce/availability";
import { isPurchasable } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/money";
import type { Product } from "@/lib/commerce/types";

interface VariantSelectorProps {
  name: string;
  product: Product;
  selectedId: string;
  onChange: (variantId: string) => void;
  /** Two columns at every width (narrow cards). */
  compact?: boolean;
}

/**
 * The pack sizes as large tap targets. Each shows its price when it can be
 * ordered, otherwise its state ("Coming soon", "In preparation", …), so a
 * size that cannot be ordered never looks like one that can.
 */
export function VariantSelector({
  name,
  product,
  selectedId,
  onChange,
  compact = false,
}: VariantSelectorProps) {
  const columns = compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2";
  return (
    <fieldset>
      <legend className="type-label text-earth-ink">Size</legend>
      <div className={`mt-3 grid gap-3 ${columns}`}>
        {product.variants.map((variant) => {
          const checked = variant.id === selectedId;
          const orderable = isPurchasable(product, variant);
          const state = checked ? "border-forest bg-ivory" : "border-ink/20 hover:border-ink/45";
          const spacing = compact ? "gap-x-2 px-3" : "gap-x-4 px-4 sm:px-5";
          return (
            <label
              key={variant.id}
              className={`leaf-shape flex min-h-12 cursor-pointer flex-wrap items-center justify-between gap-y-1 border py-3 transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-botanical ${spacing} ${state}`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name={name}
                  value={variant.id}
                  checked={checked}
                  onChange={() => onChange(variant.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid size-4 place-items-center rounded-full border ${
                    checked ? "border-forest" : "border-ink/40"
                  }`}
                >
                  {checked && <span className="size-2 rounded-full bg-harvest" />}
                </span>
                <span className="type-small font-medium whitespace-nowrap">
                  {compact ? `${variant.weightGrams} g` : variant.label}
                </span>
              </span>
              <span className="type-label whitespace-nowrap text-ink-soft">
                {orderable && variant.price
                  ? formatMoney(variant.price)
                  : [
                      variant.price && formatMoney(variant.price),
                      AVAILABILITY_LABEL[sizeAvailability(product, variant)],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
