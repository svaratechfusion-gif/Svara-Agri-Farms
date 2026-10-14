"use client";

import { formatMoney } from "@/lib/commerce/money";
import type { ProductVariant } from "@/lib/commerce/types";

interface VariantSelectorProps {
  name: string;
  variants: readonly ProductVariant[];
  selectedId: string;
  onChange: (variantId: string) => void;
}

export function VariantSelector({ name, variants, selectedId, onChange }: VariantSelectorProps) {
  return (
    <fieldset>
      <legend className="type-label text-earth-ink">Size</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {variants.map((variant) => {
          const checked = variant.id === selectedId;
          return (
            <label
              key={variant.id}
              className={`leaf-shape flex cursor-pointer items-center justify-between gap-4 border px-5 py-3.5 transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-botanical ${
                checked ? "border-forest bg-ivory" : "border-ink/20 hover:border-ink/45"
              }`}
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
                <span className="type-small font-medium whitespace-nowrap">{variant.label}</span>
              </span>
              <span className="type-label whitespace-nowrap text-ink-soft">
                {variant.price ? formatMoney(variant.price) : "Price TBC"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
