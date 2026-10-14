interface ImageCaptionProps {
  /** Mono figure label, e.g. "Fig. 02 — Moringa branch". */
  label?: string;
  /** Italic serif caption. */
  caption?: string;
  tone?: "dark" | "light";
  className?: string;
}

/** The figure caption used beneath every photograph: mono label left, italic note right. */
export function ImageCaption({ label, caption, tone = "dark", className = "" }: ImageCaptionProps) {
  if (!label && !caption) return null;
  const labelColor = tone === "light" ? "text-ivory/80" : "text-earth-ink";
  const captionColor = tone === "light" ? "text-ivory/75" : "text-ink-soft";
  return (
    <figcaption
      className={`mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 ${className}`}
    >
      {label && <span className={`type-label ${labelColor}`}>{label}</span>}
      {caption && <span className={`type-caption ${captionColor}`}>{caption}</span>}
    </figcaption>
  );
}
