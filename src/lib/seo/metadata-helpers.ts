import type { Metadata } from 'next';
import { readCommercialConfig, readSiteIdentity } from './siteConfig';
import { getVaultData } from '@/core/server/vault';

/**
 * Reusable metadata helpers para garantizar consistencia SEO en todo el sitio.
 * Todos los títulos siguen: "{página} | {marca}" para chainable browser back-button UX.
 */

export interface MetadataContext {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
}

/**
 * Resuelve identidad del sitio (marca, URL base) desde configuracion_comercial.
 * Cached per-request por Next.js.
 */
export async function getSiteIdentity() {
  try {
    const data = await getVaultData(['configuracion_comercial']);
    return readSiteIdentity(readCommercialConfig(data['configuracion_comercial'] as unknown));
  } catch {
    return {
      name: 'Veta Dorada',
      title: 'Veta Dorada',
      description: 'Carpintería arquitectónica de alta precisión',
      siteUrl: 'https://vetadorada.co',
      ogImage: undefined,
      faviconUrl: '/favicon.svg',
      gaMeasurementId: undefined,
      twitterHandle: undefined,
    };
  }
}

/**
 * Construye metadata completo con patrón consistente: "{title} | {brand}"
 */
export async function buildMetadata(context: MetadataContext): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const pageTitle = `${context.title} | ${identity.name}`;
  const siteUrl = identity.siteUrl ?? 'https://vetadorada.co';

  return {
    title: pageTitle,
    description: context.description,
    alternates: context.canonical ? { canonical: context.canonical } : undefined,
    openGraph: {
      title: pageTitle,
      description: context.description,
      url: context.canonical || siteUrl,
      siteName: identity.name,
      type: 'website',
      images: context.ogImage ? [context.ogImage] : identity.ogImage ? [identity.ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: context.description,
      images: context.ogImage || identity.ogImage,
      site: identity.twitterHandle,
    },
  };
}

/**
 * Metadata para portafolio: "{tipo de proyecto} | Veta Dorada"
 */
export async function buildPortfolioItemMetadata(item: {
  nombre: string;
  descripcion?: string;
  imagen?: string;
  categoria?: string;
}): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const baseUrl = identity.siteUrl ?? 'https://vetadorada.co';
  const slug = item.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return buildMetadata({
    title: item.nombre,
    description: item.descripcion || `Proyecto de ${item.categoria || 'carpintería'} realizado por Veta Dorada`,
    ogImage: item.imagen,
    canonical: `${baseUrl}/portafolio/${slug}`,
  });
}

/**
 * Metadata para documentos compartidos (propuestas, presupuestos)
 */
export async function buildPublicShareMetadata(document: {
  title: string;
  description?: string;
}): Promise<Metadata> {
  const identity = await getSiteIdentity();
  return buildMetadata({
    title: document.title,
    description: document.description || `Documento compartido por ${identity.name}`,
    ogImage: identity.ogImage,
  });
}
