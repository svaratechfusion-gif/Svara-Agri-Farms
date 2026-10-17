"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { LeafButton } from "@/components/ui/LeafButton";
import { ArrowIcon, ChatIcon } from "@/components/ui/icons";
import { leafButtonClasses } from "@/components/ui/leafButtonStyles";
import { commerceRules } from "@/content/commerce";
import { catalogue } from "@/content/products";
import { NO_LONGER_AVAILABLE } from "@/lib/commerce/availability";
import { INDIAN_STATES } from "@/lib/commerce/delivery";
import { formatMoney } from "@/lib/commerce/money";
import {
  ORDER_DETAIL_LIMITS,
  parseSavedOrderDetails,
  type OrderDetailErrors,
  type OrderDetailField,
  type OrderDetailsInput,
} from "@/lib/commerce/orderDetails";
import { currentPrices, onlyPricesChanged, resolveCart } from "@/lib/commerce/orderLines";
import { cartTotals } from "@/lib/commerce/pricing";
import { submittedOrders } from "@/lib/commerce/submittedOrder";
import { prepareWhatsAppOrder } from "@/lib/commerce/whatsappOrder";

import { useCart, useHydrated } from "./CartProvider";
import { OrderSummary } from "./OrderSummary";

/** This visit's typed details, so going back to the cart loses nothing. */
const DETAILS_KEY = "svara.order-details.v1";

/** Where a placed order is confirmed. */
const ORDER_CONFIRMATION_PATH = "/order/confirmation";

interface FieldSpec {
  name: OrderDetailField;
  label: string;
  required: boolean;
  autoComplete: string;
  inputMode?: "tel" | "numeric";
  hint?: string;
  multiline?: boolean;
  /** Shares a row with its neighbour from `sm` up. */
  half?: boolean;
}

const FIELDS: readonly FieldSpec[] = [
  { name: "fullName", label: "Full name", required: true, autoComplete: "name" },
  {
    name: "mobile",
    label: "Mobile number",
    required: true,
    autoComplete: "tel-national",
    inputMode: "tel",
    hint: "A 10-digit Indian mobile number, so our team can reach you.",
  },
  {
    name: "address",
    label: "Address",
    required: true,
    autoComplete: "street-address",
    multiline: true,
    hint: "House or flat, street and area.",
  },
  { name: "city", label: "City", required: true, autoComplete: "address-level2", half: true },
  { name: "state", label: "State", required: true, autoComplete: "address-level1", half: true },
  {
    name: "pinCode",
    label: "PIN code",
    required: true,
    autoComplete: "postal-code",
    inputMode: "numeric",
    half: true,
  },
  { name: "landmark", label: "Landmark", required: false, autoComplete: "off", half: true },
  {
    name: "instructions",
    label: "Delivery instructions",
    required: false,
    autoComplete: "off",
    multiline: true,
  },
];

function readSaved() {
  try {
    return parseSavedOrderDetails(window.sessionStorage.getItem(DETAILS_KEY));
  } catch {
    return parseSavedOrderDetails(null);
  }
}

/** Opens WhatsApp from the click itself, so browsers treat it as the customer's own action. */
function openInNewTab(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}

const FIELD_BASE =
  "min-h-14 w-full rounded-2xl border bg-ivory px-4 py-3.5 type-body text-ink transition-colors duration-300 placeholder:text-ink-soft/60 focus:border-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-botanical/35";

/**
 * The order page: where to deliver, beside what is being ordered, then
 * "Place order on WhatsApp". Nothing is sent to the website: the details and
 * the cart — re-read from the catalogue at that moment — are written into a
 * WhatsApp message under a new order ID. Once WhatsApp is open the order is
 * placed: a fixed copy of it is kept for the confirmation page, and the cart
 * is emptied. No payment is taken.
 */
