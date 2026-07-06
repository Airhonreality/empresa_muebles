import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TiktokAdapter,
  TiktokConfigurationError,
  TiktokMessageStoreRequiredError,
  TiktokQuotaExceededError,
  TiktokReauthRequiredError,
  TiktokServiceWindowError,
  TiktokUnsupportedPayloadError,
  previewTiktokSendMessage,
} from './adapter';
import type { MessageStore } from '@/adapters/_contracts/messaging-adapter';

const credentials = {
  TIKTOK_CLIENT_ID: 'client-id',
  TIKTOK_CLIENT_SECRET: 'client-secret',
  TIKTOK_ACCESS_TOKEN: 'access-token',
  TIKTOK_REFRESH_TOKEN: 'refresh-token',
  TIKTOK_REFRESH_TOKEN_EXPIRES_AT: '2099-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('tiktok adapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fails fast when configuration is incomplete', () => {
    expect(() => new TiktokAdapter({
      TIKTOK_CLIENT_ID: '',
      TIKTOK_CLIENT_SECRET: 'client-secret',
      TIKTOK_ACCESS_TOKEN: 'access-token',
      TIKTOK_REFRESH_TOKEN: 'refresh-token',
    })).toThrow(TiktokConfigurationError);
  });

  it('models requiere_reauth when the refresh token expires', async () => {
    const adapter = new TiktokAdapter({
      ...credentials,
      TIKTOK_REFRESH_TOKEN_EXPIRES_AT: '2000-01-01T00:00:00.000Z',
    });

    expect(adapter.getAuthState()).toEqual({
      status: 'requiere_reauth',
      reason: 'refresh_token_expired',
      expiredAt: '2000-01-01T00:00:00.000Z',
    });
    await expect(adapter.testConnection()).resolves.toEqual({ ok: false, message: 'requiere_reauth' });
  });

  it('verifies signatures over the raw body and rejects replayed payloads', () => {
    const adapter = new TiktokAdapter(credentials);
    const rawBody = '{"events":[]}';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', credentials.TIKTOK_CLIENT_SECRET)
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex');

    expect(adapter.verifyWebhook(rawBody, {
      'TikTok-Signature': `t=${timestamp},s=${signature}`,
    })).toBe(true);

    expect(adapter.verifyWebhook(rawBody, {
      'TikTok-Signature': `t=${timestamp - 10},s=${signature}`,
    })).toBe(false);

    expect(adapter.verifyWebhook(rawBody, {
      'TikTok-Signature': `t=${timestamp},s=deadbeef`,
    })).toBe(false);
  });

  it('normalizes webhook messages only after signature verification', async () => {
    const adapter = new TiktokAdapter(credentials);
    const rawBody = JSON.stringify({
      events: [{
        messages: [{
          message_id: 'msg-1',
          conversation_id: 'thread-1',
          sender_id: 'user-1',
          timestamp: '2026-07-03T10:00:00.000Z',
          text: 'hola',
          attachments: [{
            external_id: 'asset-1',
            url: 'https://cdn.tiktok.example/photo.jpg',
            mime_type: 'image/jpeg',
            filename: 'photo.jpg',
          }],
        }],
      }],
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHmac('sha256', credentials.TIKTOK_CLIENT_SECRET)
      .update(`${timestamp}.${rawBody}`, 'utf8')
      .digest('hex');

    const messages = await adapter.handleWebhook(rawBody, {
      'TikTok-Signature': `t=${timestamp};s=${signature}`,
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      externalId: 'msg-1',
      threadId: 'thread-1',
      channel: 'tiktok',
      direction: 'inbound',
      type: 'image',
      body: 'hola',
      attachments: [{
        externalId: 'asset-1',
        url: 'https://cdn.tiktok.example/photo.jpg',
        mimeType: 'image/jpeg',
        filename: 'photo.jpg',
      }],
    });
  });

  it('delegates list methods to the injected MessageStore', async () => {
    const store: MessageStore = {
      upsertThread: vi.fn(),
      upsertMessage: vi.fn(),
      listThreads: vi.fn(async () => ({
        items: [{
          id: 'thread-1',
          channel: 'tiktok',
          contact: { channel: 'tiktok', externalId: 'user-1' },
          serviceWindowExpiresAt: '2026-07-04T10:00:00.000Z',
          outboundQuotaRemaining: 7,
        }],
        nextCursor: undefined,
      })),
      listMessages: vi.fn(async () => ({ items: [], nextCursor: undefined })),
    };

    const adapter = new TiktokAdapter(credentials, { messageStore: store });
    await expect(adapter.listThreads()).resolves.toMatchObject({ items: [{ id: 'thread-1' }] });
    await expect(adapter.listMessages('thread-1')).resolves.toEqual({ items: [], nextCursor: undefined });
  });

  it('rejects sends outside the service window and when the quota is exhausted', async () => {
    const store: MessageStore = {
      upsertThread: vi.fn(),
      upsertMessage: vi.fn(),
      listThreads: vi.fn(async () => ({
        items: [{
          id: 'thread-expired',
          channel: 'tiktok',
          contact: { channel: 'tiktok', externalId: 'user-1' },
          serviceWindowExpiresAt: '2000-01-01T00:00:00.000Z',
          outboundQuotaRemaining: 1,
        }, {
          id: 'thread-quota',
          channel: 'tiktok',
          contact: { channel: 'tiktok', externalId: 'user-2' },
          serviceWindowExpiresAt: '2099-01-01T00:00:00.000Z',
          outboundQuotaRemaining: 0,
        }],
        nextCursor: undefined,
      })),
      listMessages: vi.fn(async () => ({ items: [], nextCursor: undefined })),
    };

    const adapter = new TiktokAdapter(credentials, { messageStore: store });
    await expect(adapter.sendMessage('thread-expired', { type: 'text', body: 'ping' }))
      .rejects.toBeInstanceOf(TiktokServiceWindowError);
    await expect(adapter.sendMessage('thread-quota', { type: 'text', body: 'ping' }))
      .rejects.toBeInstanceOf(TiktokQuotaExceededError);
  });

  it('rejects unsupported outbound payloads', () => {
    const request = previewTiktokSendMessage(credentials, 'thread-1', { type: 'text', body: 'ping' });
    expect(request.endpoint).toContain('/im/messages/send');
    expect(request.body).toMatchObject({
      client_id: 'client-id',
      conversation_id: 'thread-1',
      message_type: 'text',
      text: { body: 'ping' },
    });

    expect(() => previewTiktokSendMessage(credentials, 'thread-1', { type: 'template', templateRef: 'welcome' }))
      .toThrow(TiktokUnsupportedPayloadError);

    expect(() => previewTiktokSendMessage(credentials, 'thread-1', { type: 'video', body: 'nope' }))
      .toThrow(TiktokUnsupportedPayloadError);
  });

  it('throws when list methods have no message store', async () => {
    const adapter = new TiktokAdapter(credentials);
    await expect(adapter.listThreads()).rejects.toBeInstanceOf(TiktokMessageStoreRequiredError);
  });

  it('throws when the refresh token is expired at send time', async () => {
    const adapter = new TiktokAdapter({
      ...credentials,
      TIKTOK_REFRESH_TOKEN_EXPIRES_AT: '2000-01-01T00:00:00.000Z',
    });

    await expect(adapter.sendMessage('thread-1', { type: 'text', body: 'ping' }))
      .rejects.toBeInstanceOf(TiktokReauthRequiredError);
  });

  it('normalizes outbound attachment payloads with a single image', () => {
    const request = previewTiktokSendMessage(credentials, 'thread-1', {
      type: 'image',
      attachments: [{
        url: 'https://cdn.example/image.jpg',
        mimeType: 'image/jpeg',
        filename: 'image.jpg',
      }],
    });

    expect(request.body).toMatchObject({
      message_type: 'image',
      image: {
        url: 'https://cdn.example/image.jpg',
        filename: 'image.jpg',
      },
    });
  });
});
