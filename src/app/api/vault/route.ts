/**
 * 🏛️ ARTEFACTO: route.ts (Vault API)
 * ────────────
 * CAPA: Server (Persistence Interface)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStrategy } from '@/server/getStrategy';
import { DataItem } from '@agnostic/core';
import crypto from 'crypto';

// ─── DNA SCHEMAS ─────────────────────────────────────────────────────────────

const writeQuerySchema = z.object({
  action: z.literal('WRITE'),
  context: z.string().min(1, 'context is required'),
  payload: z.object({
    id: z.string().optional(),
    data: z.record(z.any()),
  }),
});

const deleteQuerySchema = z.object({
  action: z.literal('DELETE'),
  context: z.string().min(1, 'context is required'),
  payload: z.object({ id: z.string().min(1, 'id is required') }),
});

const syncContextQuerySchema = z.object({
  action: z.literal('SYNC_CONTEXT'),
  context: z.string().min(1, 'context is required'),
  payload: z.array(z.any()),
});

const vaultMutationSchema = z.discriminatedUnion('action', [
  writeQuerySchema,
  deleteQuerySchema,
  syncContextQuerySchema,
]);

// ─── HANDLERS ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const host    = req.headers.get('host') ?? undefined;
    const context = new URL(req.url).searchParams.get('context') ?? undefined;
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

    // 🔄 SYNC CONTEXT: Cristalización total de un contexto
    if (query.action === 'SYNC_CONTEXT') {
      const { context, payload } = query;
      
      // Intentamos usar el método especializado de sobreescritura
      if ((strategy as any).overwriteContext) {
        await (strategy as any).overwriteContext(context, payload);
      } else {
        // Fallback universal: Escribir el contexto completo
        await strategy.write({ [context]: payload });
      }
      
      return NextResponse.json({ success: true, count: payload.length });
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

    // 📝 WRITE: Escritura individual (Upsert)
    if (query.action === 'WRITE') {
      const { context, payload } = query;
      const item: DataItem = {
        id: payload.id || crypto.randomUUID(),
        context: context,
        data: payload.data,
        updated_at: new Date().toISOString()
      };

      if (strategy.writeContext) {
        await strategy.writeContext(context, [item]);
      } else {
        await strategy.write({ [context]: [item] });
      }

      return NextResponse.json({ success: true, record: item });
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
