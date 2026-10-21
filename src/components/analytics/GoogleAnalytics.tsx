import { LOCAL_HOSTNAMES } from "@/lib/analytics/config";

interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Google's gtag.js snippet for GA4, rendered in <head>. It runs while the
 * HTML is parsed, so `gtag()` exists before hydration and events from the
 * first render — a product page's view_item on a direct visit — are queued
 * rather than lost; gtag.js itself loads async and never blocks rendering.
 * Page views are GA4's own (on load and on client-side navigation). Local
 * hosts are skipped, as for GTM.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const id = JSON.stringify(measurementId);
  const localHosts = JSON.stringify(LOCAL_HOSTNAMES);
  const snippet = `if(${localHosts}.indexOf(location.hostname)===-1){
window.dataLayer=window.dataLayer||[];
window.gtag=function gtag(){dataLayer.push(arguments);};
gtag('js',new Date());
gtag('config',${id});
var s=document.createElement('script');s.async=true;
s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(${id});
document.head.appendChild(s);}`;
  return <script id="google-analytics" dangerouslySetInnerHTML={{ __html: snippet }} />;
}
