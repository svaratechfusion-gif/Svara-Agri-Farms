import type { ReactNode } from "react";

interface NoteBoxProps {
  label: string;
  /** Right-hand mono note in the box header. */
  meta?: string;
  children: ReactNode;
  className?: string;
}

/** A parchment aside with a ruled mono header — the Stitch "register" box. */
export function NoteBox({ label, meta, children, className = "" }: NoteBoxProps) {
  return (
    <aside className={`bg-parchment/60 px-5 py-5 sm:px-6 sm:py-6 ${className}`}>
      <div className="flex items-baseline justify-between gap-4 border-b hairline pb-3">
        <p className="type-label text-ink">{label}</p>
        {meta && <p className="type-label text-ink-soft">{meta}</p>}
      </div>
      <div className="mt-4 type-small text-ink-soft">{children}</div>
    </aside>
  );
}
