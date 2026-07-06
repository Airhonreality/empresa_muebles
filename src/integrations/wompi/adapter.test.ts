import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WompiAdapter,
  WompiConfigurationError,
  WompiRefundNotSupportedError,
  WompiValidationError,
  WompiWebhookError,
  previewWompiChargeRequest,
} from './adapter';

const credentials = {
  WOMPI_PUBLIC_KEY: 'pub_test_123',
  WOMPI_PRIVATE_KEY: 'prv_test_123',
  WOMPI_EVENTS_SECRET: 'events-secret',
  WOMPI_ENV: 'sandbox',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('wompi adapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fails fast when configuration is incomplete', () => {
    expect(() => new WompiAdapter({
      WOMPI_PUBLIC_KEY: '',
      WOMPI_PRIVATE_KEY: 'prv_test_123',
      WOMPI_EVENTS_SECRET: 'events-secret',
    })).toThrow(WompiConfigurationError);
  });

  it('builds a card charge payload with legal and antifraud tokens', () => {
    const payload = previewWompiChargeRequest(credentials, {
      amountInCents: 1250000,
      currency: 'COP',
      reference: 'order-1001',
      customer: {
        name: 'Ana Perez',
        email: 'ana@example.com',
        documentType: 'cc',
        documentId: '10000001',
        phone: '+573001234567',
      },
      method: {
        type: 'card',
        token: 'tok_123',
        installments: 3,
      },
      legalTokens: {
        acceptanceToken: 'acc-1',
        acceptPersonalAuth: 'auth-1',
      },
      fraudSessionId: 'session-1',
    });

    expect(payload).toEqual({
      amount_in_cents: 1250000,
      currency: 'COP',
      reference: 'order-1001',
      customer_data: {
        full_name: 'Ana Perez',
        email: 'ana@example.com',
        document_type: 'cc',
        document_number: '10000001',
        phone_number: '+573001234567',
      },
      legal_tokens: {
        acceptance_token: 'acc-1',
        accept_personal_auth: 'auth-1',
      },
      fraud_session_id: 'session-1',
      redirect_url: undefined,
      metadata: undefined,
      payment_method: {
        type: 'CARD',
        token: 'tok_123',
        installments: 3,
      },
    });
  });

  it('builds PSE and Nequi payloads and validates required fields', () => {
    const psePayload = previewWompiChargeRequest(credentials, {
      amountInCents: 2350000,
      currency: 'COP',
      reference: 'order-pse',
      customer: {
        name: 'Ana Perez',
        email: 'ana@example.com',
        documentType: 'cc',
        documentId: '10000001',
      },
      method: {
        type: 'pse',
        bankCode: '1023',
        userType: 'legal',
      },
      legalTokens: {
        acceptanceToken: 'acc-1',
        acceptPersonalAuth: 'auth-1',
      },
      fraudSessionId: 'session-1',
      redirectUrl: 'https://example.com/return',
    });

    expect(psePayload.payment_method).toEqual({
      type: 'PSE',
      bank_code: '1023',
      user_type: 'legal',
    });

    const nequiPayload = previewWompiChargeRequest(credentials, {
      amountInCents: 99000,
      currency: 'COP',
      reference: 'order-nequi',
      customer: {
        name: 'Ana Perez',
        email: 'ana@example.com',
      },
      method: {
        type: 'nequi',
        phoneNumber: '3001234567',
      },
      legalTokens: {
        acceptanceToken: 'acc-1',
        acceptPersonalAuth: 'auth-1',
      },
      fraudSessionId: 'session-1',
    });

    expect(nequiPayload.payment_method).toEqual({
      type: 'NEQUI',
      phone_number: '3001234567',
    });

    expect(() => previewWompiChargeRequest(credentials, {
      amountInCents: 99000,
      currency: 'COP',
      reference: 'order-nequi',
      customer: {
        name: 'Ana Perez',
        email: 'ana@example.com',
      },
      method: {
        type: 'nequi',
        phoneNumber: '',
      },
      legalTokens: {
        acceptanceToken: 'acc-1',
        acceptPersonalAuth: 'auth-1',
      },
      fraudSessionId: 'session-1',
    })).toThrow(WompiValidationError);
  });

  it('charges transactions and maps pending nextAction states', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({
      data: {
        id: 'tx-1',
        status: 'PENDING',
        amount_in_cents: 2350000,
        currency: 'COP',
        payment_method: { type: 'PSE' },
        redirect_url: 'https://sandbox.wompi.co/checkout',
      },
    }));

    const adapter = new WompiAdapter(credentials);
    const result = await adapter.charge({
      amountInCents: 2350000,
      currency: 'COP',
      reference: 'order-pse',
      customer: {
        name: 'Ana Perez',
        email: 'ana@example.com',
        documentType: 'cc',
        documentId: '10000001',
      },
      method: {
        type: 'pse',
        bankCode: '1023',
        userType: 'legal',
      },
      legalTokens: {
        acceptanceToken: 'acc-1',
        acceptPersonalAuth: 'auth-1',
      },
      fraudSessionId: 'session-1',
      redirectUrl: 'https://example.com/return',
    });

    expect(result).toMatchObject({
      externalId: 'tx-1',
      status: 'pending',
      amountInCents: 2350000,
      currency: 'COP',
      checkoutUrl: 'https://sandbox.wompi.co/checkout',
      nextAction: {
        type: 'redirect_to_bank',
      },
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      amount_in_cents: 2350000,
      payment_method: { type: 'PSE', bank_code: '1023', user_type: 'legal' },
    });
  });

  it('gets transaction results from the provider', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse({
      data: {
        id: 'tx-2',
        status: 'APPROVED',
        amount_in_cents: 99000,
        currency: 'COP',
      },
    }));

    const adapter = new WompiAdapter(credentials);
    await expect(adapter.getResult('tx-2')).resolves.toMatchObject({
      externalId: 'tx-2',
      status: 'approved',
      amountInCents: 99000,
      currency: 'COP',
    });
  });

  it('verifies webhook signatures from the raw body and deduplicates events', async () => {
    const adapter = new WompiAdapter(credentials);
    const rawBody = JSON.stringify({
      event: 'transaction.updated',
      timestamp: '2026-07-03T10:00:00.000Z',
      signature: {
        properties: ['data.id', 'data.status'],
        timestamp: '2026-07-03T10:00:00.000Z',
      },
      data: {
        id: 'tx-3',
        status: 'APPROVED',
        amount_in_cents: 1250000,
        currency: 'COP',
        payment_method: { type: 'CARD' },
      },
    });
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    const signaturePayload = `${['data.id', 'data.status'].map(prop => String((prop === 'data.id' ? (parsed as any).data.id : (parsed as any).data.status))).join('')}2026-07-03T10:00:00.000Z${credentials.WOMPI_EVENTS_SECRET}`;
    const checksum = crypto.createHmac('sha256', credentials.WOMPI_EVENTS_SECRET).update(signaturePayload, 'utf8').digest('hex');

    expect(adapter.verifyWebhook(rawBody, {
      'X-Event-Checksum': checksum,
    })).toBe(true);

    const first = await adapter.handleWebhook(rawBody, { 'X-Event-Checksum': checksum });
    const second = await adapter.handleWebhook(rawBody, { 'X-Event-Checksum': checksum });

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      externalId: 'tx-3',
      status: 'approved',
      amountInCents: 1250000,
      currency: 'COP',
    });
    expect(second).toEqual([]);
  });

  it('rejects unsupported refunds explicitly', async () => {
    const adapter = new WompiAdapter(credentials);
    await expect(adapter.refund({ chargeId: 'tx-1' })).rejects.toBeInstanceOf(WompiRefundNotSupportedError);
  });

  it('fails webhook verification on corrupt signatures or malformed bodies', () => {
    const adapter = new WompiAdapter(credentials);

    expect(adapter.verifyWebhook('not-json', { 'X-Event-Checksum': 'deadbeef' })).toBe(false);
    expect(adapter.verifyWebhook(JSON.stringify({ event: 'transaction.updated' }), { 'X-Event-Checksum': 'deadbeef' })).toBe(false);
  });

  it('throws a typed webhook error when the response body is invalid JSON', async () => {
    const adapter = new WompiAdapter(credentials);
    await expect(adapter.handleWebhook('not-json', {})).rejects.toBeInstanceOf(WompiWebhookError);
  });
});
