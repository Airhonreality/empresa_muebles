import crypto from 'crypto';
import type {
  ListPage,
  MessageAttachment,
  MessageStore,
  MessagingAdapter,
  NormalizedMessage,
  NormalizedThread,
  OutboundMessagePayload,
} from '@/adapters/_contracts/messaging-adapter';

const TIKTOK_API_BASE_URL = 'https://business-api.tiktok.com/open_api/v1.3';
const TIKTOK_SEND_MESSAGE_PATH = '/im/messages/send';
const TIKTOK_THREAD_PATH = '/im/threads';
const TIKTOK_SERVICE_WINDOW_HOURS = 48;
const TIKTOK_OUTBOUND_QUOTA = 10;
const TIKTOK_WEBHOOK_TOLERANCE_SECONDS = 5;

export type TiktokCredentials = {
  TIKTOK_CLIENT_ID: string;
  TIKTOK_CLIENT_SECRET: string;
  TIKTOK_ACCESS_TOKEN: string;
  TIKTOK_REFRESH_TOKEN: string;
  TIKTOK_REFRESH_TOKEN_EXPIRES_AT?: string;
};

export type TiktokAuthState =
  | {
    status: 'ready';
    accessTokenExpiresAt?: string;
    refreshTokenExpiresAt?: string;
  }
  | {
    status: 'requiere_reauth';
    reason: 'refresh_token_expired';
    expiredAt?: string;
  };

export type TiktokSendRequest = {
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  body: Record<string, unknown>;
  threadId: string;
  serviceWindowExpiresAt?: string;
  outboundQuotaRemaining?: number;
};

export class TiktokConfigurationError extends Error {
  code = 'TIKTOK_CONFIGURATION_ERROR' as const;
  missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(`Missing required TikTok configuration: ${missingKeys.join(', ')}`);
    this.name = 'TiktokConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export class TiktokMessageStoreRequiredError extends Error {
  code = 'TIKTOK_MESSAGE_STORE_REQUIRED' as const;

  constructor() {
    super('TikTok is push-only in this seed. listThreads/listMessages require an injected MessageStore.');
    this.name = 'TiktokMessageStoreRequiredError';
  }
}

export class TiktokWebhookError extends Error {
  code = 'TIKTOK_WEBHOOK_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'TiktokWebhookError';
  }
}

export class TiktokReauthRequiredError extends Error {
  code = 'TIKTOK_REQUIRES_REAUTH' as const;

  constructor(expiredAt?: string) {
    super(expiredAt
      ? `TikTok refresh token expired at ${expiredAt}. Reautorizacion requerida.`
      : 'TikTok refresh token expired. Reautorizacion requerida.');
    this.name = 'TiktokReauthRequiredError';
  }
}

export class TiktokServiceWindowError extends Error {
  code = 'TIKTOK_SERVICE_WINDOW_EXPIRED' as const;

  constructor(
    public threadId: string,
    public serviceWindowExpiresAt: string,
  ) {
    super(`The 48h TikTok service window for thread "${threadId}" expired at ${serviceWindowExpiresAt}.`);
    this.name = 'TiktokServiceWindowError';
  }
}

export class TiktokQuotaExceededError extends Error {
  code = 'TIKTOK_OUTBOUND_QUOTA_EXCEEDED' as const;

  constructor(
    public threadId: string,
    public outboundQuotaRemaining: number,
  ) {
    super(`The TikTok outbound quota for thread "${threadId}" is exhausted (${outboundQuotaRemaining} remaining).`);
    this.name = 'TiktokQuotaExceededError';
  }
}

export class TiktokUnsupportedPayloadError extends Error {
  code = 'TIKTOK_UNSUPPORTED_PAYLOAD' as const;

  constructor(message: string) {
    super(message);
    this.name = 'TiktokUnsupportedPayloadError';
  }
}

function requireConfig(credentials: Record<string, string>): TiktokCredentials {
  const missingKeys = [
    'TIKTOK_CLIENT_ID',
    'TIKTOK_CLIENT_SECRET',
    'TIKTOK_ACCESS_TOKEN',
    'TIKTOK_REFRESH_TOKEN',
  ].filter(key => !credentials[key]);

  if (missingKeys.length > 0) {
    throw new TiktokConfigurationError(missingKeys);
  }

  return {
    TIKTOK_CLIENT_ID: credentials.TIKTOK_CLIENT_ID,
    TIKTOK_CLIENT_SECRET: credentials.TIKTOK_CLIENT_SECRET,
    TIKTOK_ACCESS_TOKEN: credentials.TIKTOK_ACCESS_TOKEN,
    TIKTOK_REFRESH_TOKEN: credentials.TIKTOK_REFRESH_TOKEN,
    TIKTOK_REFRESH_TOKEN_EXPIRES_AT: credentials.TIKTOK_REFRESH_TOKEN_EXPIRES_AT || undefined,
  };
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return value;
  }
  return undefined;
}

