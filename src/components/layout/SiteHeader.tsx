"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties } from "react";

import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/components/commerce/CartProvider";
import { BasketIcon, MenuIcon } from "@/components/ui/icons";
import { headerNavigation, site } from "@/content/site";

import { MobileNavigation } from "./MobileNavigation";
import { BotanicalNavLink } from "./BotanicalNavLink";
import { useHeaderState } from "./useHeaderState";

/** The seal grows with the header: 58px on phones, 70px on tablets, 86px on desktop. */
const LOGO_MAX_SIZE = 86;
const LOGO_SIZE_CLASSES = "size-[58px] md:size-[70px] xl:size-[86px]";

const NAV_LIST = "header-nav-list flex items-center gap-1";

interface CartButtonProps {
  itemCount: number;
  onOpen: () => void;
}

/**
 * The cart: a woven-basket icon in a soft round frame, with a gold count badge
 * that appears once something is added and pops whenever the count changes.
 * The word "Cart" sits beside it from small screens up.
 */
function CartButton({ itemCount, onOpen }: CartButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="cart-button group relative inline-flex min-h-11 items-center gap-3 type-nav whitespace-nowrap"
    >
      <span className="relative grid size-11 place-items-center rounded-full border border-current/25 transition-[background-color,border-color,transform] duration-500 ease-[var(--ease-organic)] group-hover:-translate-y-0.5 group-hover:border-current/60 group-hover:bg-current/[0.06]">
        <BasketIcon className="size-[1.35rem]" />
        {itemCount > 0 && (
          <span
            key={itemCount}
            aria-hidden="true"
            className="cart-button__badge absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-harvest px-1 font-sans text-[0.625rem] font-bold text-forest-deep tabular-nums shadow-[0_2px_6px_rgb(15_42_27/0.3)]"
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
  );
}

/**
 * The branch the navigation leaves hang from: one fine, gently waving vein
 * drawn outward from the seal to each edge when the page loads.
 */
function HeaderBranch() {
  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <svg
          key={side}
          aria-hidden="true"
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          className={`header-branch pointer-events-none absolute top-[58%] hidden h-5 xl:block ${
            side === "left"
              ? "right-[calc(50%+3rem)] left-[calc(var(--gutter-page)-0.5rem)] -scale-x-100"
              : "right-[calc(var(--gutter-page)-0.5rem)] left-[calc(50%+3rem)]"
          }`}
        >
          <path
            d="M0 10 C 60 4, 110 16, 170 10 S 290 4, 400 12"
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ))}
    </>
  );
}

/**
 * The global header: the official seal at the true centre (a `1fr auto 1fr`
 * grid), the navigation in one soft pill either side. On load the seal and
 * the items settle; on scroll the bar compacts
 * (height and a seal scale only — nothing beneath it moves). Below the xl
 * breakpoint the groups collapse into Menu (left) and Cart (right).
 */
export function SiteHeader() {
  const { overImage, hidden, scrolled } = useHeaderState();
  const { itemCount, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const compact = scrolled && !overImage;
  // Over a photograph the bar stays transparent; once the page moves, a soft
  // forest scrim keeps the navigation legible over any part of the image.
  const surface = overImage
    ? scrolled
      ? "bg-transparent text-ivory before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-[150%] before:bg-[linear-gradient(180deg,rgb(15_42_27/0.72),rgb(15_42_27/0.35)_55%,transparent)]"
      : "bg-transparent text-ivory"
    : scrolled
      ? "bg-ivory/94 text-ink backdrop-blur-[2px] border-b border-rule"
      : "bg-ivory text-ink";
  const leftCount = headerNavigation.left.length;

  return (
    <>
      <header
        data-surface={overImage ? "dark" : "light"}
        className={`header-enter fixed inset-x-0 top-0 z-40 border-b border-transparent transition-[transform,background-color,color,border-color] duration-700 ease-[var(--ease-organic)] ${surface} ${
          hidden && !menuOpen ? "-translate-y-full focus-within:translate-y-0" : "translate-y-0"
        }`}
      >
        <nav
          aria-label="Primary"
          className={`relative container-page grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 transition-[height] duration-700 ease-[var(--ease-organic)] sm:gap-x-8 ${
            compact ? "h-[calc(var(--header-height)*0.8)]" : "h-[var(--header-height)]"
          }`}
        >
          <HeaderBranch />
          <div className="flex items-center justify-self-start">
            <button
              type="button"
              className="header-item link-quiet inline-flex min-h-11 items-center gap-3 type-nav xl:hidden"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
              <span>Menu</span>
            </button>
            <ul className={`hidden xl:flex ${NAV_LIST}`}>
              {headerNavigation.left.map((item, index) => (
                <li key={item.href}>
                  <BotanicalNavLink item={item} index={index} />
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/"
            aria-label={`${site.name} — home`}
            className={`header-seal block justify-self-center rounded-full transition-[box-shadow,scale] duration-700 ease-[var(--ease-organic)] ${
              overImage ? "shadow-[0_10px_30px_-12px_rgb(15_42_27/0.75)]" : ""
            } ${compact ? "scale-[0.84]" : ""}`}
          >
            <Logo size={LOGO_MAX_SIZE} sizeClassName={LOGO_SIZE_CLASSES} preload decorative />
          </Link>

          <div className="flex items-center justify-self-end">
            <ul className={`mr-5 hidden xl:flex ${NAV_LIST}`}>
              {headerNavigation.right.map((item, index) => (
                <li key={item.href}>
                  <BotanicalNavLink item={item} index={leftCount + index} />
                </li>
              ))}
            </ul>
            <span className="header-item" style={{ "--i": 6 } as CSSProperties}>
              <CartButton itemCount={itemCount} onOpen={openCart} />
            </span>
          </div>
        </nav>
      </header>
      <MobileNavigation open={menuOpen} onClose={closeMenu} />
    </>
  );
}
