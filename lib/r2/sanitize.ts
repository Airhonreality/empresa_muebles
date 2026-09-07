export const R2_PUBLIC_DOMAIN = "https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev";

const HOSTS_EFIMEROS: Array<{ host: string; motivo: string }> = [
  { host: ".vercel.app", motivo: "URL de preview de Vercel, efímera por deploy" },
  { host: "prod-files-secure.s3.us-west-2.amazonaws.com", motivo: "CDN efímera de Notion (los archivos se caen solos)" },
];

export function esUrlR2(url: string): boolean {
  return url.includes(".r2.dev") || url.includes("cloudflarestorage.com");
}

export function hostUrl(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function motivoHostEfimero(url: string): string | null {
  const host = hostUrl(url);
  if (!host) return null;
  for (const { host: patron, motivo } of HOSTS_EFIMEROS) {
    if (host === patron || host.endsWith(patron)) return motivo;
  }
  return null;
}

export function esUrlEfimera(url: string): boolean {
  return motivoHostEfimero(url) !== null;
}

export function esUrlPermitida(url: string): boolean {
  if (!esUrlR2(url)) return false;
  const host = hostUrl(url);
  if (!host) return false;
  return host === new URL(R2_PUBLIC_DOMAIN).host || host.endsWith(".r2.dev") || host === "veta-dorada.r2.cloudflarestorage.com";
}

export function sanitizarUrlIndividual(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const limpia = url.trim();
  if (!limpia) return null;
  if (limpia.startsWith("blob:")) return null;
  if (limpia.startsWith("/api/assets")) return null;
  if (esUrlEfimera(limpia)) return null;
  if (!limpia.startsWith("http://") && !limpia.startsWith("https://")) return null;
  return limpia;
}

export function sanitizarUrlsFotos(urls?: string[] | null, opts: { permitirExternas?: boolean } = {}): string[] | undefined {
  if (!urls) return undefined;
  const { permitirExternas = true } = opts;
  const salida: string[] = [];
  for (const u of urls) {
    const limpia = sanitizarUrlIndividual(u);
    if (!limpia) continue;
    if (!permitirExternas && !esUrlR2(limpia)) continue;
    if (!salida.includes(limpia)) salida.push(limpia);
  }
  return salida;
}