function toIsoTimestamp(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }

  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  if (Number.isFinite(numeric) && numeric > 0) {
    const milliseconds = numeric > 1e12 ? numeric : numeric * 1000;
    return new Date(milliseconds).toISOString();
  }

  return new Date().toISOString();
}

function normalizeMimeType(source: { mime_type?: string; mimeType?: string; type?: string; url?: string }): string {
  if (source.mime_type) return source.mime_type;
  if (source.mimeType) return source.mimeType;
  const type = (source.type ?? '').toLowerCase();
  if (type === 'image') return 'image/jpeg';
  if (type === 'video') return 'video/mp4';
  if (type === 'audio') return 'audio/mpeg';
  return source.url ? 'application/octet-stream' : 'application/octet-stream';
}

function attachmentKindFromMime(mimeType: string): 'image' | 'video' | 'audio' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

function normalizeAttachment(source: {
  externalId?: string;
  external_id?: string;
  url?: string;
  mime_type?: string;
  mimeType?: string;
  filename?: string;
  type?: string;
}): MessageAttachment {
  return {
    externalId: source.externalId ?? source.external_id,
    url: source.url,
    mimeType: normalizeMimeType(source),
    filename: source.filename,
  };
}

function isExpired(expiredAt?: string): boolean {
  if (!expiredAt) return false;
  const ms = Date.parse(expiredAt);
  return Number.isFinite(ms) ? ms <= Date.now() : false;
}

function buildAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function buildRequestUrl(path: string): string {
  return `${TIKTOK_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildMessagePayload(payload: OutboundMessagePayload): Record<string, unknown> {
  if (payload.templateRef) {
    throw new TiktokUnsupportedPayloadError('TikTok Business Messaging does not support templateRef payloads in this adapter.');
  }

  if (payload.type === 'image') {
    if (!payload.attachments || payload.attachments.length !== 1) {
      throw new TiktokUnsupportedPayloadError('TikTok image messages require exactly one image attachment.');
    }
    const attachment = payload.attachments[0];
    if (!attachment.url && !attachment.externalId) {
      throw new TiktokUnsupportedPayloadError('TikTok outbound attachments require either url or externalId.');
    }
    if (!attachment.mimeType.startsWith('image/')) {
      throw new TiktokUnsupportedPayloadError('TikTok Business Messaging only accepts standard image attachments in this adapter.');
    }

    return {
      message_type: 'image',
      image: {
        url: attachment.url,
        external_id: attachment.externalId,
        filename: attachment.filename,
      },
    };
  }

  if (payload.type !== 'text') {
    throw new TiktokUnsupportedPayloadError(`TikTok Business Messaging does not support outbound type '${payload.type}'.`);
  }

  if (payload.attachments && payload.attachments.length > 0) {
    throw new TiktokUnsupportedPayloadError('Text messages cannot carry outbound attachments in this adapter.');
  }

  if (!payload.body) {
    throw new TiktokUnsupportedPayloadError('sendMessage requires body for text messages.');
  }

  return {
    message_type: 'text',
    text: {
      body: payload.body ?? '',
    },
  };
}

function buildRequestFromThread(
  config: TiktokCredentials,
  threadId: string,
  payload: OutboundMessagePayload,
  thread?: Pick<NormalizedThread, 'serviceWindowExpiresAt' | 'outboundQuotaRemaining'>,
): TiktokSendRequest {
  const body = buildMessagePayload(payload);
  return {
    endpoint: buildRequestUrl(TIKTOK_SEND_MESSAGE_PATH),
    method: 'POST',
    headers: buildAuthHeaders(config.TIKTOK_ACCESS_TOKEN),
    threadId,
    serviceWindowExpiresAt: thread?.serviceWindowExpiresAt,
    outboundQuotaRemaining: thread?.outboundQuotaRemaining,
    body: {
      client_id: config.TIKTOK_CLIENT_ID,
      conversation_id: threadId,
      ...body,
    },
  };
}

function parseSignatureHeader(header: string): { timestamp: number; signature: string } | null {
  const timestampMatch = header.match(/(?:^|[,\s;])t=(\d+)/);
  const signatureMatch = header.match(/(?:^|[,\s;])s=([a-fA-F0-9]+)/);
  if (!timestampMatch || !signatureMatch) return null;
  const timestamp = Number(timestampMatch[1]);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return { timestamp, signature: signatureMatch[1].toLowerCase() };
}

function compareHex(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function extractMessagesFromWebhook(payload: unknown): any[] {
  const messages: any[] = [];

  const walk = (current: unknown): void => {
    if (!current || typeof current !== 'object') return;

    if (Array.isArray(current)) {
      for (const item of current) {
        walk(item);
      }
      return;
    }

    const record = current as Record<string, unknown>;
    if (Array.isArray(record.messages)) {
      messages.push(...record.messages);
    }
    if (record.message && typeof record.message === 'object') {
      messages.push(record.message);
    }

    for (const [key, value] of Object.entries(record)) {
      if (key === 'messages' || key === 'message') continue;
      walk(value);
    }
  }

  walk(payload);
  return messages;
}

function normalizeInboundMessage(message: Record<string, unknown>): NormalizedMessage {
  const attachments = Array.isArray(message.attachments)
    ? message.attachments
      .map(item => (item && typeof item === 'object' ? normalizeAttachment(item as Record<string, string>) : null))
      .filter((item): item is MessageAttachment => !!item)
    : undefined;

  const threadId = String(
    message.conversation_id
      ?? message.conversationId
      ?? message.thread_id
      ?? message.threadId
      ?? message.sender_id
      ?? message.senderId
      ?? message.user_id
      ?? message.userId
      ?? message.id
      ?? crypto.randomUUID(),
  );

  return {
    id: String(message.message_id ?? message.msg_id ?? message.id ?? crypto.randomUUID()),
    externalId: message.message_id ? String(message.message_id) : message.msg_id ? String(message.msg_id) : message.id ? String(message.id) : undefined,
    threadId,
    channel: 'tiktok',
    direction: 'inbound',
    type: attachments?.length ? attachmentKindFromMime(attachments[0].mimeType) : 'text',
    body: typeof message.text === 'string'
      ? message.text
      : typeof message.body === 'string'
        ? message.body
        : typeof message.content === 'string'
          ? message.content
            : typeof message.message === 'string'
              ? message.message
              : typeof message.caption === 'string'
                ? message.caption
              : undefined,
    attachments,
    sentAt: toIsoTimestamp(message.timestamp ?? message.created_at ?? message.createdAt ?? message.sent_at ?? message.sentAt),
    raw: message,
  };
}

async function fetchJson(fetchImpl: typeof globalThis.fetch, url: string, init: RequestInit): Promise<any> {
  const response = await fetchImpl(url, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error?.message ?? json.message ?? `TikTok API error ${response.status}`);
  }
  return json;
}

async function findThread(store: MessageStore, threadId: string): Promise<NormalizedThread | null> {
  const seen = new Set<string>();
  let cursor: string | undefined;

  while (!seen.has(cursor ?? '')) {
    seen.add(cursor ?? '');
    const page = await store.listThreads({ cursor, limit: 200 });
    const match = page.items.find(thread => thread.id === threadId);
    if (match) return match;
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return null;
}

export class TiktokAdapter implements MessagingAdapter {
  private readonly config: TiktokCredentials;
  private readonly messageStore?: MessageStore;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(credentials: Record<string, string>, options: { messageStore?: MessageStore; fetch?: typeof globalThis.fetch } = {}) {
    this.config = requireConfig(credentials);
    this.messageStore = options.messageStore;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  getAuthState(now = new Date()): TiktokAuthState {
    if (isExpired(this.config.TIKTOK_REFRESH_TOKEN_EXPIRES_AT)) {
      return {
        status: 'requiere_reauth',
        reason: 'refresh_token_expired',
        expiredAt: this.config.TIKTOK_REFRESH_TOKEN_EXPIRES_AT,
      };
    }

    return {
      status: 'ready',
    };
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    const authState = this.getAuthState();
    if (authState.status === 'requiere_reauth') {
      return { ok: false, message: 'requiere_reauth' };
    }
    return { ok: true, message: 'TikTok configuration loaded.' };
  }

  async listThreads(params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedThread>> {
    if (!this.messageStore) throw new TiktokMessageStoreRequiredError();
    return this.messageStore.listThreads(params);
  }

  async listMessages(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedMessage>> {
    if (!this.messageStore) throw new TiktokMessageStoreRequiredError();
    return this.messageStore.listMessages(threadId, params);
  }

  private async resolveThreadContext(threadId: string): Promise<NormalizedThread> {
    if (this.messageStore) {
      const thread = await findThread(this.messageStore, threadId);
      if (thread) return thread;
    }

    const response = await fetchJson(this.fetchImpl, buildRequestUrl(`${TIKTOK_THREAD_PATH}/${encodeURIComponent(threadId)}`), {
      method: 'GET',
      headers: buildAuthHeaders(this.config.TIKTOK_ACCESS_TOKEN),
    });

    const serviceWindowExpiresAt = response.service_window_expires_at
      ?? response.serviceWindowExpiresAt
      ?? response.window_expires_at
      ?? response.windowExpiresAt
      ?? (response.last_inbound_at || response.lastInboundAt
        ? new Date(Date.parse(String(response.last_inbound_at ?? response.lastInboundAt)) + TIKTOK_SERVICE_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
        : undefined);

    return {
      id: String(response.id ?? threadId),
      channel: 'tiktok',
      contact: {
        channel: 'tiktok',
        externalId: String(response.contact?.externalId ?? response.contact_external_id ?? response.contactId ?? threadId),
        displayName: response.contact?.displayName ?? response.contact_display_name ?? undefined,
        handle: response.contact?.handle ?? response.contact_handle ?? undefined,
      },
      lastMessageAt: response.last_message_at ?? response.lastMessageAt ?? undefined,
      unreadCount: response.unread_count ?? response.unreadCount ?? undefined,
      serviceWindowExpiresAt,
      outboundQuotaRemaining: response.outbound_quota_remaining ?? response.outboundQuotaRemaining ?? TIKTOK_OUTBOUND_QUOTA,
    };
  }

  async sendMessage(threadId: string, payload: OutboundMessagePayload): Promise<NormalizedMessage> {
    const authState = this.getAuthState();
    if (authState.status === 'requiere_reauth') {
      throw new TiktokReauthRequiredError(authState.expiredAt);
    }

    const thread = await this.resolveThreadContext(threadId);
    if (thread.serviceWindowExpiresAt && Date.parse(thread.serviceWindowExpiresAt) <= Date.now()) {
      throw new TiktokServiceWindowError(threadId, thread.serviceWindowExpiresAt);
    }

    const remaining = thread.outboundQuotaRemaining ?? TIKTOK_OUTBOUND_QUOTA;
    if (remaining <= 0) {
      throw new TiktokQuotaExceededError(threadId, remaining);
    }

    const request = buildRequestFromThread(this.config, threadId, payload, thread);
    const result = await fetchJson(this.fetchImpl, request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });

    const messageId = result.message_id ?? result.messages?.[0]?.id ?? result.data?.message_id ?? result.id;
    if (!messageId) {
      throw new TiktokWebhookError('TikTok API did not return a message id.');
    }

    const normalized: NormalizedMessage = {
      id: crypto.randomUUID(),
      externalId: String(messageId),
      threadId,
      channel: 'tiktok',
      direction: 'outbound',
      type: payload.type === 'image' ? 'image' : 'text',
      body: payload.body,
      attachments: payload.attachments?.length
        ? payload.attachments.map(attachment => ({
          externalId: attachment.externalId,
          url: attachment.url,
          mimeType: attachment.mimeType,
          filename: attachment.filename,
        }))
        : undefined,
      sentAt: new Date().toISOString(),
      status: 'sent',
      raw: result,
    };

    if (this.messageStore) {
      await this.messageStore.upsertMessage(normalized);
      await this.messageStore.upsertThread({
        ...thread,
        lastMessageAt: normalized.sentAt,
        outboundQuotaRemaining: Math.max(0, remaining - 1),
      });
    }

    return normalized;
  }

  async handleWebhook(rawBody: string, headers: Record<string, string>): Promise<NormalizedMessage[]> {
    void headers;

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new TiktokWebhookError('Webhook body is not valid JSON.');
    }

    return extractMessagesFromWebhook(parsed).map(message => normalizeInboundMessage(message as Record<string, unknown>));
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean {
    const signatureHeader = getHeader(headers, 'TikTok-Signature');
    if (!signatureHeader) return false;

    const parsed = parseSignatureHeader(signatureHeader);
    if (!parsed) return false;

    if (Math.abs(Date.now() - parsed.timestamp * 1000) > TIKTOK_WEBHOOK_TOLERANCE_SECONDS * 1000) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', this.config.TIKTOK_CLIENT_SECRET)
      .update(`${parsed.timestamp}.${rawBody}`, 'utf8')
      .digest('hex');

    return compareHex(expected, parsed.signature);
  }
}

export function previewTiktokSendMessage(
  credentials: Record<string, string>,
  threadId: string,
  payload: OutboundMessagePayload,
  thread?: Pick<NormalizedThread, 'serviceWindowExpiresAt' | 'outboundQuotaRemaining'>,
): TiktokSendRequest {
  const config = requireConfig(credentials);
  return buildRequestFromThread(config, threadId, payload, thread);
}
