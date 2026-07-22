import 'server-only';

import { createHash, randomBytes } from 'crypto';
import type { DataItem } from '@agnostic/core';
import { getStrategy } from '@/server/getStrategy';

export const PUBLIC_LINKS_NAMESPACE = 'public_links';

export interface PublicField {
  key: string;
  label: string;
  format?: 'text' | 'currency' | 'number' | 'date' | 'boolean';
}

export interface PublicLinkData {
  context: string;
  record_id: string;
  fields: PublicField[];
  title?: string;
  /** Human-readable public alias. The opaque capability remains stored only as a hash. */
  public_slug?: string;
  expires_at?: string;
  revoked_at?: string;
}

export interface ResolvedPublicLink {
  title: string;
  fields: Array<PublicField & { value: unknown }>;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function createPublicSlug(base: string): string {
  // 64 bits makes an accidental or deliberate alias guess impractical while
  // retaining a compact, copyable URL.
  return `${base}-${randomBytes(8).toString('hex')}`;
}

function isUsable(link: PublicLinkData): boolean {
  if (link.revoked_at) return false;
  return !link.expires_at || new Date(link.expires_at).getTime() > Date.now();
}

export async function createPublicLink(
  input: Omit<PublicLinkData, 'revoked_at' | 'public_slug'>,
  proposalSlugBase?: string,
) {
  if (input.expires_at && new Date(input.expires_at).getTime() <= Date.now()) {
    throw new Error('expires_at must be in the future');
  }
  const strategy = getStrategy();
  const exists = (await strategy.read(input.context)).some(record => record.id === input.record_id);
  if (!exists) throw new Error('Public link target not found');
  const token = randomBytes(32).toString('base64url');
  const links = await strategy.read(PUBLIC_LINKS_NAMESPACE);
  const publicSlug = proposalSlugBase
    ? createPublicSlug(proposalSlugBase)
    : undefined;

  if (publicSlug && links.some(link => link.data?.public_slug === publicSlug)) {
    // A 64-bit collision is extraordinarily unlikely, but rejecting avoids
    // silently creating an ambiguous public address.
    throw new Error('Could not allocate a unique public proposal URL');
  }
  const saved = await strategy.write(PUBLIC_LINKS_NAMESPACE, {
    data: { ...input, public_slug: publicSlug, token_hash: hashToken(token) },
  });
  return { id: saved.id, token, public_slug: publicSlug };
}

export async function revokePublicLink(id: string): Promise<boolean> {
  const strategy = getStrategy();
  const link = (await strategy.read(PUBLIC_LINKS_NAMESPACE)).find(item => item.id === id);
  if (!link) return false;
  await strategy.write(PUBLIC_LINKS_NAMESPACE, {
    id: link.id,
    data: { ...link.data, revoked_at: new Date().toISOString() },
  });
  return true;
}

async function resolvePublicLinkRecord(linkRecord: DataItem | undefined): Promise<ResolvedPublicLink | null> {
  const strategy = getStrategy();
  const link = linkRecord?.data as PublicLinkData | undefined;
  if (!link || !isUsable(link)) return null;

  const record = (await strategy.read(link.context))
    .find(item => item.id === link.record_id) as DataItem | undefined;
  if (!record) return null;

  return {
    title: link.title ?? 'Documento compartido',
    fields: link.fields.map(field => ({ ...field, value: record.data?.[field.key] })),
  };
}

/** Resolves exactly one opaque capability and emits only its approved field projection. */
export async function resolvePublicLink(token: string): Promise<ResolvedPublicLink | null> {
  const strategy = getStrategy();
  const tokenHash = hashToken(token);
  const linkRecord = (await strategy.read(PUBLIC_LINKS_NAMESPACE))
    .find(item => item.data?.token_hash === tokenHash);
  return resolvePublicLinkRecord(linkRecord);
}

/** Resolves an elegant public proposal URL without exposing the internal capability. */
export async function resolvePublicLinkBySlug(publicSlug: string): Promise<ResolvedPublicLink | null> {
  const strategy = getStrategy();
  const linkRecord = (await strategy.read(PUBLIC_LINKS_NAMESPACE))
    .find(item => item.data?.public_slug === publicSlug);
  return resolvePublicLinkRecord(linkRecord);
}
