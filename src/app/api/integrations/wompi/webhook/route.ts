import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';
import { WompiAdapter, WompiConfigurationError, WompiWebhookError } from '@/integrations/wompi/adapter';

export const runtime = 'nodejs';

function headersToRecord(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

function isWompiWebhookError(error: unknown): error is WompiWebhookError {
  return error instanceof WompiWebhookError;
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
