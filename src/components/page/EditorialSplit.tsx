import type { ReactNode } from "react";

import { EditorialImage, type ImageTagSpec } from "@/components/editorial/EditorialImage";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import type { PhotoKey } from "@/content/photos";

interface EditorialSplitProps {
  index: string;
  label: string;
  /** One entry per typeset line. */
  title: readonly ReactNode[];
  body: readonly string[];
  photo: PhotoKey;
  caption?: string;
  aspect?: string;
  reverse?: boolean;
  tone?: "ivory" | "deep";
  /** Italic note at the right of the chapter rule (Stitch "Chapter 01 / The Land"). */
  aside?: string;
  /** Corner tags; place them on the plate's tips (top-right/bottom-left, or mirrored when reversed). */
  imageTags?: readonly ImageTagSpec[];
  matted?: boolean;
  children?: ReactNode;
}

/** An asymmetric 5/7 text-and-photograph chapter used across supporting pages. */
export function EditorialSplit({
  index,
  label,
  title,
  body,
  photo,
  caption,
  aspect = "4 / 5",
  reverse = false,
  tone = "ivory",
  aside,
  imageTags,
  matted = false,
  children,
}: EditorialSplitProps) {
  return (
    <section className={`section-space ${tone === "deep" ? "bg-ivory-deep" : ""}`}>
      <div className="container-page">
        <SectionHeader index={index} label={label} aside={aside} />
        <div className="mt-14 grid-editorial items-center gap-y-12 lg:mt-20">
          <div
            className={`col-span-4 md:col-span-8 lg:col-span-5 ${
              reverse ? "lg:col-start-8 lg:row-start-1" : ""
            }`}
          >
            <RevealHeading className="type-h2 text-forest" lines={title} />
            <div className="mt-8 space-y-5" data-reveal="fade">
              {body.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraph}
                  className={paragraphIndex === 0 ? "type-lead" : "type-body text-ink-soft"}
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {children}
          </div>
          <EditorialImage
            photo={photo}
            aspect={aspect}
            sizes="(min-width: 1024px) 50vw, 100vw"
            figureLabel={caption ? `Fig. ${index}` : undefined}
            caption={caption}
            tags={imageTags}
            frame={matted ? "matted" : reverse ? "plate-reverse" : "plate"}
            botanical={!matted}
            reveal="leaf"
            className={`col-span-4 md:col-span-8 lg:col-span-6 ${
              reverse ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-7"
            }`}
          />
        </div>
      </div>
    </section>
  );
}
