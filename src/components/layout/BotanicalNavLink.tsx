"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { cutouts } from "@/content/cutouts";
import type { NavItem } from "@/content/site";

import { isActivePath } from "./NavLink";

interface BotanicalNavLinkProps {
  item: NavItem;
  /** Position in the entrance stagger. */
  index: number;
}

/**
 * A header link drawn on a real leaf: the supplied leaf cutout, uncropped and
 * undistorted (every leaf shares its aspect ratio), with the label set along
 * its body, tilted a few degrees to follow the midrib. On load the leaves
 * unfurl in turn; on hover a leaf sways and lifts; the current page's leaf
 * stays lifted, lit and tipped with harvest gold. The leaf is decoration —
 * the link's name is its label alone.
 */
export function BotanicalNavLink({ item, index }: BotanicalNavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const leaf = cutouts.leafSingle;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="leaf-nav header-item relative inline-grid place-items-center"
      style={{ "--i": index } as CSSProperties}
    >
      <span aria-hidden="true" className="leaf-nav__leaf absolute inset-0">
        <Image src={leaf.src} alt="" fill sizes="120px" className="object-contain" />
      </span>
      <span className="leaf-nav__label relative">{item.label}</span>
    </Link>
  );
}
