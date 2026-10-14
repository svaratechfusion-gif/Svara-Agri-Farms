import { LeafletMark } from "@/components/botanical/LeafletMark";

interface SectionHeaderProps {
  /** Chapter number. Kept for the chapter vein and folios; not printed here. */
  index?: string;
  label: string;
  aside?: string;
  tone?: "dark" | "light";
  align?: "start" | "center";
}

/**
 * The eyebrow that opens a section: one leaflet and a short label, with an
 * optional italic aside. Quiet on purpose — the heading beneath carries the
 * section. Inside a `Stem` the leaflet also branches out to the margin vein
 * (`.branch-node`).
 */
export function SectionHeader({
  label,
  aside,
  tone = "dark",
  align = "start",
}: SectionHeaderProps) {
  const labelColor = tone === "light" ? "text-harvest" : "text-earth-ink";
  const asideColor = tone === "light" ? "text-ivory/75" : "text-ink-soft";
  const leaf = tone === "light" ? "text-harvest" : "text-botanical";
  const layout =
    align === "center"
      ? "flex-col items-center text-center"
      : "flex-wrap items-baseline justify-between";
  return (
    <div className={`relative flex gap-x-8 gap-y-2 ${layout}`}>
      <span aria-hidden="true" className="branch-node">
        <LeafletMark variant="filled" size={18} rotate={-150} />
      </span>
      <p className={`inline-flex items-center gap-2.5 type-label ${labelColor}`}>
        <span aria-hidden="true" className={leaf}>
          <LeafletMark variant="filled" size={12} rotate={-30} />
        </span>
        {label}
      </p>
      {aside && <p className={`type-caption ${asideColor}`}>{aside}</p>}
    </div>
  );
}
