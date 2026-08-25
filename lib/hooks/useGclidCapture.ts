"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export const TRACKING_KEYS = [
  "gclid",
  "wbraid",
  "gbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type TrackingData = {
  gclid?: string;
  wbraid?: string;
  gbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

/**
 * Hook para capturar identificadores de Google Ads (gclid, wbraid, gbraid) y UTMs
 * desde los parámetros de la URL y almacenarlos en sessionStorage + cookie First-Party.
 */
export function useGclidCapture(): TrackingData {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    TRACKING_KEYS.forEach((key) => {
      const value = searchParams?.get(key);
      if (value) {
        // 1. Inmediato en sessionStorage
        sessionStorage.setItem(`veta_${key}`, value);

        // 2. Cookie First-Party válida por 90 días (SameSite=Lax)
        const isSecure = window.location.protocol === "https:";
        document.cookie = `veta_${key}=${encodeURIComponent(value)}; path=/; max-age=7776000; SameSite=Lax${
          isSecure ? "; Secure" : ""
        }`;
      }
    });
  }, [searchParams]);

  // Retorna los valores persistidos actualmente
  if (typeof window === "undefined") return {};

  const currentData: TrackingData = {};
  TRACKING_KEYS.forEach((key) => {
    const val = sessionStorage.getItem(`veta_${key}`);
    if (val) {
      currentData[key as keyof TrackingData] = val;
    }
  });

  return currentData;
}
