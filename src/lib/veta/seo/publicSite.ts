export const PUBLIC_SITE_URL = 'https://vetadeoro.co';

export function getPublicSiteUrl(pathname = ''): string {
  if (!pathname) return PUBLIC_SITE_URL;
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(normalizedPath, PUBLIC_SITE_URL).toString();
}

export function getGoogleAnalyticsMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
}
