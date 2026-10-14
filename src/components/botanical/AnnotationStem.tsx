import type { ReactNode } from "react";

import { LeafletMark } from "./LeafletMark";

interface AnnotationStemProps {
  children: ReactNode;
  className?: string;
}

/**
 * A field annotation on photography: a fine vertical vein that runs from the
 * metadata line down past the headline, topped by a single leaflet.
 */
export function AnnotationStem({ children, className = "" }: AnnotationStemProps) {
  return (
    <div className={`relative pl-7 sm:pl-10 ${className}`}>
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-3 left-[0.45rem] w-px bg-ivory/35 sm:left-[0.7rem]"
      />
      <span aria-hidden="true" className="absolute top-0 left-0 text-harvest">
        <LeafletMark variant="filled" size={18} rotate={-60} />
      </span>
      {children}
    </div>
  );
}
