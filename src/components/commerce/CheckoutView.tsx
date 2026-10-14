"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { LeafButton } from "@/components/ui/LeafButton";
import { products } from "@/content/products";
import {
  DELIVERY_FIELDS,
  INDIAN_STATES,
  validateDelivery,
  type DeliveryErrors,
  type DeliveryField,
  type DeliveryInput,
} from "@/lib/commerce/delivery";
import { resolveCart } from "@/lib/commerce/orderLines";
import {
  newSubmissionKey,
  rememberOrderRequest,
  sendOrderRequest,
  type SendError,
} from "@/lib/commerce/orderRequestClient";

import { useCart, useHydrated } from "./CartProvider";
import { OrderSummary } from "./OrderSummary";

interface FieldSpec {
  name: DeliveryField;
  label: string;
  required: boolean;
  autoComplete: string;
  inputMode?: "tel" | "numeric" | "email";
  hint?: string;
  multiline?: boolean;
}

const FIELDS: readonly FieldSpec[] = [
  { name: "fullName", label: "Full name", required: true, autoComplete: "name" },
  {
    name: "phone",
    label: "Phone number",
    required: true,
    autoComplete: "tel-national",
    inputMode: "tel",
    hint: "A 10-digit Indian mobile number, so our team can reach you.",
  },
  {
    name: "email",
    label: "Email address",
    required: false,
    autoComplete: "email",
    inputMode: "email",
  },
  {
    name: "addressLine1",
    label: "Address line 1",
    required: true,
    autoComplete: "address-line1",
    hint: "House number, street or building.",
  },
  { name: "addressLine2", label: "Address line 2", required: false, autoComplete: "address-line2" },
  {
    name: "locality",
    label: "Locality or village",
    required: true,
    autoComplete: "address-level3",
  },
  { name: "city", label: "City or town", required: true, autoComplete: "address-level2" },
  {
    name: "state",
    label: "State or union territory",
    required: true,
    autoComplete: "address-level1",
  },
  {
    name: "pinCode",
    label: "PIN code",
    required: true,
    autoComplete: "postal-code",
    inputMode: "numeric",
  },
  {
    name: "instructions",
    label: "Delivery instructions",
    required: false,
    autoComplete: "off",
    multiline: true,
    hint: "Anything that helps us find you.",
  },
];

const EMPTY: DeliveryInput = Object.fromEntries(
  DELIVERY_FIELDS.map((f) => [f, ""]),
) as DeliveryInput;

const FAILURE_COPY: Record<Exclude<SendError, "invalid-delivery">, string> = {
  "not-accepting":
    "We are not able to receive order requests online yet. Nothing has been sent. Your cart and details are kept here — please try again later.",
  "unavailable-items":
    "Some items in your cart can no longer be ordered. Nothing has been sent. Please review your cart.",
  "invalid-request":
    "Your order request could not be read. Nothing has been sent. Please review your cart and try again.",
  "save-failed":
    "Your order request could not be saved, so it has not been received. Your cart and details are kept here — please try again.",
  "rate-limited":
    "Too many attempts in a short time. Nothing new has been sent. Please wait a minute and try again.",
  network:
    "We could not reach SVARA Farms — check your connection. Your cart and details are kept here; trying again will not send it twice.",
};

/**
 * Delivery details and the order request. Validates as the customer goes,
 * submits once (a submission key makes retries safe), and only on a
 * confirmed save clears the cart and shows the confirmation.
 */
