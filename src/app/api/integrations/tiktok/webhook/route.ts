import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';
import { TiktokAdapter, TiktokConfigurationError, TiktokWebhookError } from '@/integrations/tiktok/adapter';

export const runtime = 'nodejs';

function headersToRecord(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

function isTiktokWebhookError(error: unknown): error is TiktokWebhookError {
  return error instanceof TiktokWebhookError;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = headersToRecord(request.headers);

  let adapter;
  try {
    adapter = getAdapter('tiktok');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TikTok adapter unavailable';
    const code = error instanceof TiktokConfigurationError ? error.code : 'TIKTOK_ADAPTER_UNAVAILABLE';
    return NextResponse.json({ ok: false, error: message, code }, { status: 500 });
  }

  if (!adapter) {
    return NextResponse.json({ ok: false, error: 'TikTok adapter is not installed', code: 'TIKTOK_ADAPTER_NOT_INSTALLED' }, { status: 500 });
  }

  const tiktokAdapter = adapter as TiktokAdapter;

  if (!tiktokAdapter.verifyWebhook(rawBody, headers)) {
    return NextResponse.json({ ok: false, error: 'Invalid TikTok webhook signature', code: 'TIKTOK_WEBHOOK_SIGNATURE_INVALID' }, { status: 401 });
  }

  try {
    const messages = await tiktokAdapter.handleWebhook(rawBody, headers);
    return NextResponse.json({
      ok: true,
      processed: messages?.length ?? 0,
    });
  } catch (error) {
    if (isTiktokWebhookError(error)) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'TikTok webhook failed';
    return NextResponse.json({ ok: false, error: message, code: 'TIKTOK_WEBHOOK_FAILED' }, { status: 500 });
  }
}
