"use client";

import Script from "next/script";

/**
 * Componente de integración de Microsoft Clarity para analítica de comportamiento,
 * grabaciones de sesión y mapas de calor (heatmaps).
 * 
 * Se carga de forma asíncrona mediante strategy="afterInteractive" para garantizar
 * cero impacto en Core Web Vitals (LCP, CLS, INP).
 */
export function ClarityAnalytics() {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!clarityId) return null;

  return (
    <Script id="microsoft-clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `}
    </Script>
  );
}
