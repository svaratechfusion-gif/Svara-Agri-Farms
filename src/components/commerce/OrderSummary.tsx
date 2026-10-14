import { formatMoney } from "@/lib/commerce/money";
import type { Money } from "@/lib/commerce/types";

export interface SummaryRow {
  key: string;
  name: string;
  variantLabel: string;
  quantity: number;
  lineTotal: Money | null;
}

interface OrderSummaryProps {
  rows: readonly SummaryRow[];
  subtotal: Money | null;
  heading?: string;
}

/**
 * The products and their subtotal, as listed in the cart, at checkout and on
 * the confirmation. Only the product subtotal is shown: delivery charges,
 * taxes and discounts are not set by the site.
 */
export function OrderSummary({ rows, subtotal, heading = "Order summary" }: OrderSummaryProps) {
  return (
    <section
      aria-label={heading}
      className="leaf-plate-sm border border-[color:var(--vein)] bg-ivory-deep/60 p-6"
    >
      <h2 className="type-label text-earth-ink">{heading}</h2>
      <ul className="mt-4 divide-y divide-[color:var(--vein)]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-4 py-3">
            <span>
              <span className="block type-small text-forest">{row.name}</span>
              <span className="block type-small text-ink-soft">
                {row.variantLabel} × {row.quantity}
              </span>
            </span>
            <span className="type-small tabular-nums">
              {row.lineTotal ? formatMoney(row.lineTotal) : "—"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-[color:var(--vein)] pt-4">
        <span className="type-label">Product subtotal</span>
        <span className="type-h4 tabular-nums">{subtotal ? formatMoney(subtotal) : "—"}</span>
      </div>
      <p className="mt-3 type-small text-ink-soft">
        Delivery charges are not included. The SVARA Farms team will confirm availability, delivery
        charges and payment arrangements with you.
      </p>
    </section>
  );
}
