'use client';

import { useEffect } from 'react';

export function useGclidCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const storeIfPresent = (key: string, storageKey: string) => {
      const value = params.get(key);
      if (value) window.sessionStorage.setItem(storageKey, value);
    };

    storeIfPresent('gclid', 'veta_gclid');
    storeIfPresent('utm_source', 'veta_utm_source');
    storeIfPresent('utm_medium', 'veta_utm_medium');
    storeIfPresent('utm_campaign', 'veta_utm_campaign');
  }, []);
}
