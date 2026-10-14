import type { CSSProperties, ReactNode } from "react";

type HeadingTag = "h1" | "h2" | "h3" | "p";

interface RevealHeadingProps {
  as?: HeadingTag;
  id?: string;
  className?: string;
  /** One entry per typeset line; each rises from its own mask. */
  lines: readonly ReactNode[];
  /**
   * `scroll` reveals when the heading enters the viewport (needs MotionRoot);
   * `load` animates with pure CSS on page load — use it above the fold.
   */
  trigger?: "scroll" | "load";
}

/**
 * A heading split into lines on the server, so no client-side text splitting
 * (and no layout work) is needed to animate it.
 */
export function RevealHeading({
  as: Tag = "h2",
  id,
  className = "",
  lines,
  trigger = "scroll",
}: RevealHeadingProps) {
  const lineClass = trigger === "load" ? "hero-line" : "reveal-line";
  return (
    <Tag id={id} data-reveal={trigger === "scroll" ? "heading" : undefined} className={className}>
      {lines.map((line, index) => (
        <span key={index} className={lineClass}>
          <span style={{ "--line": index } as CSSProperties}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
