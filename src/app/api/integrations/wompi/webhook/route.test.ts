import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { WompiAdapter } from '@/integrations/wompi/adapter';

const env = {
  WOMPI_PUBLIC_KEY: 'pub_test_123',
  WOMPI_PRIVATE_KEY: 'prv_test_123',
  WOMPI_EVENTS_SECRET: 'events-secret',
  WOMPI_ENV: 'sandbox',
};

function makeRequest(rawBody: string, checksum: string): NextRequest {
  return new NextRequest('https://example.com/api/integrations/wompi/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Event-Checksum': checksum,
    },
    body: rawBody,
  });
}

describe('wompi webhook route', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, ...env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('accepts a valid webhook and calls the adapter', async () => {
    const rawBody = JSON.stringify({
      event: 'transaction.updated',
      timestamp: '2026-07-03T10:00:00.000Z',
      signature: {
        properties: ['data.id', 'data.status'],
        timestamp: '2026-07-03T10:00:00.000Z',
      },
      data: {
        id: 'tx-1',
        status: 'APPROVED',
        amount_in_cents: 1250000,
        currency: 'COP',
        payment_method: { type: 'CARD' },
      },
    });
    const checksumPayload = `tx-1APPROVED2026-07-03T10:00:00.000Z${env.WOMPI_EVENTS_SECRET}`;
    const checksum = crypto.createHmac('sha256', env.WOMPI_EVENTS_SECRET).update(checksumPayload, 'utf8').digest('hex');

    const verify = vi.spyOn(WompiAdapter.prototype, 'verifyWebhook');
    const handle = vi.spyOn(WompiAdapter.prototype, 'handleWebhook');
    const request = makeRequest(rawBody, checksum);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, processed: 1 });
    expect(verify).toHaveBeenCalledWith(rawBody, expect.objectContaining({ 'x-event-checksum': checksum }));
    expect(handle).toHaveBeenCalledWith(rawBody, expect.any(Object));
  });

  it('rejects an invalid signature without calling handleWebhook', async () => {
    const rawBody = JSON.stringify({ event: 'transaction.updated', signature: { properties: [], timestamp: '2026-07-03T10:00:00.000Z' } });
    const request = makeRequest(rawBody, 'deadbeef');

    const handle = vi.spyOn(WompiAdapter.prototype, 'handleWebhook');
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      code: 'WOMPI_WEBHOOK_SIGNATURE_INVALID',
    });
    expect(handle).not.toHaveBeenCalled();
  });
});
