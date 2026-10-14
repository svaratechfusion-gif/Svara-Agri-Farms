import type { Availability } from "./types";

/** Customer-facing wording for each availability state. */
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Available",
  "coming-soon": "Coming soon",
  "sold-out": "Sold out",
};
