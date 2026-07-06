import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MetaAdapter, MetaConfigurationError, MetaServiceWindowError, MetaUnsupportedPayloadError } from './adapter';

const credentials = {
  META_PAGE_ACCESS_TOKEN: 'page-token',
  META_IG_USER_ID: 'ig-user-123',
  META_WEBHOOK_VERIFY_TOKEN: 'verify-token',
  META_APP_SECRET: 'app-secret',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('meta adapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fails fast when configuration is incomplete', () => {
    expect(() => new MetaAdapter({
      META_PAGE_ACCESS_TOKEN: '',
      META_IG_USER_ID: 'ig-user-123',
      META_WEBHOOK_VERIFY_TOKEN: 'verify-token',
      META_APP_SECRET: 'app-secret',
    })).toThrow(MetaConfigurationError);
  });

  it('resolves the webhook challenge and verifies signatures', () => {
    const adapter = new MetaAdapter(credentials);
    const rawBody = '{"entry":[]}';
    const signature = crypto
      .createHmac('sha256', credentials.META_APP_SECRET)
      .update(rawBody, 'utf8')
      .digest('hex');

    expect(adapter.resolveWebhookChallenge({
      'hub.mode': 'subscribe',
      'hub.challenge': '12345',
      'hub.verify_token': 'verify-token',
    })).toBe('12345');

    expect(adapter.verifyWebhook(rawBody, {
      'X-Hub-Signature-256': `sha256=${signature}`,
    })).toBe(true);

    expect(adapter.verifyWebhook(rawBody, {
      'X-Hub-Signature-256': 'sha256=deadbeef',
    })).toBe(false);
  });

  it('normalizes multiple webhook messages and eagerly resolves attachments', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/asset_1?')) {
        return jsonResponse({ media_url: 'https://temporary.meta/media_1', mime_type: 'image/jpeg', filename: 'story.jpg' });
      }

      if (url === 'https://temporary.meta/media_1') {
        return new Response(Uint8Array.from([1, 2, 3, 4]), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        });
      }

      return jsonResponse({});
    });

    const adapter = new MetaAdapter(credentials);
    const messages = await adapter.handleWebhook(JSON.stringify({
      entry: [{
        changes: [{
          value: {
            platform: 'instagram',
            conversation: { id: 'conversation-1' },
            messages: [
              { id: 'msg-1', from: { id: 'user-1' }, created_time: '2026-07-03T10:00:00.000Z', text: { body: 'hola' } },
              {
                id: 'msg-2',
                from: { id: 'user-1' },
                created_time: '2026-07-03T10:01:00.000Z',
                attachments: [{
                  type: 'image',
                  payload: { asset_id: 'asset_1' },
                }],
              },
            ],
          },
        }],
      }],
    }), {});

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      id: 'msg-1',
      threadId: 'conversation-1',
      channel: 'instagram',
      direction: 'inbound',
      type: 'text',
      body: 'hola',
    });
    expect(messages[1]).toMatchObject({
      id: 'msg-2',
      threadId: 'conversation-1',
      channel: 'instagram',
      type: 'image',
      attachments: [{
        externalId: 'asset_1',
        url: 'https://temporary.meta/media_1',
        mimeType: 'image/jpeg',
        filename: 'story.jpg',
      }],
    });
    expect((messages[1].raw as any).resolvedAttachments[0].bytesBase64).toBe('AQIDBA==');
  });

  it('lists threads directly from the provider and computes the service window', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/conversation-1/messages')) {
        return jsonResponse({
          data: [
            {
              id: 'msg-1',
              from: { id: 'user-1' },
              created_time: '2026-07-03T10:00:00.000Z',
              text: { body: 'hola' },
            },
            {
              id: 'msg-2',
              from: { id: 'page-1' },
              created_time: '2026-07-03T10:05:00.000Z',
              is_echo: true,
              text: { body: 'respuesta' },
            },
          ],
        });
      }

      if (url.includes('/conversation-1')) {
        return jsonResponse({
          id: 'conversation-1',
          platform: 'instagram',
          unread_count: 2,
        });
      }

      if (url.includes('/me/conversations')) {
        return jsonResponse({
          data: [{
            id: 'conversation-1',
            platform: 'instagram',
            unread_count: 2,
          }],
          paging: { cursors: { after: 'cursor-2' } },
        });
      }

      return jsonResponse({});
    });

    const adapter = new MetaAdapter(credentials);
    const page = await adapter.listThreads();

    expect(page.nextCursor).toBe('cursor-2');
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: 'conversation-1',
      channel: 'instagram',
      contact: { channel: 'instagram', externalId: 'user-1' },
      unreadCount: 2,
      serviceWindowExpiresAt: '2026-07-04T10:00:00.000Z',
    });
  });

  it('lists messages directly from the provider and maps sender direction', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/conversation-1/messages')) {
        return jsonResponse({
          data: [
            {
              id: 'msg-1',
              from: { id: 'user-1' },
              created_time: '2026-07-03T10:00:00.000Z',
              text: { body: 'hola' },
            },
            {
              id: 'msg-2',
              from: { id: 'page-1' },
              created_time: '2026-07-03T10:05:00.000Z',
              is_echo: true,
              text: { body: 'respuesta' },
            },
          ],
        });
      }

      if (url.includes('/conversation-1')) {
        return jsonResponse({
          id: 'conversation-1',
          platform: 'instagram',
        });
      }

      return jsonResponse({});
    });

    const adapter = new MetaAdapter(credentials);
    const page = await adapter.listMessages('conversation-1');

    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toMatchObject({
      id: 'msg-1',
      threadId: 'conversation-1',
      direction: 'inbound',
      body: 'hola',
    });
    expect(page.items[1]).toMatchObject({
      id: 'msg-2',
      direction: 'outbound',
      body: 'respuesta',
    });
  });

  it('maps HUMAN_AGENT only when explicitly requested and blocks expired windows otherwise', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/conversation-expired/messages')) {
        return jsonResponse({
          data: [{
            id: 'msg-1',
            from: { id: 'user-1' },
            created_time: '2000-01-01T00:00:00.000Z',
            text: { body: 'hola' },
          }],
        });
      }

      if (url.includes('/conversation-allowed/messages')) {
        return jsonResponse({
          data: [{
            id: 'msg-2',
            from: { id: 'user-1' },
            created_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            text: { body: 'hola' },
          }],
        });
      }

      if (url.includes('/conversation-expired')) {
        return jsonResponse({
          id: 'conversation-expired',
          platform: 'messenger',
          participants: { data: [{ id: 'user-1' }] },
        });
      }

      if (url.includes('/conversation-allowed')) {
        return jsonResponse({
          id: 'conversation-allowed',
          platform: 'messenger',
          participants: { data: [{ id: 'user-1' }] },
        });
      }

      if (url.includes('/me/conversations')) {
        return jsonResponse({
          data: [
            { id: 'conversation-expired', platform: 'messenger' },
            { id: 'conversation-allowed', platform: 'messenger' },
          ],
        });
      }

      if (url.endsWith('/me/messages')) {
        return jsonResponse({ message_id: 'sent-1' });
      }

      return jsonResponse({});
    });

    const adapter = new MetaAdapter(credentials);
    await expect(adapter.sendMessage('conversation-expired', { type: 'text', body: 'ping' }))
      .rejects.toBeInstanceOf(MetaServiceWindowError);

    const sent = await adapter.sendMessage('conversation-allowed', { type: 'text', body: 'ping', messageTag: 'human_agent' });
    expect(sent.externalId).toBe('sent-1');
    expect(sent.raw).toMatchObject({ message_id: 'sent-1' });

    const request = fetchMock.mock.calls.at(-1);
    expect(request?.[0]).toContain('/me/messages');
    expect(JSON.parse(request?.[1]?.body as string)).toMatchObject({
      message_tag: 'HUMAN_AGENT',
      message: { text: 'ping' },
    });
  });

  it('rejects unsupported templateRef payloads', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/conversation-1/messages')) {
        return jsonResponse({
          data: [{
            id: 'msg-1',
            from: { id: 'user-1' },
            created_time: '2026-07-03T10:00:00.000Z',
          }],
        });
      }

      if (url.includes('/conversation-1')) {
        return jsonResponse({
          id: 'conversation-1',
          platform: 'messenger',
          participants: { data: [{ id: 'user-1' }] },
        });
      }

      return jsonResponse({});
    });

    const adapter = new MetaAdapter(credentials);
    await expect(adapter.sendMessage('conversation-1', { type: 'template', templateRef: 'welcome' }))
      .rejects.toBeInstanceOf(MetaUnsupportedPayloadError);
  });
});
