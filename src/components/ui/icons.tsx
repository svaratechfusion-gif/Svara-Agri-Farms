interface IconProps {
  className?: string;
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A fine hairline arrow; `direction` flips it for "previous" actions. */
export function ArrowIcon({
  direction = "right",
  className = "",
}: IconProps & { direction?: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 20 12"
      width="20"
      height="12"
      aria-hidden="true"
      focusable="false"
      className={`${direction === "left" ? "-scale-x-100" : ""} ${className}`}
    >
      <path d="M1 6h17M13 1.5 18 6l-5 4.5" {...STROKE} />
    </svg>
  );
}

/**
 * A single moringa leaflet with its midrib — the botanical accent used by the
 * textual leaf link and as a quiet marker in editorial labels.
 */
export function LeafGlyph({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M2.5 13.5C2.5 7 7 2.5 13.5 2.5 13.5 9 9 13.5 2.5 13.5Z" {...STROKE} />
      <path d="M2.5 13.5 10 6" {...STROKE} strokeWidth={0.9} />
    </svg>
  );
}

/** A woven basket outline, used for the cart. */
export function BasketIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M2.5 8h15l-1.6 8.2a1 1 0 0 1-1 .8H5.1a1 1 0 0 1-1-.8L2.5 8Z" {...STROKE} />
      <path d="M6.5 8 9 3M13.5 8 11 3M4 11.5h12M7.5 8.5l.6 8M12.5 8.5l-.6 8" {...STROKE} />
    </svg>
  );
}

/** Two hairlines — the menu control. */
export function MenuIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 12"
      width="24"
      height="12"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M1 3h22M7 9h16" {...STROKE} />
    </svg>
  );
}

/** A fine cross — the close control. */
export function CloseIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" {...STROKE} />
    </svg>
  );
}

/** A fine speech bubble — talking to the team (WhatsApp). */
export function ChatIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M10 2.75c4.1 0 7.25 2.86 7.25 6.5s-3.15 6.5-7.25 6.5c-.9 0-1.76-.14-2.55-.4L3.5 17.1l1.02-3.37C3.42 12.6 2.75 11 2.75 9.25c0-3.64 3.15-6.5 7.25-6.5Z"
        {...STROKE}
      />
      <path d="M7 9.4h.01M10 9.4h.01M13 9.4h.01" {...STROKE} strokeWidth={1.8} />
    </svg>
  );
}
