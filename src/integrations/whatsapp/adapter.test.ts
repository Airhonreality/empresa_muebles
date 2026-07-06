import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  WhatsappAdapter,
  WhatsappConfigurationError,
  WhatsappMessageStoreRequiredError,
  WhatsappServiceWindowError,
  buildWhatsappSendRequest,
  normalizeWhatsAppRecipient,
  previewWhatsappSendMessage,
} from './adapter';
import type { MessageStore } from '@/adapters/_contracts/messaging-adapter';
import crypto from 'crypto';

const credentials = {
  WHATSAPP_ACCESS_TOKEN: 'test-token',
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
  WHATSAPP_WABA_ID: '0987654321',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
  WHATSAPP_APP_SECRET: 'app-secret',
};

describe('whatsapp adapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('normalizes Colombian recipients with and without the trunk 1', () => {
    expect(normalizeWhatsAppRecipient('+57 1 300 123 4567')).toBe('+573001234567');
    expect(normalizeWhatsAppRecipient('3001234567')).toBe('+3001234567');
  });

  it('builds a text request for sendMessage', () => {
    const request = buildWhatsappSendRequest(credentials, '5713001234567', { type: 'text', body: 'ping' });

    expect(request.endpoint).toBe('https://graph.facebook.com/v22.0/1234567890/messages');
    expect(request.body).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+573001234567',
      type: 'text',
      text: {
        preview_url: false,
        body: 'ping',
      },
    });
  });

  it('builds a template request when templateRef is provided', () => {
    const request = buildWhatsappSendRequest(credentials, '573001234567', {
      type: 'template',
      templateRef: 'order_update',
      templateParams: { language: 'es_CO', customer_name: 'Ana', order_id: 'A-123' },
    });

    expect(request.body).toEqual({
      messaging_product: 'whatsapp',
      to: '+573001234567',
      type: 'template',
      template: {
        name: 'order_update',
        language: { code: 'es_CO' },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: 'Ana' },
            { type: 'text', text: 'A-123' },
          ],
        }],
      },
    });
  });

  it('resolves webhook challenge and verifies signatures', () => {
    const adapter = new WhatsappAdapter(credentials);
    const rawBody = '{"entry":[]}';
    const validSignature = crypto
      .createHmac('sha256', credentials.WHATSAPP_APP_SECRET)
      .update(rawBody, 'utf8')
      .digest('hex');

    expect(adapter.resolveWebhookChallenge({
      'hub.mode': 'subscribe',
      'hub.challenge': '12345',
      'hub.verify_token': 'verify-token',
    })).toBe('12345');

    expect(adapter.verifyWebhook(rawBody, {
      'X-Hub-Signature-256': `sha256=${validSignature}`,
    })).toBe(true);

    expect(adapter.verifyWebhook(rawBody, {
      'X-Hub-Signature-256': 'sha256=deadbeef',
    })).toBe(false);
  });

  it('normalizes multiple webhook messages and resolves media urls', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/media_1')) {
        return new Response(JSON.stringify({ url: 'https://temporary.media/url', mime_type: 'image/jpeg', filename: 'photo.jpg' }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const adapter = new WhatsappAdapter(credentials);
    const messages = await adapter.handleWebhook(JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [
              { id: 'wamid.1', from: '573001234567', timestamp: '1710000000', text: { body: 'hola' } },
              { id: 'wamid.2', from: '573001234567', timestamp: '1710000001', image: { id: 'media_1', mime_type: 'image/jpeg' }, caption: 'foto' },
            ],
          },
        }],
      }],
    }), {});

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      externalId: 'wamid.1',
      threadId: '573001234567',
      channel: 'whatsapp',
      direction: 'inbound',
      type: 'text',
      body: 'hola',
    });
    expect(messages[1]).toMatchObject({
      externalId: 'wamid.2',
      type: 'image',
      body: 'foto',
      attachments: [{
        externalId: 'media_1',
        url: 'https://temporary.media/url',
        mimeType: 'image/jpeg',
        filename: 'photo.jpg',
      }],
    });
  });

  it('delegates list methods to the injected MessageStore', async () => {
    const store: MessageStore = {
      upsertThread: vi.fn(),
      upsertMessage: vi.fn(),
      listThreads: vi.fn(async () => ({ items: [{ id: 'thread-1', channel: 'whatsapp', contact: { channel: 'whatsapp', externalId: '573001234567' } }], nextCursor: undefined })),
      listMessages: vi.fn(async () => ({ items: [], nextCursor: undefined })),
    };

    const adapter = new WhatsappAdapter(credentials, { messageStore: store });
    await expect(adapter.listThreads()).resolves.toEqual({ items: [{ id: 'thread-1', channel: 'whatsapp', contact: { channel: 'whatsapp', externalId: '573001234567' } }], nextCursor: undefined });
    await expect(adapter.listMessages('thread-1')).resolves.toEqual({ items: [], nextCursor: undefined });
  });

  it('throws a typed error when the service window expired', async () => {
    const store: MessageStore = {
      upsertThread: vi.fn(),
      upsertMessage: vi.fn(),
      listThreads: vi.fn(async () => ({
        items: [{
          id: 'thread-1',
          channel: 'whatsapp',
          contact: { channel: 'whatsapp', externalId: '573001234567' },
          serviceWindowExpiresAt: '2000-01-01T00:00:00.000Z',
        }],
        nextCursor: undefined,
      })),
      listMessages: vi.fn(async () => ({ items: [], nextCursor: undefined })),
    };

    const adapter = new WhatsappAdapter(credentials, { messageStore: store });
    await expect(adapter.sendMessage('thread-1', { type: 'text', body: 'ping' })).rejects.toBeInstanceOf(WhatsappServiceWindowError);
  });

  it('throws when list methods have no message store', async () => {
    const adapter = new WhatsappAdapter(credentials);
    await expect(adapter.listThreads()).rejects.toBeInstanceOf(WhatsappMessageStoreRequiredError);
  });

  it('fails fast when configuration is incomplete', () => {
    expect(() => new WhatsappAdapter({
      WHATSAPP_ACCESS_TOKEN: '',
      WHATSAPP_PHONE_NUMBER_ID: '123',
      WHATSAPP_WABA_ID: '456',
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify',
      WHATSAPP_APP_SECRET: 'secret',
    })).toThrow(WhatsappConfigurationError);
  });

  it('creates a preview request without network access', () => {
    const request = previewWhatsappSendMessage(credentials, '573001234567', { type: 'text', body: 'ping' });
    expect(request.method).toBe('POST');
    expect(request.recipient).toBe('+573001234567');
  });
});
