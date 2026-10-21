/**
 * The one way the site talks to Google: entries pushed onto
 * `window.dataLayer` for Google Tag Manager, each also sent to GA4 through
 * gtag.js when it is installed. Components call the `track…` functions in
 * `events.ts`, never this directly.
 */

export interface DataLayerEvent {
  event: string;
  [parameter: string]: unknown;
}

type Gtag = (command: "event", name: string, parameters: Record<string, unknown>) => void;
type DataLayerWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag };

/**
 * Events gtag.js collects by itself: page views, on load and on every
 * client-side navigation (GA4's history-based page views). Sending the
 * site's own page_view as well would count each page twice.
 */
const COLLECTED_BY_GTAG: ReadonlySet<string> = new Set(["page_view"]);

/** Sends an event to GA4 through gtag.js; nothing when gtag.js is not installed. */
function sendToGa4(event: string, parameters: Record<string, unknown>): void {
  if (COLLECTED_BY_GTAG.has(event)) return;
  const { gtag } = window as DataLayerWindow;
  if (typeof gtag === "function") gtag("event", event, parameters);
}

/** `window.dataLayer`, created if GTM has not loaded yet; `null` on the server. */
function getDataLayer(): unknown[] | null {
  if (typeof window === "undefined") return null;
  const target = window as DataLayerWindow;
  // GTM's own contract: one shared array on window, created by whoever comes first.
  target.dataLayer = target.dataLayer ?? [];
  return target.dataLayer;
}

export function pushToDataLayer(entry: DataLayerEvent): void {
  const layer = getDataLayer();
  if (!layer) return;
  // Read before pushing: GTM stamps its own `gtm` field on each entry pushed.
  const { event, ...parameters } = entry;
  layer.push(entry);
  sendToGa4(event, parameters);
}

/**
 * An ecommerce event. GTM merges successive pushes, so the previous
 * `ecommerce` object is cleared first — Google's recommended pattern — and
 * one event's items never leak into the next.
 */
export function pushEcommerceEvent(
  event: string,
  ecommerce: object,
  parameters: Record<string, unknown> = {},
): void {
  const layer = getDataLayer();
  if (!layer) return;
  layer.push({ ecommerce: null });
  layer.push({ event, ...parameters, ecommerce });
  // gtag.js takes the ecommerce fields (currency, value, items) as parameters.
  sendToGa4(event, { ...parameters, ...ecommerce });
}
