"use client";

import { useGclidCapture } from "@/lib/hooks/useGclidCapture";

/**
 * Componente Headless (invisible) que ejecuta la captura de atribución
 * de Google Ads y UTMs en el lado del cliente.
 * 
 * IMPORTANTE: Debe envolverse siempre en <Suspense> en app/layout.tsx
 * para no deshabilitar la optimización estática de Next.js App Router.
 */
export function AttributionTracker() {
  useGclidCapture();
  return null;
}
