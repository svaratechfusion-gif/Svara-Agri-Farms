/**
 * Analytics configuration (see docs/analytics.md). GA4 is loaded directly
 * with gtag.js, which counts page views itself; Google Tag Manager is loaded
 * alongside for other tags and must not send to the same GA4 property.
 */

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/;

/** The GTM container ID, or `null` when analytics is off (unset or blank). */
export function parseGtmId(raw: string | undefined): string | null {
  const id = raw?.trim();
  if (!id) return null;
  if (!GTM_ID_PATTERN.test(id)) {
    throw new Error(`NEXT_PUBLIC_GTM_ID is not a GTM container ID (GTM-XXXXXXX): "${id}"`);
  }
  return id;
}

/** Public container ID from NEXT_PUBLIC_GTM_ID (set in .env.production). Not a secret. */
export const GTM_ID = parseGtmId(process.env.NEXT_PUBLIC_GTM_ID);

const GA4_ID_PATTERN = /^G-[A-Z0-9]{6,12}$/;

/** The GA4 measurement ID, or `null` when GA4 is off (unset or blank). */
export function parseGa4Id(raw: string | undefined): string | null {
  const id = raw?.trim();
  if (!id) return null;
  if (!GA4_ID_PATTERN.test(id)) {
    throw new Error(`NEXT_PUBLIC_GA4_ID is not a GA4 measurement ID (G-XXXXXXXXXX): "${id}"`);
  }
  return id;
}

/** Public measurement ID from NEXT_PUBLIC_GA4_ID (set in .env.production). Not a secret. */
export const GA4_ID = parseGa4Id(process.env.NEXT_PUBLIC_GA4_ID);

/**
 * Hosts where GTM and gtag.js are not loaded: local builds and test runs, so
 * they never reach the GA4 reports. Events are still pushed to
 * `window.dataLayer` there.
 */
export const LOCAL_HOSTNAMES: readonly string[] = ["localhost", "127.0.0.1", "[::1]"];

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.includes(hostname);
}
