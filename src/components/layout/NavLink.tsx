"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LeafletMark } from "@/components/botanical/LeafletMark";
import type { NavItem } from "@/content/site";

interface NavLinkProps {
  item: NavItem;
  className?: string;
  onNavigate?: () => void;
  /** Where the active-page leaflet sits: under the label (header) or before it (menu). */
  marker?: "below" | "before" | "none";
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The current page is marked by a small leaflet rather than an underline. */
export function NavLink({ item, className = "", onNavigate, marker = "below" }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const markerPosition =
    marker === "below"
      ? "absolute -bottom-3 left-1/2 -translate-x-1/2"
      : "absolute top-1/2 -left-7 -translate-y-1/2";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`relative link-quiet ${className}`}
    >
      {item.label}
      {active && marker !== "none" && (
        <span aria-hidden="true" className={`${markerPosition} text-harvest`}>
          <LeafletMark variant="filled" size={marker === "below" ? 13 : 16} rotate={-20} />
        </span>
      )}
    </Link>
  );
}
