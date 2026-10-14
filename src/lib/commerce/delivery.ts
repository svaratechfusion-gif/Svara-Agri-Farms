/**
 * Delivery details for an order request: what the customer may enter, and
 * how it is checked. Pure, so the same rules run in the browser (instant
 * field errors) and on the server (the record that is saved).
 *
 * A valid PIN code only means the format is right — no serviceability check
 * exists yet, and nothing here claims one.
 */

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const DELIVERY_FIELDS = [
  "fullName",
  "phone",
  "email",
  "addressLine1",
  "addressLine2",
  "locality",
  "city",
  "state",
  "pinCode",
  "instructions",
] as const;

export type DeliveryField = (typeof DELIVERY_FIELDS)[number];

/** What the form sends: every field as entered. */
export type DeliveryInput = Record<DeliveryField, string>;

/** What is saved: cleaned, with optional fields `null` when left empty. */
export interface DeliveryDetails {
  fullName: string;
  /** E.164, e.g. +919876543210. */
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  locality: string;
  city: string;
  state: IndianState;
  pinCode: string;
  instructions: string | null;
}

export type DeliveryErrors = Partial<Record<DeliveryField, string>>;

export type DeliveryResult =
  { ok: true; value: DeliveryDetails } | { ok: false; errors: DeliveryErrors };

interface TextRule {
  required: boolean;
  min: number;
  max: number;
  missing: string;
}

const TEXT_RULES: Record<
  "fullName" | "addressLine1" | "addressLine2" | "locality" | "city" | "instructions",
  TextRule
> = {
  fullName: { required: true, min: 2, max: 80, missing: "Enter your full name." },
  addressLine1: {
    required: true,
    min: 3,
    max: 120,
    missing: "Enter your house, street or building.",
  },
  addressLine2: { required: false, min: 0, max: 120, missing: "" },
  locality: { required: true, min: 2, max: 80, missing: "Enter your locality or village." },
  city: { required: true, min: 2, max: 80, missing: "Enter your city or town." },
  instructions: { required: false, min: 0, max: 300, missing: "" },
};

const PHONE_ERROR = "Enter a 10-digit Indian mobile number, e.g. 98765 43210.";
const PIN_ERROR = "Enter a 6-digit PIN code, e.g. 516101.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trims, collapses inner whitespace and drops control characters. */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** An Indian mobile number in E.164 form, or null. Accepts +91, 91 or 0 prefixes. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, "");
  const local = digits.replace(/^(\+91|0091|091|91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

function checkText(field: keyof typeof TEXT_RULES, value: string, errors: DeliveryErrors) {
  const rule = TEXT_RULES[field];
  if (!value) {
    if (rule.required) errors[field] = rule.missing;
    return;
  }
  if (value.length < rule.min) errors[field] = rule.missing;
  else if (value.length > rule.max) errors[field] = `Keep this under ${rule.max} characters.`;
}

export function validateDelivery(input: DeliveryInput): DeliveryResult {
  const value = Object.fromEntries(
    DELIVERY_FIELDS.map((field) => [field, clean(input[field])]),
  ) as DeliveryInput;
  const errors: DeliveryErrors = {};

  (Object.keys(TEXT_RULES) as (keyof typeof TEXT_RULES)[]).forEach((field) =>
    checkText(field, value[field], errors),
  );

  const phone = value.phone ? normalizePhone(value.phone) : null;
  if (!phone) errors.phone = PHONE_ERROR;

  const pinCode = value.pinCode.replace(/\s/g, "");
  if (!/^[1-9]\d{5}$/.test(pinCode)) errors.pinCode = PIN_ERROR;

  if (!(INDIAN_STATES as readonly string[]).includes(value.state)) {
    errors.state = "Choose your state or union territory.";
  }

  const email = value.email.toLowerCase();
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    errors.email = "Enter a valid email address, or leave it empty.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName: value.fullName,
      phone: phone!,
      email: email || null,
      addressLine1: value.addressLine1,
      addressLine2: value.addressLine2 || null,
      locality: value.locality,
      city: value.city,
      state: value.state as IndianState,
      pinCode,
      instructions: value.instructions || null,
    },
  };
}
