"use client";

import Image from "next/image";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import Link from "next/link";

import { VeinDivider } from "@/components/botanical/VeinDivider";
import { Drawer } from "@/components/ui/Drawer";
import { CloseIcon } from "@/components/ui/icons";
import { LeafButton } from "@/components/ui/LeafButton";
import { photos } from "@/content/photos";
import { products } from "@/content/products";
import { findProductSync, findVariant, isPurchasable } from "@/lib/commerce/catalog";
import { formatMoney, multiplyMoney } from "@/lib/commerce/money";
import { resolveCart } from "@/lib/commerce/orderLines";
import type { CartLine } from "@/lib/commerce/types";

import { useCart } from "./CartProvider";
import { QuantitySelector } from "./QuantitySelector";

function CartLineItem({ line }: { line: CartLine }) {
  const { setQuantity, removeItem, closeCart } = useCart();
  const product = findProductSync(line.productSlug);
  const variant = product ? findVariant(product, line.variantId) : null;
  if (!product || !variant) return null;

  const cover = photos[product.gallery[0]];
  const purchasable = isPurchasable(variant);
  const lineTotal =
    purchasable && variant.price ? formatMoney(multiplyMoney(variant.price, line.quantity)) : null;

  return (
    <li className="cart-line grid grid-cols-[5.5rem_1fr] gap-5 border-b border-[color:var(--vein)] py-6">
      <div className="media-frame aspect-[4/5] leaf-plate-sm">
        <Image src={cover.src} alt="" fill sizes="88px" className="object-cover" />
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <Link
            href={`/products/${product.slug}`}
            onClick={closeCart}
            className="link-quiet type-h4"
          >
            {product.name}
          </Link>
          <p className="mt-1 type-label text-earth-ink">{variant.label}</p>
        </div>
        <p className="type-small text-ink-soft">
          {lineTotal ?? "Not available to order right now"}
        </p>
        <div className="flex items-center justify-between gap-4">
          <QuantitySelector
            size="compact"
            label={`Quantity of ${product.name}, ${variant.label}`}
            value={line.quantity}
            onChange={(quantity) => setQuantity(line.productSlug, line.variantId, quantity)}
          />
          <button
            type="button"
            className="link-quiet inline-flex min-h-11 items-center type-label text-ink-soft"
            onClick={() => removeItem(line.productSlug, line.variantId)}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer() {
  const { cart, isOpen, closeCart, itemCount } = useCart();
  const { subtotal, orderable } = resolveCart(cart, products);

  return (
    <Drawer open={isOpen} onClose={closeCart} label="Your cart">
      <header className="flex items-center justify-between border-b hairline px-6 py-5">
        <h2 className="type-label text-ink">
          Your cart <span className="text-earth-ink">({itemCount})</span>
        </h2>
        <button
          type="button"
          onClick={closeCart}
          className="link-quiet inline-flex min-h-11 items-center gap-2.5 type-label"
          autoFocus
        >
          <CloseIcon />
          Close
        </button>
      </header>

      {cart.lines.length === 0 ? (
        <div className="cart-empty flex flex-1 flex-col items-start justify-center gap-6 px-6">
          <div
            aria-hidden="true"
            className="relative mb-2 h-48 w-full overflow-hidden leaf-plate bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgb(197_161_90/0.45),var(--color-ivory-deep)_70%)]"
          >
            <div className="cart-empty__leaf absolute -top-[18%] -left-[8%] w-[62%]">
              <CutoutImage
                cutout="moringaLeafBranch"
                decorative
                sizes="220px"
                className="rotate-[28deg]"
              />
            </div>
            <div className="cart-empty__pouch absolute inset-x-0 bottom-[6%] mx-auto h-[82%]">
              <CutoutImage
                cutout="svaraPouch"
                decorative
                sizes="160px"
                className="mx-auto h-full"
                imageClassName="drop-shadow-[0_14px_14px_rgb(24_32_25/0.22)]"
              />
            </div>
          </div>
          <p className="type-label text-earth-ink">Nothing here yet</p>
          <p className="type-h3">Your cart is empty.</p>
          <p className="max-w-xs type-small text-ink-soft">
            Everything we sell begins as a leaf on our farm.
          </p>
          <div className="mt-2 flex flex-col gap-3">
            <LeafButton href="/products/moringa-powder" onClick={closeCart} icon="arrow">
              Discover Moringa Powder
            </LeafButton>
            <LeafButton href="/shop" onClick={closeCart} variant="outline">
              Visit the shop
            </LeafButton>
          </div>
        </div>
      ) : (
        <>
          <ul className="flex-1 px-6">
            {cart.lines.map((line) => (
              <CartLineItem key={`${line.productSlug}:${line.variantId}`} line={line} />
            ))}
          </ul>
          <VeinDivider className="bg-ivory-deep px-6 pt-5" />
          <footer className="space-y-4 bg-ivory-deep px-6 pt-4 pb-6">
            <div className="flex items-baseline justify-between">
              <span className="type-label">Product subtotal</span>
              <span className="type-h4 tabular-nums">{subtotal ? formatMoney(subtotal) : "—"}</span>
            </div>
            <LeafButton href="/cart" fullWidth size="lg" icon="arrow" onClick={closeCart}>
              Review cart &amp; order
            </LeafButton>
            <LeafButton fullWidth variant="outline" onClick={closeCart}>
              Continue browsing
            </LeafButton>
            <p className="type-small text-ink-soft">
              {orderable
                ? "Delivery charges are confirmed by our team. No payment is taken on this site."
                : "Some items here cannot be ordered right now — review your cart to continue."}
            </p>
          </footer>
        </>
      )}
    </Drawer>
  );
}
