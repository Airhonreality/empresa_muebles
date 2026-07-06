import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GmailAdapter, GmailConfigurationError, GmailSendPayloadError, previewGmailSendMessage, renewGmailWatch } from './adapter';

const credentials = {
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_REFRESH_TOKEN: 'refresh-token',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(body: string, status = 200, contentType = 'text/plain'): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType },
  });
}

describe('gmail adapter', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fails fast when configuration is incomplete', () => {
    expect(() => new GmailAdapter({
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      GOOGLE_REFRESH_TOKEN: 'refresh-token',
    })).toThrow(GmailConfigurationError);
  });

  it('lists threads and messages from the Gmail API', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'access-token' });
      }

      if (String(url).includes('/users/me/profile')) {
        return jsonResponse({ emailAddress: 'me@example.com' });
      }

      if (String(url).includes('/users/me/threads?')) {
        return jsonResponse({
          threads: [{ id: 'thread-1' }],
          nextPageToken: 'next-token',
        });
      }

      if (String(url).includes('/users/me/threads/thread-1?')) {
        return jsonResponse({
          id: 'thread-1',
          messages: [
            {
              id: 'msg-1',
              threadId: 'thread-1',
              internalDate: '1710000000000',
              payload: {
                headers: [
                  { name: 'From', value: 'Cliente <cliente@example.com>' },
                  { name: 'To', value: 'me@example.com' },
                  { name: 'Subject', value: 'Hola' },
                ],
                mimeType: 'multipart/alternative',
                parts: [
                  {
                    mimeType: 'text/plain',
                    body: { data: Buffer.from('hola inbox').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') },
                  },
                ],
              },
            },
          ],
        });
      }

      return jsonResponse({});
    });

    const adapter = new GmailAdapter(credentials);
    const threads = await adapter.listThreads();
    const messages = await adapter.listMessages('thread-1');

    expect(threads.nextCursor).toBe('next-token');
    expect(threads.items[0]).toMatchObject({
      id: 'thread-1',
      channel: 'gmail',
      subject: 'Hola',
      contact: { channel: 'gmail', externalId: 'cliente@example.com' },
    });
    expect(messages.items[0]).toMatchObject({
      threadId: 'thread-1',
      channel: 'gmail',
      direction: 'inbound',
      body: 'hola inbox',
    });
  });

  it('builds a valid MIME payload for replies with headers and attachments', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'access-token' });
      }

      if (String(url).includes('/users/me/profile')) {
        return jsonResponse({ emailAddress: 'me@example.com' });
      }

      if (String(url).includes('/users/me/threads/thread-1?')) {
        return jsonResponse({
          id: 'thread-1',
          messages: [
            {
              id: 'msg-1',
              payload: {
                headers: [
                  { name: 'From', value: 'Cliente <cliente@example.com>' },
                  { name: 'To', value: 'me@example.com' },
                  { name: 'Subject', value: 'Hola' },
                  { name: 'Message-ID', value: '<msg-1@mail.example>' },
                ],
              },
            },
          ],
        });
      }

      if (String(url).startsWith('https://cdn.example.com/invoice.pdf')) {
        return new Response(Uint8Array.from([1, 2, 3, 4]), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      }

      return jsonResponse({});
    });

    const request = await previewGmailSendMessage(credentials, 'thread-1', {
      type: 'file',
      body: 'Adjunto la factura',
      headers: {
        subject: 'Re: Hola',
        cc: ['copia@example.com'],
        bcc: ['oculto@example.com'],
      },
      attachments: [{
        url: 'https://cdn.example.com/invoice.pdf',
        mimeType: 'application/pdf',
        filename: 'invoice.pdf',
      }],
    }, { fetch: globalThis.fetch });

    expect(request.endpoint).toContain('/users/me/messages/send');
    expect(request.body.threadId).toBe('thread-1');
    const mime = Buffer.from(request.body.raw, 'base64url').toString('utf8');
    expect(mime).toContain('Subject: Re: Hola');
    expect(mime).toContain('Cc: copia@example.com');
    expect(mime).toContain('Bcc: oculto@example.com');
    expect(mime).toContain('In-Reply-To: <msg-1@mail.example>');
    expect(mime).toContain('invoice.pdf');
  });

  it('rejects unsupported attachment-free payloads only when recipients cannot be derived', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'access-token' });
      }

      if (String(url).includes('/users/me/profile')) {
        return jsonResponse({ emailAddress: 'me@example.com' });
      }

      if (String(url).includes('/users/me/threads/thread-empty?')) {
        return jsonResponse({ id: 'thread-empty', messages: [] });
      }

      return jsonResponse({});
    });

    await expect(previewGmailSendMessage(credentials, 'thread-empty', {
      type: 'text',
      body: 'ping',
    }, { fetch: globalThis.fetch })).rejects.toBeInstanceOf(GmailSendPayloadError);
  });

  it('builds a Gmail watch renewal request', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'access-token' });
      }

      if (String(url).includes('/users/me/profile')) {
        return jsonResponse({ emailAddress: 'me@example.com' });
      }

      if (String(url).includes('/users/me/watch')) {
        return jsonResponse({
          historyId: '777',
          expiration: '1710003600000',
        });
      }

      return jsonResponse({});
    });

    const result = await renewGmailWatch({
      ...credentials,
      GMAIL_PUBSUB_TOPIC: 'projects/demo/topics/gmail',
    }, { fetch: globalThis.fetch });

    expect(result).toMatchObject({
      emailAddress: 'me@example.com',
      historyId: '777',
      expiration: '1710003600000',
      topicName: 'projects/demo/topics/gmail',
    });

    const watchCall = fetchMock.mock.calls.find(call => String(call[0]).includes('/users/me/watch'));
    expect(watchCall?.[1]).toMatchObject({
      method: 'POST',
    });
    expect(JSON.parse(String(watchCall?.[1]?.body))).toMatchObject({
      topicName: 'projects/demo/topics/gmail',
    });
  });
});