export function OrderView() {
  const { cart, acceptPrices, clearCart } = useCart();
  const router = useRouter();
  const hydrated = useHydrated();
  const [values, setValues] = useState<OrderDetailsInput>(() =>
    typeof window === "undefined" ? parseSavedOrderDetails(null) : readSaved(),
  );
  const [errors, setErrors] = useState<OrderDetailErrors>({});
  // The order has been placed and the confirmation is on its way.
  const [placed, setPlaced] = useState(false);
  // Next keeps this page alive (hidden) while the customer is elsewhere; coming
  // back to /order starts afresh.
  useEffect(() => () => setPlaced(false), []);
  const errorSummary = useRef<HTMLDivElement>(null);
  const cartNotice = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(DETAILS_KEY, JSON.stringify(values));
    } catch {
      // Kept for this page view only.
    }
  }, [values]);

  // Always the catalogue's view of the cart: current names, sizes, prices, availability.
  const resolved = resolveCart(cart, catalogue);
  const priced = cartTotals(resolved.subtotal, commerceRules);
  const pricesChanged = onlyPricesChanged(resolved);

  if (!hydrated) return <p className="py-10 type-body text-ink-soft">Loading your order…</p>;
  // The cart has just been emptied by placing the order: not "your cart is empty".
  if (placed) {
    return (
      <p role="status" className="py-10 type-body text-ink-soft">
        Opening your order confirmation…
      </p>
    );
  }

  if (resolved.lines.length === 0 && resolved.issues.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 py-10">
        <h2 className="type-h2 text-forest">Your cart is empty.</h2>
        <p className="max-w-md type-body text-ink-soft">
          Add something to your cart before entering your details.
        </p>
        <LeafButton href="/shop" icon="arrow">
          Explore products
        </LeafButton>
      </div>
    );
  }

  const update = (field: OrderDetailField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const order = prepareWhatsAppOrder(resolved, values, commerceRules);
    if (!order.ok) {
      setErrors(order.errors);
      requestAnimationFrame(() => (order.cartBlocked ? cartNotice : errorSummary).current?.focus());
      return;
    }
    setErrors({});
    // WhatsApp first. Once it is open the order is placed: keep the order as
    // placed for the confirmation, then empty the cart. Replace, so Back from
    // the confirmation never returns to this form.
    openInNewTab(order.order.whatsappUrl);
    submittedOrders.save(order.order);
    setPlaced(true);
    clearCart();
    router.replace(ORDER_CONFIRMATION_PATH);
  };

  const errorList = FIELDS.filter((field) => errors[field.name]);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16 lg:pr-16">
      <form id="order-form" noValidate onSubmit={submit} aria-labelledby="order-heading">
        <Link
          href="/cart"
          className="link-quiet inline-flex min-h-11 items-center gap-2 type-label text-forest"
        >
          <ArrowIcon direction="left" /> Back to cart
        </Link>
        <p className="mt-6 type-label text-earth-ink">Order details</p>
        <h2 id="order-heading" className="mt-3 type-h2 text-forest">
          Where should we send your order?
        </h2>
        <p className="mt-4 max-w-lg type-small text-ink-soft">
          Your details are written into a WhatsApp message with your order. Nothing is sent until
          you press Send in WhatsApp. Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">required</span> are required.
        </p>

        {errorList.length > 0 && (
          <div
            ref={errorSummary}
            tabIndex={-1}
            role="alert"
            className="mt-8 border-l-2 border-alert pl-4 outline-none"
          >
            <p className="type-small font-semibold text-forest">Please check these details:</p>
            <ul className="mt-2 space-y-1 type-small text-forest">
              {errorList.map((field) => (
                <li key={field.name}>
                  <a href={`#order-${field.name}`} className="underline underline-offset-4">
                    {errors[field.name]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2">
          {FIELDS.map((field) => {
            const id = `order-${field.name}`;
            const error = errors[field.name];
            const describedBy = [field.hint && `${id}-hint`, error && `${id}-error`]
              .filter(Boolean)
              .join(" ");
            const border = error ? "border-alert" : "border-ink/20";
            const common = {
              id,
              name: field.name,
              value: values[field.name],
              required: field.required,
              autoComplete: field.autoComplete,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": describedBy || undefined,
              className: `${FIELD_BASE} ${border}`,
            } as const;
            const span = field.half ? undefined : "sm:col-span-2";
            return (
              <div key={field.name} className={span}>
                <label htmlFor={id} className="block type-label text-earth-ink">
                  {field.label}
                  {field.required ? (
                    <span aria-hidden="true"> *</span>
                  ) : (
                    <span className="text-ink-soft normal-case"> (optional)</span>
                  )}
                </label>
                <div className="mt-2.5">
                  {field.name === "state" ? (
                    <select {...common} onChange={(e) => update(field.name, e.target.value)}>
                      <option value="">Select your state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  ) : field.multiline ? (
                    <textarea
                      {...common}
                      rows={field.name === "address" ? 3 : 2}
                      maxLength={ORDER_DETAIL_LIMITS[field.name]}
                      onChange={(e) => update(field.name, e.target.value)}
                      className={`${common.className} resize-y`}
                    />
                  ) : (
                    <input
                      {...common}
                      type={field.inputMode === "tel" ? "tel" : "text"}
                      inputMode={field.inputMode}
                      maxLength={ORDER_DETAIL_LIMITS[field.name]}
                      onChange={(e) => update(field.name, e.target.value)}
                    />
                  )}
                </div>
                {field.hint && (
                  <p id={`${id}-hint`} className="mt-1.5 type-small text-ink-soft">
                    {field.hint}
                  </p>
                )}
                {error && (
                  <p id={`${id}-error`} className="mt-1.5 type-small text-alert">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </form>

      <aside
        aria-labelledby="order-summary-heading"
        data-note-avoid=""
        className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start"
      >
        <OrderSummary
          heading="Your order"
          headingId="order-summary-heading"
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
          note="Delivery charges, if any, are confirmed by our team on WhatsApp."
        />

        {!resolved.orderable && (
          <div
            ref={cartNotice}
            tabIndex={-1}
            role="alert"
            className="border-l-2 border-harvest pl-4 outline-none"
          >
            {pricesChanged ? (
              <>
                <p className="type-label text-forest">Price updated</p>
                <ul className="mt-2 space-y-1 type-small text-forest">
                  {resolved.lines
                    .filter((line) => line.previousUnitPrice && line.unitPrice)
                    .map((line) => (
                      <li key={`${line.productSlug}:${line.variantId}`}>
                        {line.productName}, {line.weightGrams} g — was{" "}
                        {formatMoney(line.previousUnitPrice!)}, now {formatMoney(line.unitPrice!)}
                      </li>
                    ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 link-quiet inline-flex min-h-11 items-center type-label text-forest underline underline-offset-4"
                  onClick={() => acceptPrices(currentPrices(resolved))}
                >
                  Accept updated prices
                </button>
              </>
            ) : (
              <>
                <p className="type-small text-forest">{NO_LONGER_AVAILABLE}</p>
                <Link
                  href="/cart"
                  className="mt-2 link-quiet inline-flex min-h-11 items-center type-label text-forest underline underline-offset-4"
                >
                  Review your cart
                </Link>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          form="order-form"
          data-mascot-avoid=""
          className={leafButtonClasses({ variant: "primary", size: "lg", fullWidth: true })}
        >
          <ChatIcon className="shrink-0" />
          <span className="leaf-btn__label">Place order on WhatsApp</span>
          <ArrowIcon className="leaf-btn__icon" />
        </button>
        <p className="type-small text-ink-soft">
          WhatsApp opens with your details and order written in. Nothing is sent until you press
          Send. No payment is taken on this site.
        </p>
      </aside>
    </div>
  );
}
