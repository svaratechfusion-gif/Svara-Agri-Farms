import type { ReactNode } from "react";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { LeafletMark } from "@/components/botanical/LeafletMark";
import { RevealHeading } from "@/components/editorial/RevealHeading";

interface PageIntroProps {
  label: string;
  /** One entry per typeset line. */
  title: readonly ReactNode[];
  lead?: string;
  aside?: ReactNode;
}

/**
 * Text-led page opening for supporting pages: warm sun-lit ivory, a quiet
 * eyebrow, the serif title, and one moringa leaf reaching in from the edge.
 */
export function PageIntro({ label, title, lead, aside }: PageIntroProps) {
  return (
    <header className="relative isolate overflow-hidden bg-sun">
      <div
        aria-hidden="true"
        data-parallax="0.12"
        className="pointer-events-none absolute top-[18%] -right-[18%] -z-10 hidden w-[44%] md:block lg:-right-[8%] lg:w-[34%]"
      >
        <div data-parallax-target="">
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            loading="eager"
            sizes="(min-width: 1024px) 34vw, 44vw"
            className="rotate-[148deg] opacity-95"
          />
        </div>
      </div>
      <div className="container-page pt-[calc(var(--header-height)+clamp(3rem,8vw,7rem))] pb-[clamp(3.5rem,7vw,7rem)]">
        <p className="inline-flex items-center gap-2.5 type-label text-earth-ink">
          <span aria-hidden="true" className="text-botanical">
            <LeafletMark variant="filled" size={12} rotate={-30} />
          </span>
          {label}
        </p>
        <div className="mt-6 grid-editorial gap-y-8">
          <RevealHeading
            as="h1"
            trigger="load"
            className="col-span-4 type-display text-forest md:col-span-7 lg:col-span-8"
            lines={title}
          />
          {(lead || aside) && (
            <div className="col-span-4 md:col-span-6 lg:col-span-5" data-reveal="fade">
              {lead && <p className="type-lead text-ink-soft">{lead}</p>}
              {aside}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
