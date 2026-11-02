export type CanalConversion = 'general' | 'pisos';

export function fireAdsConversion(canal: CanalConversion): void {
  if (typeof window === 'undefined') return;
  const gtagFn = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtagFn) return;

  const sendTo =
    canal === 'pisos'
      ? process.env.NEXT_PUBLIC_GTAG_SEND_TO_PISOS
      : process.env.NEXT_PUBLIC_GTAG_SEND_TO;

  const target =
    sendTo ||
    (canal === 'pisos'
      ? 'AW-18552570599/cLS5CJ7b-rAdEOeFx45F'
      : 'AW-10970379192/55ciCNWI4ZQZELjniu8o');
  gtagFn('event', 'conversion', { send_to: target });
}
