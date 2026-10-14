"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { LeafButton } from "@/components/ui/LeafButton";
import { recallOrderRequest } from "@/lib/commerce/orderRequestClient";

import { OrderSummary } from "./OrderSummary";

const noSubscription = () => () => undefined;

/**
 * The confirmation for the request this browser just sent. It is shown only
 * after the server saved the request, and it says exactly that: received,
 * pending confirmation, nothing paid. Nothing is looked up by reference, so
 * no one else's details can be shown here.
 */
export function OrderConfirmation() {
  const order = useSyncExternalStore(noSubscription, recallOrderRequest, () => null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [order]);

  if (!order) {
    return (
      <div className="flex flex-col items-start gap-5 py-10">
        <h2 ref={headingRef} tabIndex={-1} className="type-h2 text-forest outline-none">
          No recent order request here.
        </h2>
        <p className="max-w-md type-body text-ink-soft">
          Order request confirmations are shown once, in the browser that sent them.
        </p>
        <LeafButton href="/shop" icon="arrow">
          Go to the shop
        </LeafButton>
      </div>
    );
  }

  const { delivery } = order;
  const address = [
    delivery.addressLine1,
    delivery.addressLine2,
    delivery.locality,
    delivery.city,
    `${delivery.state} ${delivery.pinCode}`,
  ].filter(Boolean);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div>
        <p className="type-label text-earth-ink">Order request received</p>
        <h2 ref={headingRef} tabIndex={-1} className="mt-3 type-h2 text-forest outline-none">
          Thank you for choosing SVARA Farms!
        </h2>
        <p className="mt-5 max-w-xl type-lead text-ink-soft">
          Your order request has been received. Our team will review product availability and
          delivery details, then contact you to confirm the order and payment arrangements. No
          payment has been collected at this stage.
        </p>

        <dl className="mt-10 grid gap-6 border-t hairline pt-8 sm:grid-cols-2">
          <div>
            <dt className="type-label text-earth-ink">Order reference</dt>
            <dd className="mt-2 font-mono text-lg tracking-wider text-forest">{order.reference}</dd>
          </div>
          <div>
            <dt className="type-label text-earth-ink">Status</dt>
            <dd className="mt-2">
              <span className="seed bg-ivory-deep text-earth-ink">Pending confirmation</span>
            </dd>
          </div>
          <div>
            <dt className="type-label text-earth-ink">Payment</dt>
            <dd className="mt-2 type-body text-ink-soft">Not collected</dd>
          </div>
          <div>
            <dt className="type-label text-earth-ink">Deliver to</dt>
            <dd className="mt-2 type-body text-ink-soft">
              <span className="block text-forest">{delivery.fullName}</span>
              {address.map((part) => (
                <span key={part} className="block">
                  {part}
                </span>
              ))}
              <span className="block">{delivery.phone}</span>
            </dd>
          </div>
        </dl>
        <p className="mt-8 max-w-xl type-small text-ink-soft">
          Please keep your order reference. Delivery charges are not yet included and will be
          confirmed by our team.
        </p>
        <div className="mt-8">
          <LeafButton href="/shop" variant="outline" icon="arrow">
            Back to the shop
          </LeafButton>
        </div>
      </div>
      <aside className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
        <OrderSummary
          heading="Your order request"
          rows={order.lines.map((line) => ({
            key: `${line.productSlug}:${line.variantId}`,
            name: line.productName,
            variantLabel: line.variantLabel,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }))}
          subtotal={order.productSubtotal}
        />
      </aside>
    </div>
  );
}