export function CheckoutView() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [values, setValues] = useState<DeliveryInput>(EMPTY);
  const [errors, setErrors] = useState<DeliveryErrors>({});
  const [status, setStatus] = useState<"editing" | "sending" | "sent">("editing");
  const [failure, setFailure] = useState<string | null>(null);
  // Made on the first submit and kept, so a retry can never save a second request.
  const submissionKey = useRef<string | null>(null);
  const sending = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const failureRef = useRef<HTMLParagraphElement>(null);

  const resolved = resolveCart(cart, products);
  const hydrated = useHydrated();

  if (!hydrated) return <p className="py-10 type-body text-ink-soft">Loading your cart…</p>;
  if (status === "sent") {
    return <p className="py-10 type-body text-ink-soft">Opening your confirmation…</p>;
  }

  if (resolved.lines.length === 0 || !resolved.orderable) {
    const empty = resolved.lines.length === 0;
    return (
      <div className="flex flex-col items-start gap-5 py-10">
        <h2 className="type-h2 text-forest">
          {empty ? "Your cart is empty." : "Your cart needs a look first."}
        </h2>
        <p className="max-w-md type-body text-ink-soft">
          {empty
            ? "Add something from the shop before entering delivery details."
            : "Some items in it can no longer be ordered. Remove them from your cart to continue."}
        </p>
        <LeafButton href={empty ? "/shop" : "/cart"} icon="arrow">
          {empty ? "Go to the shop" : "Review your cart"}
        </LeafButton>
      </div>
    );
  }

  const update = (field: DeliveryField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const showErrors = (found: DeliveryErrors) => {
    setErrors(found);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const showFailure = (message: string) => {
    setFailure(message);
    requestAnimationFrame(() => failureRef.current?.focus());
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending.current) return;
    setFailure(null);
    const checked = validateDelivery(values);
    if (!checked.ok) {
      showErrors(checked.errors);
      return;
    }
    sending.current = true;
    setStatus("sending");
    submissionKey.current ??= newSubmissionKey();
    const result = await sendOrderRequest(
      { lines: cart.lines, delivery: values },
      submissionKey.current,
    );
    if (result.ok) {
      // Saved by the server: only now is the cart cleared.
      rememberOrderRequest(result.order);
      setStatus("sent");
      clearCart();
      router.push("/checkout/confirmation");
      return;
    }
    sending.current = false;
    setStatus("editing");
    if (result.error === "invalid-delivery" && result.errors) showErrors(result.errors);
    else
      showFailure(
        FAILURE_COPY[result.error === "invalid-delivery" ? "invalid-request" : result.error],
      );
  };

  const errorList = FIELDS.filter((field) => errors[field.name]);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <form noValidate onSubmit={submit} aria-labelledby="delivery-heading" className="min-w-0">
        <h2 id="delivery-heading" className="type-h3 text-forest">
          Delivery details
        </h2>
        <p className="mt-2 type-small text-ink-soft">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">required</span> are required. We use these details only to
          arrange your order.
        </p>

        {errorList.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="mt-6 border-l-2 border-alert bg-ivory-deep/60 p-4 outline-none"
          >
            <p className="type-small font-semibold text-forest">Please check these details:</p>
            <ul className="mt-2 list-disc pl-5 type-small text-forest">
              {errorList.map((field) => (
                <li key={field.name}>
                  <a href={`#field-${field.name}`} className="underline underline-offset-4">
                    {field.label}: {errors[field.name]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {FIELDS.map((field) => {
            const id = `field-${field.name}`;
            const error = errors[field.name];
            const describedBy = [field.hint && `${id}-hint`, error && `${id}-error`]
              .filter(Boolean)
              .join(" ");
            const wide = ["addressLine1", "addressLine2", "instructions"].includes(field.name);
            const common = {
              id,
              name: field.name,
              value: values[field.name],
              required: field.required,
              autoComplete: field.autoComplete,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": describedBy || undefined,
              className: `checkout-input w-full rounded-xl border bg-ivory px-4 py-3 type-body text-ink ${
                error ? "border-alert" : "border-ink/25"
              }`,
            } as const;
            return (
              <div key={field.name} className={wide ? "sm:col-span-2" : undefined}>
                <label htmlFor={id} className="block type-label text-earth-ink">
                  {field.label}
                  {field.required ? (
                    <span aria-hidden="true"> *</span>
                  ) : (
                    <span className="text-ink-soft normal-case"> (optional)</span>
                  )}
                </label>
                <div className="mt-2">
                  {field.name === "state" ? (
                    <select {...common} onChange={(e) => update(field.name, e.target.value)}>
                      <option value="">Choose…</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  ) : field.multiline ? (
                    <textarea
                      {...common}
                      rows={3}
                      maxLength={300}
                      onChange={(e) => update(field.name, e.target.value)}
                    />
                  ) : (
                    <input
                      {...common}
                      type={
                        field.inputMode === "email"
                          ? "email"
                          : field.inputMode === "tel"
                            ? "tel"
                            : "text"
                      }
                      inputMode={field.inputMode}
                      maxLength={field.name === "pinCode" ? 7 : 120}
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

        <div className="mt-10 border-t hairline pt-8">
          {failure && (
            <p
              ref={failureRef}
              tabIndex={-1}
              role="alert"
              className="mb-6 border-l-2 border-alert bg-ivory-deep/60 p-4 type-small text-forest outline-none"
            >
              {failure}
            </p>
          )}
          <LeafButton type="submit" size="lg" icon="arrow" loading={status === "sending"}>
            Submit order request
          </LeafButton>
          <p className="mt-4 max-w-lg type-small text-ink-soft" aria-live="polite">
            {status === "sending"
              ? "Sending your order request…"
              : "No payment is collected. Our team will contact you to confirm availability, delivery charges and payment arrangements."}
          </p>
        </div>
      </form>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
        <OrderSummary
          rows={resolved.lines.map((line) => ({
            key: `${line.productSlug}:${line.variantId}`,
            name: line.productName,
            variantLabel: line.variantLabel,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }))}
          subtotal={resolved.subtotal}
        />
        <Link href="/cart" className="link-quiet self-start type-label text-forest">
          ← Edit your cart
        </Link>
      </aside>
    </div>
  );
}
