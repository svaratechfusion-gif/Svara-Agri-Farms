interface SectionLabelProps {
  index?: string;
  children: string;
  tone?: "dark" | "light";
  className?: string;
}

/** Small mono metadata label, e.g. "02 — The Philosophy". */
export function SectionLabel({
  index,
  children,
  tone = "dark",
  className = "",
}: SectionLabelProps) {
  const color = tone === "light" ? "text-ivory/90" : "text-earth-ink";
  const rule = tone === "light" ? "bg-ivory/40" : "bg-harvest";
  return (
    <p className={`flex items-center gap-3 type-label ${color} ${className}`}>
      {index && <span>{index}</span>}
      {index && <span aria-hidden="true" className={`h-px w-8 ${rule}`} />}
      <span>{children}</span>
    </p>
  );
}
