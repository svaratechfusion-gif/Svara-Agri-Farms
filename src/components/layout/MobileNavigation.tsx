"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";

import { MoringaLeaf } from "@/components/botanical/MoringaLeaf";

import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/components/commerce/CartProvider";
import { BasketIcon, CloseIcon } from "@/components/ui/icons";
import { LeafButton } from "@/components/ui/LeafButton";
import { Drawer } from "@/components/ui/Drawer";
import { cutouts } from "@/content/cutouts";
import { primaryNavigation, site } from "@/content/site";

import { isActivePath, NavLink } from "./NavLink";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The full-screen editorial menu for tablet and mobile. Its top bar mirrors
 * the header — close where Menu was, the seal centred, the cart on the right —
 * so opening it never moves anything the reader was looking at.
 */
export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const { itemCount, openCart } = useCart();
  const pathname = usePathname();

  const handleCart = () => {
    onClose();
    openCart();
  };

  return (
    <Drawer open={open} onClose={onClose} label="Site navigation" side="full" tone="dark">
      <div className="container-page grid h-[var(--header-height)] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-x-4">
        <button
          type="button"
          onClick={onClose}
          className="link-quiet inline-flex min-h-11 items-center gap-3 justify-self-start type-nav"
          autoFocus
        >
          <CloseIcon />
          <span>Close</span>
        </button>
        <Link
          href="/"
          onClick={onClose}
          aria-label={`${site.name} — home`}
          className="block justify-self-center rounded-full"
        >
          <Logo size={70} sizeClassName="size-[58px] md:size-[70px]" decorative />
        </Link>
        <button
          type="button"
          onClick={handleCart}
          className="inline-flex min-h-11 items-center gap-3 justify-self-end type-nav"
        >
          <span className="relative grid size-11 place-items-center rounded-full border border-ivory/30">
            <BasketIcon className="size-[1.35rem]" />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-harvest px-1 font-sans text-[0.625rem] font-bold text-forest-deep tabular-nums"
              >
                {itemCount}
              </span>
            )}
          </span>
          <span className="hidden sm:inline">Cart</span>
          <span className="sr-only">
            {itemCount} {itemCount === 1 ? "item" : "items"} — open cart
          </span>
        </button>
      </div>

      <div
        aria-hidden="true"
        className="menu-leaf pointer-events-none absolute -right-16 bottom-0 w-[min(70vw,26rem)] text-ivory/[0.07]"
      >
        <MoringaLeaf />
      </div>
      <nav
        aria-label="Primary"
        className="relative container-page flex flex-1 flex-col justify-center py-8 md:py-12"
      >
        <p className="type-label text-harvest">The story of a leaf</p>
        <ol className="midrib-list mt-6 [--vein:var(--vein-light)]">
          {primaryNavigation.map((item, index) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li
                key={item.href}
                className="menu-item relative flex items-baseline gap-5 py-3 pl-10 md:py-4"
                style={{ "--i": index } as CSSProperties}
              >
                <span
                  aria-hidden="true"
                  className={`menu-leaf-marker absolute top-1/2 -left-2 h-[1.15rem] w-8 -translate-y-1/2 ${
                    active ? "menu-leaf-marker--active" : ""
                  }`}
                >
                  <Image
                    src={cutouts.leafSingle.src}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </span>
                <span className="w-6 shrink-0 type-label text-harvest tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <NavLink
                  item={item}
                  onNavigate={onClose}
                  marker="none"
                  className="type-h2 max-xs:text-[1.65rem]"
                />
              </li>
            );
          })}
        </ol>
      </nav>

      <div
        className="menu-item relative container-page flex flex-col gap-6 pb-10 sm:flex-row sm:items-center sm:justify-between"
        style={{ "--i": primaryNavigation.length } as CSSProperties}
      >
        <LeafButton href="/products/moringa-powder" onClick={onClose} icon="arrow">
          Discover Moringa Powder
        </LeafButton>
        <p className="type-label text-ivory/70">{site.philosophy.join(" ")}</p>
      </div>
    </Drawer>
  );
}
