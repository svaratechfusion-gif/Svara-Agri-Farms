import { leafPath } from "@/content/journey";

interface PathIndexProps {
  highlight?: string;
  tone?: "dark" | "light";
  className?: string;
}

/** The leaf's full journey as a quiet typographic index: EARTH → … → HOME. */
export function PathIndex({ highlight, tone = "dark", className = "" }: PathIndexProps) {
  const base = tone === "light" ? "text-ivory/80" : "text-ink-soft";
  const active = tone === "light" ? "text-ivory" : "text-forest";
  return (
    <p className={`flex flex-wrap gap-x-2 gap-y-1 type-label ${base} ${className}`}>
      <span className="sr-only">The journey of a leaf: </span>
      {leafPath.map((step, index) => (
        <span key={step} className="inline-flex items-center gap-2">
          <span className={step === highlight ? active : undefined}>{step}</span>
          {index < leafPath.length - 1 && <span aria-hidden="true">→</span>}
        </span>
      ))}
    </p>
  );
}
