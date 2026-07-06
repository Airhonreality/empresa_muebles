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

const GRAPH_VERSION = 'v22.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type WhatsappCredentials = {
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_WABA_ID: string;
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
};

export type WhatsappSendRequest = {
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  body: Record<string, unknown>;
  recipient: string;
};

export class WhatsappConfigurationError extends Error {
  code = 'WHATSAPP_CONFIGURATION_ERROR' as const;
  missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(`Missing required WhatsApp configuration: ${missingKeys.join(', ')}`);
    this.name = 'WhatsappConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export class WhatsappMessageStoreRequiredError extends Error {
  code = 'WHATSAPP_MESSAGE_STORE_REQUIRED' as const;

  constructor() {
    super('WhatsApp is push-only in this seed. listThreads/listMessages require an injected MessageStore.');
    this.name = 'WhatsappMessageStoreRequiredError';
  }
}

export class WhatsappServiceWindowError extends Error {
  code = 'WHATSAPP_SERVICE_WINDOW_EXPIRED' as const;

  constructor(
    public threadId: string,
    public serviceWindowExpiresAt: string,
  ) {
    super(`The 24h service window for thread "${threadId}" expired at ${serviceWindowExpiresAt}. Send a template instead.`);
    this.name = 'WhatsappServiceWindowError';
  }
}

export class WhatsappWebhookError extends Error {
  code = 'WHATSAPP_WEBHOOK_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'WhatsappWebhookError';
  }
}

function requireConfig(credentials: Record<string, string>): WhatsappCredentials {
  const missingKeys = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_WABA_ID',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    'WHATSAPP_APP_SECRET',
  ].filter(key => !credentials[key]);

  if (missingKeys.length > 0) {
    throw new WhatsappConfigurationError(missingKeys);
  }

  return {
    WHATSAPP_ACCESS_TOKEN: credentials.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: credentials.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_WABA_ID: credentials.WHATSAPP_WABA_ID,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: credentials.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET: credentials.WHATSAPP_APP_SECRET,
  };
}

function cleanDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

function normalizeCountryDigits(digits: string): string {
  if (!digits) {
    throw new WhatsappWebhookError('Recipient id has no digits.');
  }

  if (digits.startsWith('57') && digits.length === 13 && digits[2] === '1') {
    return `+${digits.slice(0, 2)}${digits.slice(3)}`;
  }

  return `+${digits}`;
}

export function normalizeWhatsAppRecipient(threadId: string): string {
  const raw = threadId.trim();
  if (!raw) {
    throw new WhatsappWebhookError('Recipient thread id is empty.');
  }

  return normalizeCountryDigits(cleanDigits(raw));
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return value;
  }
  return undefined;
}

function buildTemplateComponents(templateParams?: Record<string, string>): Array<{ type: 'body'; parameters: Array<{ type: 'text'; text: string }> }> | undefined {
  if (!templateParams || Object.keys(templateParams).length === 0) return undefined;
  const bodyParameters = Object.entries(templateParams)
    .filter(([key]) => key !== 'language')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => ({ type: 'text' as const, text: String(value) }));

  if (bodyParameters.length === 0) return undefined;
  return [{ type: 'body', parameters: bodyParameters }];
}

export function buildWhatsappSendRequest(
  config: WhatsappCredentials,
  threadId: string,
  payload: OutboundMessagePayload,
): WhatsappSendRequest {
  const recipient = normalizeWhatsAppRecipient(threadId);
  const endpoint = `${GRAPH_BASE_URL}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  if (payload.type === 'template' || payload.templateRef) {
    if (!payload.templateRef) {
      throw new WhatsappWebhookError('templateRef is required for template messages.');
    }

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: payload.templateRef,
        language: { code: payload.templateParams?.language ?? 'en_US' },
      },
    };

    const components = buildTemplateComponents(payload.templateParams);
    if (components) {
      (body.template as Record<string, unknown>).components = components;
    }

    return { endpoint, method: 'POST', headers, body, recipient };
  }

  if (!payload.body && (!payload.attachments || payload.attachments.length === 0)) {
    throw new WhatsappWebhookError('sendMessage requires body, attachments, or templateRef.');
  }

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: false,
      body: payload.body ?? '',
    },
  };

  if (payload.messageTag) {
    body.text = {
      preview_url: false,
      body: payload.body ?? '',
      message_tag: 'HUMAN_AGENT',
    };
  }

  return { endpoint, method: 'POST', headers, body, recipient };
}

function toIsoTimestamp(value: unknown): string {
  const seconds = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return new Date().toISOString();
  }
  return new Date(seconds * 1000).toISOString();
}

function messageTypeFromInbound(message: any): NormalizedMessage['type'] {
  if (message.text) return 'text';
  if (message.image) return 'image';
  if (message.video) return 'video';
  if (message.audio) return 'audio';
  if (message.document) return 'file';
  return 'system';
}

function attachmentFromSource(source: any, externalId: string, url?: string): MessageAttachment {
  return {
    externalId,
    url,
    mimeType: source?.mime_type ?? 'application/octet-stream',
    filename: source?.filename ?? source?.caption ?? undefined,
  };
}

async function resolveMediaAttachment(config: WhatsappCredentials, source: any): Promise<MessageAttachment> {
  const mediaId = source?.id;
  if (!mediaId) {
    throw new WhatsappWebhookError('Webhook media payload is missing a media id.');
  }

  const metadataResponse = await globalThis.fetch(`${GRAPH_BASE_URL}/${mediaId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
    },
  });

  const metadata = await metadataResponse.json().catch(() => ({}));
  if (!metadataResponse.ok) {
    throw new Error(metadata.error?.message ?? metadata.message ?? `WhatsApp media error ${metadataResponse.status}`);
  }

  if (!metadata.url) {
    throw new WhatsappWebhookError(`WhatsApp media ${mediaId} did not return a temporary url.`);
  }

  return attachmentFromSource({ ...source, mime_type: metadata.mime_type, filename: metadata.filename }, mediaId, metadata.url);
}

