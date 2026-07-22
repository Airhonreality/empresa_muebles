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
    if (first) {
      return normalizeCommercialConfig(first.data);
    }
    return {};
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
  };
}

export function buildOrganizationSchema(config: CommercialConfig): OrganizationSchema {
  const name = config.brand_name ?? config.legal_name ?? 'Agnostic System';
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
  };

  const url = config.website_url ?? config.site_url ?? config.url;
  if (url) schema.url = url;

  const logo = config.logo_url;
  if (logo) schema.logo = logo;

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
