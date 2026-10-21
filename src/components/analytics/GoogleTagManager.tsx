import Script from "next/script";

import { LOCAL_HOSTNAMES } from "@/lib/analytics/config";

interface GoogleTagManagerProps {
  gtmId: string;
}

/**
 * Google's GTM snippet, loaded once for the whole site after hydration, so it
 * never delays rendering or competes with the page's own scripts. gtm.js
 * itself is async. GA4 is configured inside the container — no gtag.js here.
 * Local hosts are skipped so builds and test runs never reach the reports.
 */
export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const id = JSON.stringify(gtmId);
  const localHosts = JSON.stringify(LOCAL_HOSTNAMES);
  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`if(${localHosts}.indexOf(location.hostname)===-1){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${id});}`}
    </Script>
  );
}

/** GTM's fallback for browsers without JavaScript; placed first in <body>. */
export function GoogleTagManagerNoScript({ gtmId }: GoogleTagManagerProps) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
