import { INDIAN_STATES, normalizePhone, type IndianState } from "./delivery";

/**
 * The customer's details for a WhatsApp order: what the order page asks for,
 * and how it is checked. Pure, so the rules are tested directly. Nothing here
 * is sent to the website — the details go only into the WhatsApp message the
 * customer sends themselves.
 *
 * A valid mobile number is only well formed (not verified), and a valid PIN
 * code says nothing about whether it can be delivered to.
 */

export const ORDER_DETAIL_FIELDS = [
  "fullName",
  "mobile",
  "address",
  "city",
  "state",
  "pinCode",
  "landmark",
  "instructions",
] as const;

export type OrderDetailField = (typeof ORDER_DETAIL_FIELDS)[number];

/** What the form holds: every field as typed. */
export type OrderDetailsInput = Record<OrderDetailField, string>;

/** What goes into the message: cleaned, optional fields null when empty. */
export interface OrderDetails {
  fullName: string;
  /** E.164, e.g. +919876543210. */
  mobile: string;
  address: string;
  city: string;
  state: IndianState;
  pinCode: string;
  landmark: string | null;
  instructions: string | null;
}

export type OrderDetailErrors = Partial<Record<OrderDetailField, string>>;

export type OrderDetailsResult =
  { ok: true; value: OrderDetails } | { ok: false; errors: OrderDetailErrors };

export const EMPTY_ORDER_DETAILS: OrderDetailsInput = Object.fromEntries(
  ORDER_DETAIL_FIELDS.map((field) => [field, ""]),
) as OrderDetailsInput;

export const ORDER_DETAIL_MESSAGES = {
  fullName: "Please enter your full name.",
  mobile: "Please enter a valid 10-digit Indian mobile number.",
  address: "Please enter your delivery address.",
  city: "Please enter your city.",
  state: "Please select your state.",
  pinCode: "Please enter a valid 6-digit PIN code.",
} as const;

/** Longest accepted value per field. */
export const ORDER_DETAIL_LIMITS: Record<OrderDetailField, number> = {
  fullName: 80,
  mobile: 20,
  address: 300,
  city: 80,
  state: 60,
  pinCode: 7,
  landmark: 120,
  instructions: 300,
};

const tooLong = (max: number) => `Please keep this under ${max} characters.`;

/**
 * One line of text: control characters and line breaks become spaces, runs
 * of spaces collapse. Keeps every value on its own line in the message, so a
 * typed value can never look like another part of the order.
 */
export function oneLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A multi-line address as one line: its lines joined with commas. */
function addressLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.split(/\r?\n/).map(oneLine).filter(Boolean).join(", ");
}

export function validateOrderDetails(input: OrderDetailsInput): OrderDetailsResult {
  const value = {
    fullName: oneLine(input.fullName),
    mobile: oneLine(input.mobile),
    address: addressLine(input.address),
    city: oneLine(input.city),
    state: oneLine(input.state),
    pinCode: oneLine(input.pinCode).replace(/\s/g, ""),
    landmark: oneLine(input.landmark),
    instructions: oneLine(input.instructions),
  };
  const errors: OrderDetailErrors = {};

  if (value.fullName.length < 2) errors.fullName = ORDER_DETAIL_MESSAGES.fullName;
  const mobile = value.mobile ? normalizePhone(value.mobile) : null;
  if (!mobile) errors.mobile = ORDER_DETAIL_MESSAGES.mobile;
  if (value.address.length < 5) errors.address = ORDER_DETAIL_MESSAGES.address;
  if (value.city.length < 2) errors.city = ORDER_DETAIL_MESSAGES.city;
  if (!(INDIAN_STATES as readonly string[]).includes(value.state)) {
    errors.state = ORDER_DETAIL_MESSAGES.state;
  }
  if (!/^[1-9]\d{5}$/.test(value.pinCode)) errors.pinCode = ORDER_DETAIL_MESSAGES.pinCode;

  for (const field of ["fullName", "address", "city", "landmark", "instructions"] as const) {
    if (!errors[field] && value[field].length > ORDER_DETAIL_LIMITS[field]) {
      errors[field] = tooLong(ORDER_DETAIL_LIMITS[field]);
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName: value.fullName,
      mobile: mobile!,
      address: value.address,
      city: value.city,
      state: value.state as IndianState,
      pinCode: value.pinCode,
      landmark: value.landmark || null,
      instructions: value.instructions || null,
    },
  };
}

/** +919876543210 → "+91 98765 43210". */
export function formatMobile(e164: string): string {
  const local = e164.replace(/^\+91/, "");
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

/** Restores a saved form from untrusted storage; unknown or non-text values become empty. */
export function parseSavedOrderDetails(raw: string | null): OrderDetailsInput {
  if (!raw) return EMPTY_ORDER_DETAILS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_ORDER_DETAILS;
    const record = parsed as Record<string, unknown>;
    return Object.fromEntries(
      ORDER_DETAIL_FIELDS.map((field) => {
        const value = record[field];
        return [
          field,
          typeof value === "string" ? value.slice(0, ORDER_DETAIL_LIMITS[field] + 50) : "",
        ];
      }),
    ) as OrderDetailsInput;
  } catch {
    return EMPTY_ORDER_DETAILS;
  }
}
