/**
 * 🏛️ ARTEFACTO: resolver.ts
 * ────────────
 * CAPA: Staging / Server (Server-Side Route Resolver)
 * VERSIÓN: 2.0
 * COMMIT: P3-M3.1-RESOLVER-AXIOMATIC
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Perform deterministic routing and record resolution on the Server.
 * - Map slug URLs to specific records and compile clean block representations.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Perform route resolution in pure memory based on loaded vault arrays.
 * - NEVER: Import Middleware.ts, dynamic DNACompilers, or compilePage.
 * - ALWAYS: Identify records strictly by ID, avoiding slug-based search fallbacks.
 * 
 * 📜 ADR: [2026-05-16] ROUTE_RESOLVER_PRUNING
 * - DECISIÓN: Inline the block normalization logic, replace _slug searches with strict ID lookups, and prune imports.
 * - MOTIVO: Adherence to Nam P. Suh's Independence Axiom, removing dynamic compiler couplings.
 * - IMPACTO: 20+ lines of codebase pruned, compile-safe, and robust routing resolution.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [route.ts, vault.ts]
 * - DOWNSTREAM: [[...slug]/page.tsx]
 */

import { DataItem } from '@agnostic/core';
import { SYSTEM_NS } from './constants';

export interface RouteResolution {
  route: DataItem | null;
  blocks: any[];
  activeRecord: DataItem | null;
  path: string;
  context: string;
  intent: 'create' | 'edit' | 'list' | 'view';
  allContexts: string[];
}

/**
 * Maps raw page blocks to standardized block projection objects.
 * Decoupled from dynamic compilers and structural verification middlewares.
 */
function normalizeBlocks(rawBlocks: any[], schemas: any[]): any[] {
  return (rawBlocks || []).map(block => {
    // 1. Resolve raw properties from dynamic JSON variations
    const blockData = block.data || block;
    const type = block.type || blockData.type || 'form';
    const schemaId = block.schema_id || blockData.schema_id;
    const context = block.context || blockData.context;

    // 2. Resolve matching Schema ID from current definitions catalog (ID, Name, or Slug)
    const resolvedSchemaId = schemaId
      ? (schemas.find((s: any) => s.id === schemaId || s.data?.name === schemaId || s.data?.slug === schemaId)?.id ?? schemaId)
      : undefined;

    // 3. Pre-resolve the full schema payload from the database definitions
    const schema = resolvedSchemaId
      ? (schemas.find((s: any) => s.id === resolvedSchemaId || s.data?.name === resolvedSchemaId || s.data?.slug === resolvedSchemaId)?.data ?? null)
      : null;

    return { 
      id: block.id || `block_${Date.now()}`,
      type, 
      schema_id: resolvedSchemaId,
      schema,
      context,
      sizing: blockData.sizing,
      direction: blockData.direction,
      gap: blockData.gap,
      padding: blockData.padding,
      blocks: blockData.blocks,
      config: blockData.config,
      data: blockData
    };
  }).filter(b => b.type);
}

/**
 * Recursively extracts all unique contexts defined in a layout block tree.
 * Fully decoupled and aligned with Suh's Axiom of Independence.
 */
function extractAllContexts(blocks: any[]): string[] {
  const contexts = new Set<string>();
  for (const b of blocks) {
    const ctx = b.context || b.data?.context;
    if (ctx && ctx !== 'system') contexts.add(ctx);
    const children = b.blocks || b.data?.blocks;
    if (Array.isArray(children)) {
      for (const childCtx of extractAllContexts(children)) {
        contexts.add(childCtx);
      }
    }
  }
  return Array.from(contexts);
}


/**
 * Resolves the route, page blocks, active record and CRUD intent isomorphicly.
 */
export async function resolveAgnosticRoute(
  slug: string | string[], 
  vaultData: Record<string, any>
): Promise<RouteResolution> {
  const path = Array.isArray(slug) ? `/${slug.join('/')}` : `/${slug}`;
  const routes = (vaultData[SYSTEM_NS.ROUTES] || []) as DataItem[];
  const schemas = (vaultData[SYSTEM_NS.SCHEMAS] || []) as DataItem[];

  // 1. Find the active route by comparing URI segments
  const activeRoute = routes.find((r: any) => {
    const rawPath = r?.data?.path;
    if (typeof rawPath !== 'string') return false;
    
    const routePath = rawPath.split('/').filter(Boolean);
    const urlPath = path.split('/').filter(Boolean);
    
    if (routePath.length !== urlPath.length) return false;
    
    return routePath.every((segment: string, i: number) => {
      return segment.startsWith(':') || segment === urlPath[i];
    });
  });

  if (!activeRoute) {
    return { 
      route: null, 
      blocks: [], 
      activeRecord: null, 
      path, 
      context: 'system', 
      intent: 'list',
      allContexts: []
    };
  }

  // 2. Normalize blocks first — needed to infer entity context
  const routeData = activeRoute.data || {};
  const rawBlocks = (routeData.blocks as any[]) || (activeRoute.type ? [activeRoute] : []);
  const blocks = normalizeBlocks(rawBlocks, schemas);

  // 3. Resolve entity context from blocks (NOT from activeRoute.context which is the storage namespace)
  const contextFromBlocks = blocks.find(b => b.context || b.data?.context)?.context || 
                            blocks.find(b => b.context || b.data?.context)?.data?.context;
  const context = (routeData.context || contextFromBlocks || 'system') as string;
  const activeSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  const records = (vaultData[context] || []) as any[];
  const activeRecord = records.find((r: any) => r?.id === activeSlug) || null;

  // 4. Determine CRUD operational intent dynamically based on layout blocks
  let intent: 'create' | 'edit' | 'list' | 'view' = 'list';
  const hasCollectionOrTable = blocks.some(b => b.type === 'collection' || b.type === 'table');
  const hasForm = blocks.some(b => b.type === 'form');

  if (hasCollectionOrTable && !hasForm) {
    intent = 'list';
  } else if (activeRecord) {
    intent = 'edit';
  } else if (hasForm) {
    intent = 'create';
  } else {
    intent = activeRecord ? 'view' : 'list';
  }

  // 🏛️ RECURSIVE CONTEXT EXTRACTION: Compile all contexts required by the route.
  const allContexts = [
    ...(context && context !== 'system' ? [context] : []),
    ...extractAllContexts(rawBlocks)
  ];

  return {
    route: activeRoute,
    blocks,
    activeRecord,
    path,
    context,
    intent,
    allContexts: [...new Set(allContexts)]
  };
}
