import type { ReactNode } from "react";

import { LeafletMark } from "./LeafletMark";

export interface ClusterItem {
  id: string;
  content: ReactNode;
}

interface LeafClusterProps {
  items: readonly ClusterItem[];
  /** What grows from the centre — a title or a single image. */
  centre?: ReactNode;
  label: string;
  className?: string;
}

/**
 * Leaf cluster: related ideas set alternately either side of a single stem,
 * each joined to it by a short vein — like leaflets along a rachis. On phones
 * the stem runs down the left edge and every item hangs from it.
 */
export function LeafCluster({ items, centre, label, className = "" }: LeafClusterProps) {
  return (
    <div className={className}>
      {centre && <div className="mb-10 md:mb-14 md:text-center">{centre}</div>}
      <ol
        aria-label={label}
        data-reveal="stem"
        className="relative grid gap-y-8 pl-10 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-[var(--vein)] md:grid-cols-2 md:gap-x-24 md:gap-y-4 md:pl-0 md:before:left-1/2"
      >
        {items.map((item, index) => {
          const left = index % 2 === 0;
          return (
            <li
              key={item.id}
              className={`relative ${left ? "md:col-start-1 md:text-right" : "md:col-start-2 md:mt-20"}`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-5 h-px w-7 bg-[var(--vein)] max-md:-left-[1.8rem] ${
                  left ? "md:-right-12" : "md:-left-12"
                } md:w-12`}
              />
              <span
                aria-hidden="true"
                className={`absolute top-[0.85rem] text-botanical max-md:-left-[2.45rem] ${
                  left ? "md:-right-[3.75rem]" : "md:-left-[3.75rem]"
                }`}
              >
                <LeafletMark variant="filled" size={18} rotate={left ? -140 : -40} />
              </span>
              {item.content}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
