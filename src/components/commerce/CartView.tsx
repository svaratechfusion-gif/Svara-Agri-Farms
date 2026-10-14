"use client";

import Image from "next/image";
import Link from "next/link";

import { LeafButton } from "@/components/ui/LeafButton";
import { photos } from "@/content/photos";
import { products } from "@/content/products";
import { formatMoney } from "@/lib/commerce/money";
import { MAX_LINES, resolveCart, type ResolvedLine } from "@/lib/commerce/orderLines";

import { useCart, useHydrated } from "./CartProvider";
import { OrderSummary } from "./OrderSummary";
import { QuantitySelector } from "./QuantitySelector";

function CartRow({ line }: { line: ResolvedLine }) {
  const { setQuantity, removeItem } = useCart();
  const product = products.find((entry) => entry.slug === line.productSlug);
  const cover = product ? photos[product.gallery[0]] : null;
  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-5 border-b border-[color:var(--vein)] py-6 sm:grid-cols-[7rem_1fr]">
      <div className="media-frame aspect-[4/5] leaf-plate-sm">
        {cover && <Image src={cover.src} alt="" fill sizes="112px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <div>
            <Link href={`/products/${line.productSlug}`} className="link-quiet type-h4">
              {line.productName}
            </Link>
            <p className="mt-1 type-label text-earth-ink">{line.variantLabel}</p>
          </div>
          {line.purchasable && line.unitPrice && line.lineTotal ? (
            <p className="text-right">
              <span className="block type-h4 tabular-nums">{formatMoney(line.lineTotal)}</span>
              <span className="block type-small text-ink-soft tabular-nums">
                {formatMoney(line.unitPrice)} each
              </span>
            </p>
          ) : (
            <p className="seed bg-ivory-deep text-earth-ink" role="note">
              Not available to order right now
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
            className="link-quiet inline-flex min-h-11 items-center type-label text-ink-soft"
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
 * The cart page: review, change quantities, remove, then go on to delivery
 * details. Prices and availability are read from the catalogue, not from
 * what was stored on the device.
 */
export function CartView() {
  const { cart, isPersistent } = useCart();
  const resolved = resolveCart(cart, products);
  const purchasableRows = resolved.lines.filter((line) => line.purchasable);
  // The cart lives on this device: the server cannot know it, so wait for it.
  const hydrated = useHydrated();
  if (!hydrated) return <p className="py-10 type-body text-ink-soft">Loading your cart…</p>;

  if (resolved.lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 py-10">
        <p className="type-label text-earth-ink">Nothing here yet</p>
        <h2 className="type-h2 text-forest">Your cart is empty.</h2>
        <p className="max-w-md type-body text-ink-soft">
          Browse what we grow and prepare on our farm. Sizes that can be ordered can be added from
          the shop.
        </p>
        <LeafButton href="/shop" icon="arrow">
          Go to the shop
        </LeafButton>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div>
        {!isPersistent && (
          <p role="note" className="mb-6 border-l-2 border-harvest pl-4 type-small text-ink-soft">
            This browser is not letting us keep your cart (for example in private browsing). It
            works for this visit, but will be empty if you leave the site.
          </p>
        )}
        {resolved.issues.length > 0 && (
          <p role="alert" className="mb-6 border-l-2 border-harvest pl-4 type-small text-forest">
            Some items in your cart can no longer be ordered. Remove them to continue.
          </p>
        )}
        <h2 className="sr-only">Items</h2>
        <ul className="border-t border-[color:var(--vein)]">
          {resolved.lines.map((line) => (
            <CartRow key={`${line.productSlug}:${line.variantId}`} line={line} />
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
          rows={purchasableRows.map((line) => ({
            key: `${line.productSlug}:${line.variantId}`,
            name: line.productName,
            variantLabel: line.variantLabel,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }))}
          subtotal={resolved.subtotal}
        />
        {resolved.orderable ? (
          <LeafButton href="/checkout" size="lg" icon="arrow" fullWidth>
            Proceed to delivery details
          </LeafButton>
        ) : (
          <>
            <LeafButton size="lg" fullWidth disabled aria-describedby="cart-blocked">
              Proceed to delivery details
            </LeafButton>
            <p id="cart-blocked" className="type-small text-ink-soft">
              {resolved.lines.length > MAX_LINES
                ? `An order request can hold up to ${MAX_LINES} different items.`
                : "Remove the items that cannot be ordered to continue."}
            </p>
          </>
        )}
        <p className="type-small text-ink-soft">No payment is taken on this site.</p>
      </aside>
    </div>
  );
}
