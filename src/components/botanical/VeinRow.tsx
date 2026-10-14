import type { ReactNode } from "react";

import { LeafletMark } from "./LeafletMark";

export interface VeinRowItem {
  number: string;
  title: string;
  body: ReactNode;
  /** A quiet annotation at the foot of the item. */
  note?: string;
}

interface VeinRowProps {
  items: readonly VeinRowItem[];
  label: string;
  /** `annotation` is small mono text; `chapter` gives each item a serif title. */
  style?: "annotation" | "chapter";
  /** Keep one item per row at every width (for narrow columns). */
  stacked?: boolean;
  className?: string;
}

const COLUMNS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Related ideas hanging from one horizontal vein, each marked by a leaflet
 * where it leaves the rule — the secondary veins of a leaf, laid flat.
 */
export function VeinRow({
  items,
  label,
  style = "annotation",
  stacked = false,
  className = "",
}: VeinRowProps) {
  return (
    <ol
      aria-label={label}
      data-reveal="stagger"
      className={`grid gap-x-8 gap-y-10 border-t border-[color:var(--vein)] ${
        stacked ? "" : (COLUMNS[items.length] ?? "sm:grid-cols-3")
      } ${className}`}
    >
      {items.map((item, index) => (
        <li key={item.number} className="relative pt-7">
          <span aria-hidden="true" className="absolute -top-[0.45rem] left-0 text-botanical">
            <LeafletMark variant="filled" size={16} rotate={index % 2 === 0 ? -30 : -60} />
          </span>
          {style === "chapter" ? (
            <>
              <p className="type-label text-earth-ink">{item.number}</p>
              <h3 className="mt-3 type-h4">{item.title}</h3>
            </>
          ) : (
            <p className="type-label text-earth-ink">
              {item.number} · {item.title}
            </p>
          )}
          <div className={`${style === "chapter" ? "mt-3" : "mt-2"} type-small text-ink-soft`}>
            {item.body}
          </div>
          {item.note && <p className="mt-4 type-label text-earth-ink">{item.note}</p>}
        </li>
      ))}
    </ol>
  );
}
