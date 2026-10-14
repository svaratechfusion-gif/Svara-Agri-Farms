export type ImageTagPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const POSITION: Record<ImageTagPosition, string> = {
  "top-left": "top-4 left-4 sm:top-6 sm:left-6",
  "top-right": "top-4 right-4 sm:top-6 sm:right-6",
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
};

interface ImageTagProps {
  children: string;
  position: ImageTagPosition;
  tone?: "light" | "forest";
}

/** A small mono label pinned to a photograph's corner, as on the Stitch plates. */
export function ImageTag({ children, position, tone = "light" }: ImageTagProps) {
  const colors = tone === "forest" ? "bg-forest text-ivory" : "bg-ivory/92 text-ink";
  // Tags use the seed form — the compact oval of the botanical system.
  return (
    <span
      className={`absolute z-10 seed max-w-[calc(100%-1.5rem)] overflow-hidden ${colors} ${POSITION[position]}`}
    >
      {children}
    </span>
  );
}
