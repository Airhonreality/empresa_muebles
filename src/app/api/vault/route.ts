/**
 * 🏛️ ARTEFACTO: route.ts (Vault API)
 * ────────────
 * CAPA: Server (Persistence Interface / The Sentinel)
 * VERSIÓN: 8.5
 * COMMIT: P3-M8.1-SENTINEL-INTEGRITY
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Interfaz de persistencia universal para el Átomo Agnóstico.
 * - Orquestador de mutaciones deterministas (WRITE, DELETE, SYNC, INTROSPECT).
 * - Puerta de enlace entre el Motor (Kernel) y los Puentes de Datos (Strategies).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Actuar como "El Centinela". Purificar TODO payload de entrada vía AgnosticDNACompiler antes de tocar el disco.
 * - MUST: Garantizar que cada registro cristalizado siga la ley de DataItem { id, context, data }.
 * - NEVER: Escribir objetos desnudos (Naked Objects) en el DNA.
 * - NEVER: Almacenar lógica de negocio; delegar a la capa de Estrategia.
 * 
 * 📜 ADR [2026-05-12]: SYMMETRIC-PURIFICATION-PROTOCOL
 * - CONTEXTO: Descubrimiento de DNA corrupto (objetos desnudos) inyectado desde el Manager.
 * - DECISIÓN: Implementar purificación obligatoria en el servidor. El Vault deja de ser un buzón pasivo y se convierte en un validador de integridad.
 * - IMPACTO: Eliminación total de TypeErrors por desestructuración de undefined en el Kernel.
 * 
 * 🔑 KEYWORDS: #VaultAPI #TheSentinel #DataIntegrity #SymmetricPurification #DataItemLaw
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStrategy } from '@/server/getStrategy';
import { DataItem } from '@agnostic/core';
import { AgnosticDNACompiler } from '@/lib/agnostic/Middleware';
import { registry } from '@/lib/agnostic/Registry';
import { initializeRegistry } from '@/lib/agnostic/init';
import crypto from 'crypto';

// ⚓ SERVER-SIDE HYDRATION: Garantizar que el Registry tenga materia en el contexto del API
initializeRegistry();

// ─── DNA SCHEMAS ─────────────────────────────────────────────────────────────

const writeQuerySchema = z.object({
  action: z.literal('WRITE'),
  context: z.string().min(1, 'context is required'),
  payload: z.object({
    id: z.string().optional(),
    data: z.record(z.string(), z.any()),
  }),
});

const deleteQuerySchema = z.object({
  action: z.literal('DELETE'),
  context: z.string().min(1, 'context is required'),
  payload: z.object({ id: z.string().min(1, 'id is required') }),
});

const restoreQuerySchema = z.object({
  action: z.literal('RESTORE'),
  context: z.string().min(1, 'context is required'),
  payload: z.array(z.any()),
});

const discoverQuerySchema = z.object({
  action: z.literal('DISCOVER'),
});

const listQuerySchema = z.object({
  action: z.literal('LIST'),
});

const updateQuerySchema = z.object({
  action: z.literal('UPDATE'),
  context: z.string().min(1),
  patch: z.record(z.string(), z.any()),
  filter: z.record(z.string(), z.any()),
});

const vaultMutationSchema = z.discriminatedUnion('action', [
  writeQuerySchema,
  deleteQuerySchema,
  restoreQuerySchema,
  discoverQuerySchema,
  listQuerySchema,
  updateQuerySchema
]);

// ─── HANDLERS ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const host    = req.headers.get('host') ?? undefined;
    const context = new URL(req.url).searchParams.get('context') ?? undefined;
    
    // 🏺 VIRTUAL CONTEXT: Autoconsciencia de capacidades (Fase 10)
    if (context === 'system_capabilities') {
      await getStrategy(host); // 🛡️ Force strategy discovery and registration
      const manifest = registry.getManifest();
      return NextResponse.json({ [context]: manifest });
    }

    const strategy = await getStrategy(host);
    const data = await strategy.read(context);
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Read failed' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = vaultMutationSchema.parse(body);
    const host = req.headers.get('host') ?? undefined;
    const strategy = await getStrategy(host);

    // 📥 LIST: Lectura atómica de toda la materia
    if (query.action === 'LIST') {
      const data = await strategy.read();
      
      // 🧬 VIRTUAL INJECTION: Unimos la realidad física con la autoconsciencia del núcleo
      const manifest = registry.getManifest();
      manifest.forEach(item => {
        if (!data[item.context]) data[item.context] = [];
        data[item.context].push(item);
      });

      return NextResponse.json({ success: true, data });
    }

    // 🔍 DISCOVER: Auto-descubrimiento de DNA desde el Bridge
    if (query.action === 'DISCOVER') {
      if (!strategy.introspect) {
        return NextResponse.json({ success: false, error: 'Introspection not supported by strategy' }, { status: 405 });
      }

      const newSchemas = await strategy.introspect();
      
      return NextResponse.json({ success: true, schemas: newSchemas });
    }

    // 🔄 RESTORE: Cristalización total de un contexto
    if (query.action === 'RESTORE') {
      const { context, payload } = query;
      
      // 🛡️ INTEGITY GUARD: Purificar e Inyectar en forma canónica antes de cristalizar en disco
      const schemas = (await strategy.read('schema_definitions'))['schema_definitions'] || [];
      const purifiedPayload = (payload as any[]).map(item => {
        return AgnosticDNACompiler.canonicalize({ ...item, context }, schemas);
      }).filter(Boolean);

      if ((strategy as any).overwriteContext) {
        await (strategy as any).overwriteContext(context, purifiedPayload);
      } else {
        await strategy.write({ [context]: purifiedPayload as DataItem[] });
      }
      
      return NextResponse.json({ success: true, count: purifiedPayload.length });
    }

    // 🗑️ DELETE: Eliminación quirúrgica
    if (query.action === 'DELETE') {
      const { context, payload } = query;
      if (strategy.delete) {
        await strategy.delete(context, payload.id);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, error: 'Delete not supported' }, { status: 405 });
    }

    // 📝 WRITE: Escritura individual (Update or Insert)
    if (query.action === 'WRITE') {
      const { context, payload } = query;
      
      // 🛡️ INTEGRITY GUARD: Purificar y transformar en DataItem canónico
      const schemas = (await strategy.read('schema_definitions'))['schema_definitions'] || [];
      const item = AgnosticDNACompiler.canonicalize({
        id: payload.id,
        context: context,
        data: payload.data
      }, schemas);

      if (!item) throw new Error('Purification failed for item');

      if (strategy.writeContext) {
        await strategy.writeContext(context, [item]);
      } else {
        await strategy.write({ [context]: [item] });
      }

      return NextResponse.json({ success: true, record: item });
    }

    // 🏗️ UPDATE: Standard Bulk Patch
    if (query.action === 'UPDATE') {
      const { context, patch, filter } = query;
      await strategy.update(context, patch, filter);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.error('[VaultAPI] Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof z.ZodError ? 'Invalid payload' : err.message 
    }, { status: 500 });
  }
}
