"use client";

import Script from "next/script";

/**
 * Componente de inyección oficial de Google Tag (gtag.js) para Google Ads.
 * Utiliza NEXT_PUBLIC_GTAG_ID de las variables de entorno.
 */
export function GoogleTagAnalytics() {
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID || "AW-10970379192";

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
      />
      <Script id="google-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtagId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
