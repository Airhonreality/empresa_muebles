export type CanalConversion = 'general' | 'pisos';

export function fireAdsConversion(canal: CanalConversion): void {
  if (typeof window === 'undefined') return;
  const gtagFn = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtagFn) return;

  // El label dedicado de pisos hay que crearlo en Google Ads y ponerlo en
  // NEXT_PUBLIC_GTAG_SEND_TO_PISOS. Hasta entonces cae al label general para
  // no perder el seguimiento.
  const sendTo =
    canal === 'pisos'
      ? process.env.NEXT_PUBLIC_GTAG_SEND_TO_PISOS
      : process.env.NEXT_PUBLIC_GTAG_SEND_TO;

  const target = sendTo || 'AW-10970379192/55ciCNWI4ZQZELjniu8o';
  gtagFn('event', 'conversion', { send_to: target });
}
