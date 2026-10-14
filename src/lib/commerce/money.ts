import type { Money } from "./types";

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const cached = formatters.get(currency);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  formatters.set(currency, formatter);
  return formatter;
}

export function formatMoney(money: Money): string {
  return getFormatter(money.currency).format(money.amountMinor / 100);
}

export function multiplyMoney(money: Money, factor: number): Money {
  return { ...money, amountMinor: money.amountMinor * factor };
}

/**
 * Sums a list of prices. Returns `null` if any price is unknown, so the UI
 * never presents a partial total as if it were complete.
 */
export function sumMoney(values: readonly (Money | null)[]): Money | null {
  if (values.length === 0 || values.some((value) => value === null)) return null;
  const known = values as readonly Money[];
  const currency = known[0].currency;
  if (known.some((value) => value.currency !== currency)) {
    throw new Error("Cannot sum amounts in different currencies");
  }
  return {
    currency,
    amountMinor: known.reduce((total, value) => total + value.amountMinor, 0),
  };
}
