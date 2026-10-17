"use client";

import { MAX_QUANTITY_PER_LINE, MIN_QUANTITY } from "@/lib/commerce/cart";

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  label: string;
  size?: "regular" | "compact";
}

export function QuantitySelector({
  value,
  onChange,
  label,
  size = "regular",
}: QuantitySelectorProps) {
  const height = size === "compact" ? "h-11" : "h-12";
  const buttonClass = `flex ${height} w-12 items-center justify-center text-lg text-ink transition-colors hover:bg-ivory-deep disabled:cursor-not-allowed disabled:text-ink/30`;
  return (
    <div
      role="group"
      aria-label={label}
      className="leaf-shape inline-flex items-stretch overflow-hidden border border-ink/25"
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= MIN_QUANTITY}
        aria-label="Decrease quantity"
      >
        <span aria-hidden="true">−</span>
      </button>
      <output
        aria-live="polite"
        aria-label="Quantity"
        className={`flex ${height} min-w-10 items-center justify-center border-x border-ink/15 font-mono text-sm tabular-nums`}
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY_PER_LINE}
        aria-label="Increase quantity"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
