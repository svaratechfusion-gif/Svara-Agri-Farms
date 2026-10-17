"use client";

import { useEffect, useRef, useState } from "react";

import { LeafButton } from "@/components/ui/LeafButton";
import { formatMobile } from "@/lib/commerce/orderDetails";
import { submittedOrders, type SubmittedOrder } from "@/lib/commerce/submittedOrder";

import { OrderSummary } from "./OrderSummary";

export const ORDER_SUCCESS_HEADING = "Thank you for your order!";
export const ORDER_SUCCESS_MESSAGE =
  "Your order has been received successfully. Our team will contact you shortly to confirm your order and delivery details.";

const placedAt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

/** A leaf in a gold ring, its vein drawn as a tick. */
function SuccessMark() {
  return (
    <svg
      viewBox="0 0 96 96"
      width="96"
      height="96"
      aria-hidden="true"
      focusable="false"
      className="order-success__mark"
    >
      <circle
        className="order-success__ring"
        cx="48"
        cy="48"
        r="45"
        fill="none"
        stroke="var(--color-harvest)"
        strokeWidth="1.25"
      />
      <circle cx="48" cy="48" r="36" fill="var(--color-ivory-deep)" />
      <path d="M48 72c-16-8-21-28-3-48 1-1 3-1 4 0 18 20 13 40-1 48z" fill="var(--color-forest)" />
      <path
        className="order-success__tick"
        d="M38.5 48.5l6.5 6.5 12.5-14"
        pathLength={1}
        fill="none"
        stroke="var(--color-ivory)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeliveryDetails({ customer }: { customer: SubmittedOrder["customer"] }) {
  return (
    <section
      aria-labelledby="order-delivery-heading"
      className="leaf-plate-sm border hairline p-6 sm:p-7"
    >
      <h2 id="order-delivery-heading" className="type-label text-earth-ink">
        Delivering to
      </h2>
      <address className="mt-4 type-small text-forest not-italic">
        <span className="block">{customer.fullName}</span>
        <span className="block tabular-nums">{formatMobile(customer.mobile)}</span>
        <span className="mt-3 block break-words">{customer.address}</span>
        <span className="block">
          {customer.city}, {customer.state} {customer.pinCode}
        </span>
        {customer.landmark && (
          <span className="mt-3 block break-words text-ink-soft">
            Landmark: {customer.landmark}
          </span>
        )}
        {customer.instructions && (
          <span className="mt-1 block break-words text-ink-soft">
            Instructions: {customer.instructions}
          </span>
        )}
      </address>
    </section>
  );
}

function NoOrder() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-6 text-center">
      <h1 className="type-h2 text-forest">No recent order to show.</h1>
      <p className="type-body text-ink-soft">
        Orders placed in this browser session appear here. Your products are waiting in the shop.
      </p>
      <LeafButton href="/shop" icon="arrow">
        Continue shopping
      </LeafButton>
    </div>
  );
}

/**
 * The confirmation of a placed order. It shows the order exactly as it was
 * placed — the copy kept when WhatsApp opened — never the cart, which is
 * empty by now. Nothing here says the order is paid or the delivery settled:
 * the team confirms those with the customer.
 */
export function OrderConfirmation() {
  // Undefined until read. The placed order lives in this browser session, so
  // it is read in the browser — again on every visit, as Next keeps this page
  // alive between visits and a newer order may have been placed since.
  const [order, setOrder] = useState<SubmittedOrder | null>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage
    setOrder(submittedOrders.read());
  }, []);
  // Announce the confirmation, without moving the page.
  useEffect(() => {
    if (order) heading.current?.focus({ preventScroll: true });
  }, [order]);

  if (order === undefined) {
    return <p className="py-10 type-body text-ink-soft">Loading your order…</p>;
  }
  if (!order) return <NoOrder />;

  return (
    <div className="order-success">
      <section
        aria-labelledby="order-success-heading"
        aria-describedby="order-success-message"
        className="mx-auto flex max-w-2xl flex-col items-center text-center"
      >
        <SuccessMark />
        <p className="mt-8 type-label text-earth-ink">Your order</p>
        <h1
          id="order-success-heading"
          ref={heading}
          tabIndex={-1}
          className="mt-3 type-h1 text-forest outline-none"
        >
          {ORDER_SUCCESS_HEADING}
        </h1>
        <p id="order-success-message" className="mt-5 max-w-lg type-lead text-ink-soft">
          {ORDER_SUCCESS_MESSAGE}
        </p>
        <div className="mt-10 w-full max-w-md leaf-plate-sm border border-harvest/60 bg-ivory-deep/70 px-6 py-5">
          <p className="type-label text-earth-ink">Order ID</p>
          <p
            id="order-id"
            className="mt-2 type-h4 tracking-wide text-forest [font-variant-numeric:lining-nums_tabular-nums]"
          >
            {order.orderId}
          </p>
          <p className="mt-2 type-small text-ink-soft">
            Placed on{" "}
            <time dateTime={order.submittedAt}>{placedAt.format(new Date(order.submittedAt))}</time>
          </p>
        </div>
      </section>

      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] md:items-start">
        <div data-note-avoid="" className="min-w-0">
          <OrderSummary
            heading="Order summary"
            headingId="order-summary-heading"
            rows={order.lines.map((line) => ({
              key: line.key,
              name: line.productName,
              variantLabel: line.variantLabel,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
            }))}
            totals={order.totals}
          />
        </div>
        <DeliveryDetails customer={order.customer} />
      </div>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center text-center">
        <p className="type-small text-ink-soft">
          Your order details have also been prepared in WhatsApp.{" "}
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-quiet inline-flex min-h-11 items-center text-forest underline underline-offset-4"
          >
            Open the WhatsApp message again
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
        <div
          data-mascot-avoid=""
          className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
        >
          <LeafButton href="/shop" size="lg" icon="arrow">
            Continue shopping
          </LeafButton>
          <LeafButton href="/products" variant="outline" size="lg">
            View products
          </LeafButton>
        </div>
      </div>
    </div>
  );
}
