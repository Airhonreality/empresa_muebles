import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('gmail pubsub route', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  const audience = 'https://example.com/api/integrations/gmail/pubsub';
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const certPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  function signOidcJwt(): string {
    const header = { alg: 'RS256', typ: 'JWT', kid: 'test-kid' };
    const payload = {
      iss: 'https://accounts.google.com',
      aud: audience,
      email: 'pubsub@example.iam.gserviceaccount.com',
      email_verified: true,
      sub: '1234567890',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const signingInput = `${encode(header)}.${encode(payload)}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(privateKey).toString('base64url');
    return `${signingInput}.${signature}`;
  }

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token';
    process.env.GMAIL_PUBSUB_TOPIC = 'projects/demo/topics/gmail';
    process.env.GMAIL_PUBSUB_VERIFICATION_AUDIENCE = audience;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('reconciles a pushed Gmail history notification', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('www.googleapis.com/oauth2/v1/certs')) {
        return jsonResponse({ 'test-kid': certPem });
      }

      if (String(url).includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'access-token' });
      }

      if (String(url).includes('/users/me/profile')) {
        return jsonResponse({ emailAddress: 'me@example.com' });
      }

      if (String(url).includes('/users/me/history?')) {
        return jsonResponse({
          historyId: '200',
          history: [{
            messagesAdded: [{ message: { id: 'msg-1' } }],
          }],
        });
      }

      if (String(url).includes('/users/me/messages/msg-1?')) {
        return jsonResponse({
          id: 'msg-1',
          threadId: 'thread-1',
          internalDate: '1710000000000',
          payload: {
            headers: [
              { name: 'From', value: 'cliente@example.com' },
              { name: 'To', value: 'me@example.com' },
              { name: 'Subject', value: 'Hola' },
            ],
            parts: [
              { mimeType: 'text/plain', body: { data: Buffer.from('hola').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') } },
            ],
          },
        });
      }

      return jsonResponse({});
    });

    const request = new NextRequest('https://example.com/api/integrations/gmail/pubsub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signOidcJwt()}`,
      },
      body: JSON.stringify({
        message: {
          data: Buffer.from(JSON.stringify({ emailAddress: 'me@example.com', historyId: '100' })).toString('base64'),
        },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      emailAddress: 'me@example.com',
      historyId: '200',
      fullSync: false,
      count: 1,
    });
    expect(body.messages[0]).toMatchObject({
      id: 'msg-1',
      threadId: 'thread-1',
      channel: 'gmail',
      body: 'hola',
    });
  });

  it('falls back to a full sync when history is stale', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('www.googleapis.com/oauth2/v1/certs')) {
        return jsonResponse({ 'test-kid': certPem });
      }

      if (String(url).includes('oauth2.googleapis.com/token')) {
        return jsonResponse({ access_token: 'access-token' });
      }

      if (String(url).includes('/users/me/profile')) {
        return jsonResponse({ emailAddress: 'me@example.com' });
      }

      if (String(url).includes('/users/me/history?')) {
        return new Response(JSON.stringify({ error: { message: 'not found' } }), { status: 404 });
      }

      if (String(url).includes('/users/me/threads?')) {
        return jsonResponse({ threads: [{ id: 'thread-1' }] });
      }

      if (String(url).includes('/users/me/threads/thread-1?')) {
        return jsonResponse({
          id: 'thread-1',
          messages: [{
            id: 'msg-1',
            threadId: 'thread-1',
            internalDate: '1710000000000',
            payload: {
              headers: [
                { name: 'From', value: 'cliente@example.com' },
                { name: 'To', value: 'me@example.com' },
                { name: 'Subject', value: 'Hola' },
              ],
              parts: [
                { mimeType: 'text/plain', body: { data: Buffer.from('full sync').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') } },
              ],
            },
          }],
        });
      }

      return jsonResponse({});
    });

    const request = new NextRequest('https://example.com/api/integrations/gmail/pubsub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signOidcJwt()}`,
      },
      body: JSON.stringify({ emailAddress: 'me@example.com', historyId: '100' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      fullSync: true,
      count: 1,
    });
    expect(body.messages[0]).toMatchObject({
      body: 'full sync',
    });
  });

  it('rejects requests without an OIDC bearer token', async () => {
    const request = new NextRequest('https://example.com/api/integrations/gmail/pubsub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress: 'me@example.com', historyId: '100' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      code: 'GMAIL_PUBSUB_WEBHOOK_FAILED',
    });
    expect(body.error).toContain('Bearer token');
  });
});
