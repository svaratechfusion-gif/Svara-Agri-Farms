interface FolioProps {
  /** Left-hand running title. */
  title: string;
  /** Right-hand page marker, e.g. "Chapter 02 of 11". */
  marker: string;
  className?: string;
}

/** The running foot of a chapter, like a printed monograph's folio line. */
export function Folio({ title, marker, className = "" }: FolioProps) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t hairline pt-5 ${className}`}
    >
      <p className="type-label text-ink-soft">{title}</p>
      <p className="type-label text-ink">{marker}</p>
    </div>
  );
}
