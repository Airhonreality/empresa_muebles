/**
 * 🏛️ ARTEFACTO: resolver.ts
 * ────────────
 * CAPA: Lib (Server-Side Orchestration)
 * VERSIÓN: 1.0 (Senior Deterministic)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Resolución determinista de rutas y registros en el servidor.
 * - Eliminación de la entropía de hidratación en el cliente.
 */
import { DataItem } from '@agnostic/core';
import { AgnosticDNACompiler } from './Middleware';

export interface RouteResolution {
  route: DataItem | null;
  blocks: DataItem[];
  activeRecord: DataItem | null;
  path: string;
  context: string;
  intent: 'create' | 'edit' | 'list' | 'view';
}

export async function resolveAgnosticRoute(
  slug: string | string[], 
  vaultData: Record<string, any>
): Promise<RouteResolution> {
  const path = Array.isArray(slug) ? `/${slug.join('/')}` : `/${slug}`;
  const routes = (vaultData['page_routes'] || []) as DataItem[];
  const schemas = (vaultData['schema_definitions'] || []) as DataItem[];

  // 1. Find Route
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
    return { route: null, blocks: [], activeRecord: null, path, context: 'system', intent: 'list' };
  }

  // 2. Resolve Active Record (by Slug)
  const routeData = activeRoute.data || {};
  const context = (routeData.context || activeRoute.context || 'system') as string;
  const activeSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
  
  const records = (vaultData[context] || []) as any[];
  const activeRecord = records.find((r: any) => r?.data?._slug === activeSlug) || null;

  // 3. Compile Blocks
  const rawBlocks = (routeData.blocks as any[]) || (activeRoute.type ? [activeRoute] : []);
  const blocks = AgnosticDNACompiler.compilePage(rawBlocks, schemas);

  // 4. Determine Intent
  const intent = activeRecord ? 'edit' : 'create';

  return {
    route: activeRoute,
    blocks,
    activeRecord,
    path,
    context,
    intent
  };
}
