import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { ArrowIcon, LeafGlyph } from "./icons";
import { leafButtonClasses, leafLinkClasses, type LeafButtonStyle } from "./leafButtonStyles";

type LeafIcon = "arrow" | "arrow-left" | "leaf" | "none";

interface SharedProps extends Omit<LeafButtonStyle, "className"> {
  children: ReactNode;
  /** Trailing glyph (or leading, for `arrow-left`). Defaults to none. */
  icon?: LeafIcon;
  className?: string;
}

type LinkProps = SharedProps & {
  href: string;
  disabled?: never;
  loading?: never;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

type ButtonProps = SharedProps & {
  href?: undefined;
  /** Shows the sprouting indicator, marks the button busy and blocks presses. */
  loading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type LeafButtonProps = LinkProps | ButtonProps;

function Glyph({ icon }: { icon: LeafIcon }) {
  if (icon === "arrow") return <ArrowIcon className="leaf-btn__icon" />;
  if (icon === "arrow-left") return <ArrowIcon direction="left" className="leaf-btn__icon" />;
  if (icon === "leaf") return <LeafGlyph className="leaf-btn__icon" />;
  return null;
}

function Content({ icon = "none", children }: { icon?: LeafIcon; children: ReactNode }) {
  const leading = icon === "arrow-left";
  return (
    <>
      {leading && <Glyph icon={icon} />}
      <span className="leaf-btn__label">{children}</span>
      {!leading && <Glyph icon={icon} />}
    </>
  );
}

/** Props consumed by the leaf button itself, never forwarded to the DOM. */
const OWN_PROPS = new Set([
  "variant",
  "size",
  "tone",
  "fullWidth",
  "className",
  "icon",
  "children",
  "href",
  "loading",
  "disabled",
  "type",
]);

function domProps<T>(props: object): T {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !OWN_PROPS.has(key))) as T;
}

/**
 * The one button of the site. Renders a Next.js link when given `href`,
 * otherwise a native `<button>` (type="button" unless stated).
 */
export function LeafButton(props: LeafButtonProps) {
  const { variant, size, tone, fullWidth, className, icon, children } = props;
  const classes = leafButtonClasses({ variant, size, tone, fullWidth, className });

  if (props.href !== undefined) {
    const anchor = domProps<AnchorHTMLAttributes<HTMLAnchorElement>>(props);
    return (
      <Link href={props.href} className={classes} {...anchor}>
        <Content icon={icon}>{children}</Content>
      </Link>
    );
  }

  const { loading = false, disabled, type = "button" } = props;
  const button = domProps<ButtonHTMLAttributes<HTMLButtonElement>>(props);
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...button}
    >
      <Content icon={icon}>{children}</Content>
      {loading && <span className="leaf-btn__sprout" aria-hidden="true" />}
    </button>
  );
}

interface LeafLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
> {
  href: string;
  children: ReactNode;
  tone?: LeafButtonStyle["tone"];
  /** Show the hairline arrow after the label (default) or before it. */
  arrow?: "after" | "before" | "none";
  className?: string;
}

/** Variant D — the understated editorial link, led by a small leaflet. */
export function LeafLink({
  href,
  children,
  tone,
  arrow = "after",
  className,
  ...anchor
}: LeafLinkProps) {
  return (
    <Link href={href} className={leafLinkClasses({ tone, className })} {...anchor}>
      {arrow === "before" ? (
        <ArrowIcon direction="left" className="leaf-link__arrow" />
      ) : (
        <LeafGlyph className="leaf-link__leaf" />
      )}
      <span className="leaf-link__label">{children}</span>
      {arrow === "after" && <ArrowIcon className="leaf-link__arrow" />}
    </Link>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  /** Accessible name — required, since the control shows only a glyph. */
  label: string;
  icon: Exclude<LeafIcon, "none">;
  variant?: LeafButtonStyle["variant"];
  tone?: LeafButtonStyle["tone"];
  className?: string;
};

/** Variant F — the icon-only botanical control (previous/next, close, play). */
export function LeafIconButton({
  label,
  icon,
  variant = "outline",
  tone,
  className = "",
  type = "button",
  ...button
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={leafButtonClasses({ variant, tone, className: `leaf-btn--icon ${className}` })}
      {...button}
    >
      <Glyph icon={icon} />
    </button>
  );
}
