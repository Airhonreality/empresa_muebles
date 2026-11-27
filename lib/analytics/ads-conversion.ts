export type CanalConversion = 'general' | 'pisos';

/**
 * Dispara la conversión de Google Ads. Si se pasa `onDone`, se llama cuando Google confirma el
 * envío del evento (o tras 1 s como tope), para poder navegar después sin perder la conversión.
 */
export function fireAdsConversion(canal: CanalConversion, onDone?: () => void): void {
  if (typeof window === 'undefined') return;
  const gtagFn = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtagFn) {
    onDone?.();
    return;
  }

  const sendTo =
    canal === 'pisos'
      ? process.env.NEXT_PUBLIC_GTAG_SEND_TO_PISOS
      : process.env.NEXT_PUBLIC_GTAG_SEND_TO;

  const target =
    sendTo ||
    (canal === 'pisos'
      ? 'AW-18552570599/cLS5CJ7b-rAdEOeFx45F'
      : 'AW-10970379192/55ciCNWI4ZQZELjniu8o');
  if (!onDone) {
    gtagFn('event', 'conversion', { send_to: target });
    return;
  }
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    onDone();
  };
  gtagFn('event', 'conversion', { send_to: target, event_callback: done });
  setTimeout(done, 1000);
}
