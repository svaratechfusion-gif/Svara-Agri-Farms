import { formatMoney } from "@/lib/commerce/money";
import type { OrderTotals } from "@/lib/commerce/pricing";
import type { Money } from "@/lib/commerce/types";

export interface SummaryRow {
  key: string;
  name: string;
  variantLabel: string;
  quantity: number;
  unitPrice: Money | null;
  lineTotal: Money | null;
}

interface OrderSummaryProps {
  rows: readonly SummaryRow[];
  /** Null when nothing in it can be priced. */
  totals: OrderTotals | null;
  heading?: string;
  /** Id for the heading, when something else points at it. */
  headingId?: string;
  /** Replaces the default note under the totals. */
  note?: string;
}

function Amount({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  // The total is set apart by a rule above it (still one row of the <dl>).
  const row = strong
    ? "mt-2 flex items-baseline justify-between gap-4 border-t border-[color:var(--vein)] pt-3 pb-1.5"
    : "flex items-baseline justify-between gap-4 py-1.5";
  return (
    <div className={row}>
      <dt className={strong ? "type-label" : "type-small text-ink-soft"}>{label}</dt>
      <dd className={strong ? "type-h4 tabular-nums" : "type-small tabular-nums"}>{value}</dd>
    </div>
  );
}

/**
 * The items and their totals, as listed in the cart, at checkout and on the
 * confirmation. Every amount is computed from the catalogue (and saved by the
 * server); a delivery charge or tax that is not configured reads "to be
 * confirmed", never zero.
 */
export function OrderSummary({
  rows,
  totals,
  heading = "Order summary",
  headingId,
  note,
}: OrderSummaryProps) {
  const delivery = totals?.deliveryCharge;
  return (
    <section aria-label={heading} className="leaf-plate-sm bg-ivory-deep/70 p-6 sm:p-7">
      <h2 id={headingId} className="type-label text-earth-ink">
        {heading}
      </h2>
      <ul className="mt-4 divide-y divide-[color:var(--vein)]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-4 py-3">
            <span>
              <span className="block type-small text-forest">{row.name}</span>
              <span className="block type-small text-ink-soft tabular-nums">
                {row.variantLabel} × {row.quantity}
                {row.unitPrice && ` · ${formatMoney(row.unitPrice)} each`}
              </span>
            </span>
            <span className="type-small tabular-nums">
              {row.lineTotal ? formatMoney(row.lineTotal) : "—"}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 border-t border-[color:var(--vein)] pt-3">
        <Amount label="Subtotal" value={totals ? formatMoney(totals.subtotal) : "—"} />
        <Amount label="Delivery" value={delivery ? formatMoney(delivery) : "To be confirmed"} />
        {totals?.tax && (
          <Amount
            label={totals.taxIncluded ? "Tax (included)" : "Tax"}
            value={formatMoney(totals.tax)}
          />
        )}
        <Amount
          strong
          label={delivery ? "Total" : "Total before delivery"}
          value={totals ? formatMoney(totals.total) : "—"}
        />
      </dl>
      <p className="mt-3 type-small text-ink-soft">
        {note ??
          (totals?.isFinal
            ? "Our team confirms your order before any payment is requested."
            : "Delivery charges are not included yet. Our team will confirm availability, delivery charges and payment with you.")}
      </p>
    </section>
  );
}
