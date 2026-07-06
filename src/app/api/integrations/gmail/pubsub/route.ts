import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { reconcileGmailPubSubNotification, GmailApiError } from '@/integrations/gmail/adapter';

export const runtime = 'nodejs';

type PubSubMessage = {
  data?: string;
  messageId?: string;
  publishTime?: string;
};

type PubSubPushBody = {
  message?: PubSubMessage;
  subscription?: string;
};

type GoogleOidcClaims = {
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  email?: string;
  email_verified?: boolean;
  sub?: string;
};

type GoogleCertCache = {
  fetchedAt: number;
  certs: Record<string, string>;
};

const GOOGLE_OIDC_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
const GOOGLE_OIDC_CERT_CACHE_TTL_MS = 60 * 60 * 1000;

let googleCertCache: GoogleCertCache | null = null;

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getBearerToken(request: NextRequest): string {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('Pub/Sub request missing Bearer token.');
  }
  return match[1].trim();
}

function decodeJwt(token: string): { header: Record<string, unknown>; payload: GoogleOidcClaims; signingInput: string; signature: Buffer } {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('OIDC token is not a valid JWT.');
  }

  return {
    header: JSON.parse(base64UrlDecode(headerPart)) as Record<string, unknown>,
    payload: JSON.parse(base64UrlDecode(payloadPart)) as GoogleOidcClaims,
    signingInput: `${headerPart}.${payloadPart}`,
    signature: Buffer.from(signaturePart.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(signaturePart.length / 4) * 4, '='), 'base64'),
  };
}

async function fetchGoogleCerts(fetchImpl: typeof globalThis.fetch): Promise<Record<string, string>> {
  const now = Date.now();
  if (googleCertCache && now - googleCertCache.fetchedAt < GOOGLE_OIDC_CERT_CACHE_TTL_MS) {
    return googleCertCache.certs;
  }

  const response = await fetchImpl(GOOGLE_OIDC_CERTS_URL, { method: 'GET' });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error?.message ?? `Unable to fetch Google OIDC certs (${response.status}).`);
  }

  const certs = json && typeof json === 'object' ? json as Record<string, string> : {};
  googleCertCache = { fetchedAt: now, certs };
  return certs;
}

async function verifyGoogleOidc(request: NextRequest, fetchImpl: typeof globalThis.fetch): Promise<GoogleOidcClaims> {
  const expectedAudience = process.env.GMAIL_PUBSUB_VERIFICATION_AUDIENCE?.trim();
  if (!expectedAudience) {
    throw new Error('GMAIL_PUBSUB_VERIFICATION_AUDIENCE is not configured.');
  }

  const token = getBearerToken(request);
  const { header, payload, signingInput, signature } = decodeJwt(token);
  if (header.alg !== 'RS256') {
    throw new Error('OIDC token algorithm is not RS256.');
  }

  const kid = typeof header.kid === 'string' ? header.kid : '';
  if (!kid) {
    throw new Error('OIDC token missing key id.');
  }

  const certs = await fetchGoogleCerts(fetchImpl);
  const cert = certs[kid];
  if (!cert) {
    throw new Error('OIDC certificate not found for token key id.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();
  const valid = verifier.verify(cert, signature);
  if (!valid) {
    throw new Error('OIDC token signature is invalid.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < nowSeconds) {
    throw new Error('OIDC token has expired.');
  }

  if (!['https://accounts.google.com', 'accounts.google.com'].includes(payload.iss ?? '')) {
    throw new Error('OIDC token issuer is invalid.');
  }

  if (payload.aud !== expectedAudience) {
    throw new Error('OIDC token audience is invalid.');
  }

  return payload;
}

function decodePubSubNotification(body: unknown): { emailAddress: string; historyId: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Webhook body is not valid JSON.');
  }

  const pushBody = body as PubSubPushBody & Record<string, unknown>;
  const payload = pushBody.message?.data
    ? JSON.parse(Buffer.from(pushBody.message.data, 'base64').toString('utf8'))
    : body;

  const emailAddress = String((payload as any).emailAddress ?? '').trim();
  const historyId = String((payload as any).historyId ?? '').trim();

  if (!emailAddress || !historyId) {
    throw new Error('Pub/Sub payload requires emailAddress and historyId.');
  }

  return { emailAddress, historyId };
}

export async function POST(request: NextRequest) {
  try {
    await verifyGoogleOidc(request, globalThis.fetch.bind(globalThis));
    const body = await request.json();
    const notification = decodePubSubNotification(body);

    const credentials = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
      GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN ?? '',
      GMAIL_PUBSUB_TOPIC: process.env.GMAIL_PUBSUB_TOPIC ?? '',
      GMAIL_PUBSUB_VERIFICATION_AUDIENCE: process.env.GMAIL_PUBSUB_VERIFICATION_AUDIENCE ?? '',
    };

    const result = await reconcileGmailPubSubNotification(credentials, notification);

    return NextResponse.json({
      ok: true,
      emailAddress: result.emailAddress,
      historyId: result.historyId,
      fullSync: result.fullSync,
      messages: result.messages,
      count: result.messages.length,
    });
  } catch (error) {
    if (error instanceof GmailApiError) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        code: error.code,
      }, { status: error.status ?? 500 });
    }

    const message = error instanceof Error ? error.message : 'Gmail Pub/Sub webhook failed';
    return NextResponse.json({
      ok: false,
      error: message,
      code: 'GMAIL_PUBSUB_WEBHOOK_FAILED',
    }, { status: 400 });
  }
}
