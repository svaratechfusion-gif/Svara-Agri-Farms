interface ScrollIndicatorProps {
  label?: string;
  className?: string;
}

/** A quiet "scroll" cue: a hairline that draws itself downward. */
export function ScrollIndicator({
  label = "Scroll to begin",
  className = "",
}: ScrollIndicatorProps) {
  return (
    <div aria-hidden="true" className={`flex flex-col items-center gap-4 ${className}`}>
      <span className="type-label">{label}</span>
      <span className="relative block h-14 w-px overflow-hidden bg-current/25">
        <span className="absolute inset-0 animate-scroll-cue bg-current" />
      </span>
    </div>
  );
}
