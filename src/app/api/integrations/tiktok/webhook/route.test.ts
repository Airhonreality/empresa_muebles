import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { TiktokAdapter } from '@/integrations/tiktok/adapter';

const env = {
  TIKTOK_CLIENT_ID: 'client-id',
  TIKTOK_CLIENT_SECRET: 'client-secret',
  TIKTOK_ACCESS_TOKEN: 'access-token',
  TIKTOK_REFRESH_TOKEN: 'refresh-token',
  TIKTOK_REFRESH_TOKEN_EXPIRES_AT: '2099-01-01T00:00:00.000Z',
};

function makeRequest(rawBody: string, signature: string): NextRequest {
  return new NextRequest('https://example.com/api/integrations/tiktok/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TikTok-Signature': signature,
    },
    body: rawBody,
  });
}

describe('tiktok webhook route', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, ...env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('accepts a valid webhook and calls the adapter', async () => {
    const rawBody = JSON.stringify({ events: [{ messages: [{ message_id: 'msg-1', text: 'hola' }] }] });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', env.TIKTOK_CLIENT_SECRET)
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex');

    const verify = vi.spyOn(TiktokAdapter.prototype, 'verifyWebhook');
    const handle = vi.spyOn(TiktokAdapter.prototype, 'handleWebhook');
    const request = makeRequest(rawBody, `t=${timestamp},s=${signature}`);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, processed: 1 });
    expect(verify).toHaveBeenCalledWith(rawBody, expect.objectContaining({ 'tiktok-signature': `t=${timestamp},s=${signature}` }));
    expect(verify).toHaveBeenCalledTimes(1);
    expect(handle).toHaveBeenCalledWith(rawBody, expect.any(Object));
  });

  it('rejects an invalid signature without calling handleWebhook', async () => {
    const rawBody = JSON.stringify({ events: [] });
    const request = makeRequest(rawBody, 't=123,s=deadbeef');

    const handle = vi.spyOn(TiktokAdapter.prototype, 'handleWebhook');
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      code: 'TIKTOK_WEBHOOK_SIGNATURE_INVALID',
    });
    expect(handle).not.toHaveBeenCalled();
  });
});
