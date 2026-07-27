/**
 * Fork-owned marketing/SEO injections — data, not engine edits.
 * ─────────────────────────────────────────────────────────────
 * A fork drops a `storage/site-injections.json` file to add pixels, GTM,
 * verification meta, preconnects, extra JSON-LD, or end-of-body widgets WITHOUT
 * touching layout.tsx. Rendered as REAL React elements so <script> tags execute
 * (raw innerHTML injection would not) and <meta> is server-rendered for crawlers.
 *
 * Trust model: the file lives in the fork's own storage — same trust as
 * tokens.css / custom.css. It is not user input.
 *
 * Shape (all optional):
 * {
 *   "head": {
 *     "meta":   [{ "name": "google-site-verification", "content": "..." }],
 *     "link":   [{ "rel": "preconnect", "href": "https://connect.facebook.net" }],
 *     "script": [{ "src": "https://www.googletagmanager.com/gtm.js?id=GTM-XXX", "async": true },
 *                { "id": "meta-pixel", "innerHTML": "!function(f,b,e){...}" }],
 *     "jsonLd": [{ "@context": "https://schema.org", "@type": "WebSite", "name": "..." }]
 *   },
 *   "bodyEnd": {
 *     "script": [{ "src": "https://widget.chat.com/loader.js", "async": true }]
 *   }
 * }
 */
import fs from 'fs/promises';
import path from 'path';
import { serializeJsonLd } from './siteConfig';

export type MetaTag = Record<string, string | undefined>;
export type LinkTag = Record<string, string | undefined>;
export interface ScriptTag {
  src?: string;
  async?: boolean;
  defer?: boolean;
  type?: string;
  id?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Inline script body. Rendered inside a real <script>, so it executes at parse. */
  innerHTML?: string;
}

export interface InjectionGroup {
  meta?: MetaTag[];
  link?: LinkTag[];
  script?: ScriptTag[];
  jsonLd?: unknown[];
}

export interface SiteInjections {
  head?: InjectionGroup;
  bodyEnd?: InjectionGroup;
}

const INJECTIONS_FILE = 'site-injections.json';

export async function readSiteInjections(storageRoot: string): Promise<SiteInjections> {
  try {
    const raw = await fs.readFile(path.join(storageRoot, INJECTIONS_FILE), 'utf-8');
    const parsed = JSON.parse(raw.replace(/^﻿/, ''));
    return parsed && typeof parsed === 'object' ? (parsed as SiteInjections) : {};
  } catch {
    return {};
  }
}

function renderScript(tag: ScriptTag, key: string) {
  const { innerHTML, ...attrs } = tag;
  if (innerHTML) {
    return <script key={key} {...attrs} dangerouslySetInnerHTML={{ __html: innerHTML }} />;
  }
  return <script key={key} {...attrs} />;
}

function renderGroup(group: InjectionGroup | undefined, prefix: string) {
  if (!group) return null;
  return (
    <>
      {group.meta?.map((m, i) => <meta key={`${prefix}-meta-${i}`} {...m} />)}
      {group.link?.map((l, i) => <link key={`${prefix}-link-${i}`} {...l} />)}
      {group.script?.map((s, i) => renderScript(s, `${prefix}-script-${i}`))}
      {group.jsonLd?.map((obj, i) => (
        <script
          key={`${prefix}-jsonld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
    </>
  );
}

/** Elements to render inside <head>. */
export function HeadInjections({ injections }: { injections: SiteInjections }) {
  return renderGroup(injections.head, 'head');
}

/** Elements to render at the end of <body>. */
export function BodyEndInjections({ injections }: { injections: SiteInjections }) {
  return renderGroup(injections.bodyEnd, 'body');
}
