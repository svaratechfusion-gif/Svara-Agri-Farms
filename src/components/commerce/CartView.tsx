"use client";

import { catalogueImages } from "@/content/catalogueImages";
import Image from "next/image";
import Link from "next/link";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { LeafButton } from "@/components/ui/LeafButton";
import { commerceRules } from "@/content/commerce";
import { catalogue } from "@/content/products";
import { AVAILABILITY_LABEL, NO_LONGER_AVAILABLE } from "@/lib/commerce/availability";
import { findProductSync } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/money";
import {
  currentPrices,
  MAX_LINES,
  onlyPricesChanged,
  resolveCart,
  type ResolvedLine,
} from "@/lib/commerce/orderLines";
import { cartTotals } from "@/lib/commerce/pricing";

import { useCart, useHydrated } from "./CartProvider";
import { OrderSummary } from "./OrderSummary";
import { QuantitySelector } from "./QuantitySelector";

function CartRow({ line }: { line: ResolvedLine }) {
  const { setQuantity, removeItem } = useCart();
  const product = findProductSync(line.productSlug);
  const href = product?.hasProductPage ? `/products/${line.productSlug}` : "/shop#in-preparation";
  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-[color:var(--vein)] py-6 sm:grid-cols-[7rem_1fr] sm:gap-6">
      <div className="media-frame relative aspect-[4/5] leaf-plate-sm bg-ivory-deep">
        {product && (
          <Image
            src={catalogueImages[product.image].src}
            alt=""
            fill
            sizes="112px"
            className="object-contain p-1"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <Link href={href} className="link-quiet type-h4">
              {line.productName}
            </Link>
            <p className="mt-1 type-label text-earth-ink">{line.variantLabel}</p>
          </div>
          {line.purchasable && line.unitPrice && line.lineTotal ? (
            <p className="ml-auto text-right">
              <span className="block type-h4 tabular-nums">{formatMoney(line.lineTotal)}</span>
              <span className="block type-small text-ink-soft tabular-nums">
                {formatMoney(line.unitPrice)} each
              </span>
              {line.previousUnitPrice && (
                <span className="mt-1 block type-small text-forest tabular-nums">
                  Price updated — was{" "}
                  <s className="text-ink-soft">{formatMoney(line.previousUnitPrice)}</s>, now{" "}
                  {formatMoney(line.unitPrice)}
                </span>
              )}
            </p>
          ) : (
            <p className="max-w-64 text-right" role="note">
              <span className="seed bg-ivory-deep text-earth-ink">
                {AVAILABILITY_LABEL[line.availability]}
              </span>
              <span className="mt-2 block type-small text-ink-soft">{NO_LONGER_AVAILABLE}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {line.purchasable ? (
            <QuantitySelector
              size="compact"
              label={`Quantity of ${line.productName}, ${line.variantLabel}`}
              value={line.quantity}
              onChange={(quantity) => setQuantity(line.productSlug, line.variantId, quantity)}
            />
          ) : (
            <span className="type-small text-ink-soft">Quantity {line.quantity}</span>
          )}
          <button
            type="button"
            className="link-quiet inline-flex min-h-11 items-center px-1 type-label text-ink-soft"
            onClick={() => removeItem(line.productSlug, line.variantId)}
          >
            Remove
            <span className="sr-only">
              {" "}
              {line.productName}, {line.variantLabel}
            </span>
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * A line whose product or size is no longer in the catalogue at all (e.g. a
 * cart saved before a product was withdrawn): nothing to show but the fact,
 * and a way to remove it.
 */
function GoneRow({ productSlug, variantId }: { productSlug: string; variantId: string }) {
  const { removeItem } = useCart();
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--vein)] py-6">
      <p className="max-w-md type-small text-ink-soft" role="note">
        {NO_LONGER_AVAILABLE}
      </p>
      <button
        type="button"
        className="link-quiet inline-flex min-h-11 items-center px-1 type-label text-ink-soft"
        onClick={() => removeItem(productSlug, variantId)}
      >
        Remove<span className="sr-only"> the product that is no longer available</span>
      </button>
    </li>
  );
}

/** The empty cart: the pouch on a warm arc, and a way back to the shop. */
function EmptyCart() {
  return (
    <div className="grid items-center gap-10 py-6 md:grid-cols-2 md:gap-16">
      <div
        aria-hidden="true"
        className="relative mx-auto h-72 w-full max-w-md overflow-hidden leaf-plate bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgb(197_161_90/0.42),var(--color-ivory-deep)_70%)] sm:h-80"
      >
        <div className="absolute -top-[16%] -left-[6%] w-[58%]">
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            sizes="260px"
            className="rotate-[28deg]"
          />
        </div>
        <div className="absolute inset-x-0 bottom-[6%] mx-auto h-[80%]">
          <CutoutImage
            cutout="svaraPouch"
            decorative
            sizes="220px"
            className="mx-auto h-full"
            imageClassName="drop-shadow-[0_18px_18px_rgb(24_32_25/0.22)]"
          />
        </div>
      </div>
      <div className="flex flex-col items-start gap-5">
        <p className="type-label text-earth-ink">Nothing here yet</p>
        <h2 className="type-h2 text-forest">Your cart is empty.</h2>
        <p className="max-w-md type-body text-ink-soft">
          Choose a product and a size, and it will wait here until you order.
        </p>
        <div className="flex flex-wrap gap-3">
          <LeafButton href="/shop" icon="arrow">
            Explore products
          </LeafButton>
          <LeafButton href="/" variant="outline">
            Back to home
          </LeafButton>
        </div>
      </div>
    </div>
  );
}

/**
 * The cart page: review, change quantities, remove, then go on to the order
 * page (delivery details, then WhatsApp). Prices and availability are read
 * from the catalogue, not from what was stored on the device.
 */
export function CartView() {
  const { cart, isPersistent, acceptPrices } = useCart();
  const resolved = resolveCart(cart, catalogue);
  const pricesChangedOnly = onlyPricesChanged(resolved);
  const priced = cartTotals(resolved.subtotal, commerceRules);
  const belowMinimum = priced && !priced.ok && priced.reason === "below-minimum" ? priced : null;
  const canProceed = resolved.orderable && !belowMinimum;
  // The cart lives on this device: the server cannot know it, so wait for it.
  const hydrated = useHydrated();
  if (!hydrated) return <p className="py-10 type-body text-ink-soft">Loading your cart…</p>;
  if (resolved.lines.length === 0 && resolved.issues.length === 0) return <EmptyCart />;

  const blockedReason =
    resolved.lines.length > MAX_LINES
      ? `An order can hold up to ${MAX_LINES} different items.`
      : pricesChangedOnly
        ? "Review and accept the updated prices to continue."
        : resolved.issues.length > 0
          ? "Remove the items that are no longer available to continue."
          : belowMinimum
            ? `The minimum order is ${formatMoney(belowMinimum.minimum)}.`
            : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div className="min-w-0">
        {!isPersistent && (
          <p role="note" className="mb-6 border-l-2 border-harvest pl-4 type-small text-ink-soft">
            This browser is not letting us keep your cart (for example in private browsing). It
            works for this visit, but will be empty if you leave the site.
          </p>
        )}
        {pricesChangedOnly ? (
          <div role="alert" className="mb-6 border-l-2 border-harvest pl-4">
            <p className="type-label text-forest">Price updated</p>
            <p className="mt-1 type-small text-forest">
              The price of some items has changed since you added them. The new prices are shown
              below and in your summary; accept them to order.
            </p>
            <button
              type="button"
              className="mt-3 link-quiet inline-flex min-h-11 items-center type-label text-forest underline underline-offset-4"
              onClick={() => acceptPrices(currentPrices(resolved))}
            >
              Accept updated prices
            </button>
          </div>
        ) : (
          resolved.issues.length > 0 && (
            <p role="alert" className="mb-6 border-l-2 border-harvest pl-4 type-small text-forest">
              {NO_LONGER_AVAILABLE}
            </p>
          )
        )}
        <h2 className="sr-only">Items</h2>
        <ul className="border-t border-[color:var(--vein)]">
          {resolved.lines.map((line) => (
            <CartRow key={`${line.productSlug}:${line.variantId}`} line={line} />
          ))}
          {resolved.issues
            .filter((issue) => issue.reason === "unknown-product")
            .map((issue) => (
              <GoneRow
                key={`${issue.productSlug}:${issue.variantId}`}
                productSlug={issue.productSlug}
                variantId={issue.variantId}
              />
            ))}
        </ul>
        <div className="mt-8">
          <LeafButton href="/shop" variant="outline" icon="arrow-left">
            Continue shopping
          </LeafButton>
        </div>
      </div>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
        <OrderSummary
          heading={`Summary · ${resolved.itemCount} ${resolved.itemCount === 1 ? "item" : "items"}`}
          rows={resolved.lines
            .filter((line) => line.purchasable)
            .map((line) => ({
              key: `${line.productSlug}:${line.variantId}`,
              name: line.productName,
              variantLabel: line.variantLabel,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
            }))}
          totals={priced?.ok ? priced.totals : null}
        />
        {canProceed ? (
          <LeafButton href="/order" size="lg" icon="arrow" fullWidth>
            Proceed to order
          </LeafButton>
        ) : (
          <>
            <LeafButton size="lg" icon="arrow" fullWidth disabled aria-describedby="cart-blocked">
              Proceed to order
            </LeafButton>
            <p id="cart-blocked" className="type-small text-ink-soft">
              {blockedReason}
            </p>
          </>
        )}
        <p className="type-small text-ink-soft">
          Next, tell us where to deliver. Your order then opens in WhatsApp, ready for you to send.
          No payment is taken on this site.
        </p>
      </aside>
    </div>
  );
}