function normalizeInboundMessage(message: any, attachments?: MessageAttachment[]): NormalizedMessage {
  return {
    id: crypto.randomUUID(),
    externalId: message.id,
    threadId: String(message.from),
    channel: 'whatsapp',
    direction: 'inbound',
    type: messageTypeFromInbound(message),
    body: message.text?.body ?? message.caption ?? message.image?.caption ?? message.video?.caption ?? message.document?.caption ?? undefined,
    attachments,
    sentAt: toIsoTimestamp(message.timestamp),
    raw: message,
  };
}

async function fetchJson(url: string, init: RequestInit): Promise<any> {
  const response = await globalThis.fetch(url, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error?.message ?? json.message ?? `WhatsApp API error ${response.status}`);
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

export class WhatsappAdapter implements MessagingAdapter {
  private readonly config: WhatsappCredentials;
  private readonly messageStore?: MessageStore;

  constructor(credentials: Record<string, string>, options: { messageStore?: MessageStore } = {}) {
    this.config = requireConfig(credentials);
    this.messageStore = options.messageStore;
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: 'WhatsApp configuration loaded.' };
  }

  async listThreads(params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedThread>> {
    if (!this.messageStore) throw new WhatsappMessageStoreRequiredError();
    return this.messageStore.listThreads(params);
  }

  async listMessages(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedMessage>> {
    if (!this.messageStore) throw new WhatsappMessageStoreRequiredError();
    return this.messageStore.listMessages(threadId, params);
  }

  async sendMessage(threadId: string, payload: OutboundMessagePayload): Promise<NormalizedMessage> {
    const thread = this.messageStore ? await findThread(this.messageStore, threadId) : null;
    if (thread?.serviceWindowExpiresAt && new Date(thread.serviceWindowExpiresAt).getTime() <= Date.now()) {
      if (!payload.templateRef && payload.type !== 'template') {
        throw new WhatsappServiceWindowError(threadId, thread.serviceWindowExpiresAt);
      }
    }

    const request = buildWhatsappSendRequest(this.config, threadId, payload);
    const result = await fetchJson(request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });

    const messageId = result.messages?.[0]?.id ?? result.messages?.[0]?.message_id ?? result.message_id;
    if (!messageId) {
      throw new Error('WhatsApp API did not return a message id.');
    }

    return {
      id: crypto.randomUUID(),
      externalId: messageId,
      threadId,
      channel: 'whatsapp',
      direction: 'outbound',
      type: payload.type === 'template' || payload.templateRef ? 'template' : payload.type,
      body: payload.body,
      attachments: payload.attachments,
      sentAt: new Date().toISOString(),
      status: 'sent',
      raw: result,
    };
  }

  async handleWebhook(rawBody: string, headers: Record<string, string>): Promise<NormalizedMessage[]> {
    void headers;

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new WhatsappWebhookError('Webhook body is not valid JSON.');
    }

    if (parsed.object !== 'whatsapp_business_account') return [];

    const messages: NormalizedMessage[] = [];

    for (const entry of parsed.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        for (const message of value.messages ?? []) {
          const source = message.image ?? message.video ?? message.audio ?? message.document ?? message.sticker ?? null;
          const attachments = source ? [await resolveMediaAttachment(this.config, source)] : undefined;
          messages.push(normalizeInboundMessage(message, attachments));
        }
      }
    }

    return messages;
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean {
    const signature = getHeader(headers, 'X-Hub-Signature-256');
    if (!signature) return false;

    const [prefix, hash] = signature.split('=');
    if (prefix !== 'sha256' || !hash) return false;

    const expected = crypto
      .createHmac('sha256', this.config.WHATSAPP_APP_SECRET)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(hash, 'hex');
    if (expectedBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  resolveWebhookChallenge(query: Record<string, string>): string | null {
    const mode = query['hub.mode'];
    const challenge = query['hub.challenge'];
    const verifyToken = query['hub.verify_token'];

    if (mode !== 'subscribe') return null;
    if (!challenge || !verifyToken) return null;
    if (verifyToken !== this.config.WHATSAPP_WEBHOOK_VERIFY_TOKEN) return null;

    return challenge;
  }
}

export function previewWhatsappSendMessage(
  credentials: Record<string, string>,
  threadId: string,
  payload: OutboundMessagePayload,
): WhatsappSendRequest {
  const config = requireConfig(credentials);
  return buildWhatsappSendRequest(config, threadId, payload);
}
