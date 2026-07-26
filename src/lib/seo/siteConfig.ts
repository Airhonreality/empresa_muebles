/**
 * Site identity & SEO — generic, data-driven.
 * ────────────────────────────────────────────
 * The engine reads a fork's site identity (title, description, favicon,
 * analytics, organization schema) from storage. A commercial fork fills the
 * `configuracion_comercial` namespace and NEVER edits layout.tsx for branding.
 *
 * Field names are matched by candidate lists so different forks can use their
 * own conventions. Everything is optional; sensible defaults keep a virgin
 * fork neutral.
 */
import type { DataItem } from '@agnostic/core';

type MaybeRecord = Record<string, unknown>;

export type CommercialConfig = {
  brand_name?: string;
  legal_name?: string;
  website_url?: string;
  site_url?: string;
  url?: string;
  logo_url?: string;
  brand_logo?: string;
  same_as?: string[] | string;
  social_links?: string[] | string;
  contact_email?: string;
  email?: string;
  telephone?: string;
  phone?: string;
  address?: MaybeRecord;
  locality?: string;
  region?: string;
  country?: string;
  postal_code?: string;
  // ── Site identity (browser tab, meta, analytics) ──
  site_title?: string;
  site_description?: string;
  favicon_url?: string;
  ga_measurement_id?: string;
};

export type OrganizationSchema = {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: string;
  email?: string;
  telephone?: string;
  sameAs?: string[];
  address?: {
    '@type': 'PostalAddress';
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
};

/** Resolved identity the engine layout injects. All optional except title. */
export type SiteIdentity = {
  name: string;
  title: string;
  description?: string;
  faviconUrl?: string;
  gaMeasurementId?: string;
};

const DEFAULT_NAME = 'Agnostic System';

function firstString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readCandidate(record: MaybeRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = firstString(record[key]);
    if (value) return value;
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(entry => firstString(entry)).filter((entry): entry is string => !!entry);
  }
  const single = firstString(value);
  return single ? [single] : [];
}

function normalizeRecord(input: unknown): MaybeRecord {
  if (!input || typeof input !== 'object') return {};
  return input as MaybeRecord;
}

export function readCommercialConfig(source: unknown): CommercialConfig {
  if (Array.isArray(source)) {
    const first = source.find(item => item && typeof item === 'object') as DataItem | undefined;
    return first ? normalizeCommercialConfig(first.data) : {};
  }
  return normalizeCommercialConfig(source);
}

export function normalizeCommercialConfig(source: unknown): CommercialConfig {
  const record = normalizeRecord(source);
  return {
    brand_name: readCandidate(record, ['brand_name', 'app_name', 'name', 'business_name']),
    legal_name: readCandidate(record, ['legal_name', 'company_name']),
    website_url: readCandidate(record, ['website_url', 'site_url', 'url', 'public_url']),
    logo_url: readCandidate(record, ['logo_url', 'brand_logo', 'logo', 'brand_image']),
    same_as: toStringArray(record.same_as ?? record.social_links ?? record.social_urls),
    contact_email: readCandidate(record, ['contact_email', 'email', 'support_email']),
    telephone: readCandidate(record, ['telephone', 'phone', 'contact_phone']),
    address: normalizeRecord(record.address),
    locality: readCandidate(record, ['locality', 'city', 'address_locality']),
    region: readCandidate(record, ['region', 'state', 'address_region']),
    country: readCandidate(record, ['country', 'address_country']),
    postal_code: readCandidate(record, ['postal_code', 'zip', 'address_postal_code']),
    site_title: readCandidate(record, ['site_title', 'title', 'meta_title', 'page_title']),
    site_description: readCandidate(record, ['site_description', 'description', 'meta_description', 'tagline']),
    favicon_url: readCandidate(record, ['favicon_url', 'favicon', 'icon_url', 'icon']),
    ga_measurement_id: readCandidate(record, ['ga_measurement_id', 'ga_id', 'google_analytics_id', 'gtag_id']),
  };
}

/** Resolve the site identity the layout injects (title/description/favicon/GA). */
export function readSiteIdentity(config: CommercialConfig): SiteIdentity {
  const name = config.brand_name ?? config.legal_name ?? DEFAULT_NAME;
  return {
    name,
    title: config.site_title ?? name,
    description: config.site_description,
    faviconUrl: config.favicon_url,
    gaMeasurementId: config.ga_measurement_id,
  };
}

export function buildOrganizationSchema(config: CommercialConfig): OrganizationSchema {
  const name = config.brand_name ?? config.legal_name ?? DEFAULT_NAME;
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
  };

  const url = config.website_url ?? config.site_url ?? config.url;
  if (url) schema.url = url;
  if (config.logo_url) schema.logo = config.logo_url;

  const email = config.contact_email ?? config.email;
  if (email) schema.email = email;

  const telephone = config.telephone ?? config.phone;
  if (telephone) schema.telephone = telephone;

  const sameAs = Array.from(new Set([
    ...(config.same_as ?? []),
    ...(config.social_links ?? []),
  ].filter((value): value is string => !!value)));
  if (sameAs.length > 0) schema.sameAs = sameAs;

  if (config.locality || config.region || config.country || config.postal_code) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: config.locality,
      addressRegion: config.region,
      postalCode: config.postal_code,
      addressCountry: config.country,
    };
  }

  return schema;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
