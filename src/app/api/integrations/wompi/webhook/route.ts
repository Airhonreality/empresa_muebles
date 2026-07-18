import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';
import { WompiAdapter, WompiConfigurationError, WompiWebhookError } from '@/integrations/wompi/adapter';

export const runtime = 'nodejs';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'db');

function readJsonFile<T>(filename: string): T[] {
  const filePath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T[];
}

function writeJsonFile<T>(filename: string, data: T[]): void {
  const filePath = path.join(STORAGE_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function headersToRecord(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

function isWompiWebhookError(error: unknown): error is WompiWebhookError {
  return error instanceof WompiWebhookError;
}

function actualizarPedidoDesdeWebhook(rawBody: string): void {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return;
  }

  const data = parsed.data as Record<string, unknown> | undefined;
  if (!data) return;

  const transaction = data.transaction as Record<string, unknown> | undefined;
  if (!transaction) return;

  const reference = String(transaction.reference ?? '');
  const transactionId = String(transaction.id ?? '');
  const status = String(transaction.status ?? '').toUpperCase();
  const paymentMethod = transaction.payment_method as Record<string, unknown> | undefined;
  const metodoPago = String(paymentMethod?.type ?? '');

  if (!reference) return;

  const pedidos = readJsonFile('pedidos_web.json') as Array<Record<string, unknown>>;
  const idx = pedidos.findIndex(p => {
    const d = (p as Record<string, unknown>).data as Record<string, unknown> | undefined;
    return d?.wompi_reference === reference;
  });
  if (idx === -1) return;

  const pedidoRecord = pedidos[idx] as Record<string, unknown>;
  const pedidoData = pedidoRecord.data as Record<string, unknown>;

  let nuevoEstado = String(pedidoData.estado ?? '');
  if (status === 'APPROVED') {
    nuevoEstado = 'pagado';
  } else if (status === 'DECLINED' || status === 'ERROR') {
    nuevoEstado = 'cancelado';
  }

  pedidoData.estado = nuevoEstado;
  pedidoData.wompi_transaction_id = transactionId || pedidoData.wompi_transaction_id || '';
  pedidoData.metodo_pago = metodoPago || pedidoData.metodo_pago || '';
  pedidoRecord.updated_at = new Date().toISOString();

  writeJsonFile('pedidos_web.json', pedidos);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = headersToRecord(request.headers);

  let adapter;
  try {
    adapter = getAdapter('wompi');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wompi adapter unavailable';
    const code = error instanceof WompiConfigurationError ? error.code : 'WOMPI_ADAPTER_UNAVAILABLE';
    return NextResponse.json({ ok: false, error: message, code }, { status: 500 });
  }

  if (!adapter) {
    return NextResponse.json({ ok: false, error: 'Wompi adapter is not installed', code: 'WOMPI_ADAPTER_NOT_INSTALLED' }, { status: 500 });
  }

  const wompiAdapter = adapter as unknown as WompiAdapter;

  if (!wompiAdapter.verifyWebhook(rawBody, headers)) {
    return NextResponse.json({ ok: false, error: 'Invalid Wompi webhook signature', code: 'WOMPI_WEBHOOK_SIGNATURE_INVALID' }, { status: 401 });
  }

  try {
    const results = await wompiAdapter.handleWebhook(rawBody, headers);

    try {
      actualizarPedidoDesdeWebhook(rawBody);
    } catch (e) {
      console.error('[wompi webhook] Error actualizando pedido:', e);
    }

    return NextResponse.json({
      ok: true,
      processed: results?.length ?? 0,
    });
  } catch (error) {
    if (isWompiWebhookError(error)) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Wompi webhook failed';
    return NextResponse.json({ ok: false, error: message, code: 'WOMPI_WEBHOOK_FAILED' }, { status: 500 });
  }
}
