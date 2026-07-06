import crypto from 'crypto';
import type {
  ListPage,
  MessageAttachment,
  MessagingAdapter,
  NormalizedMessage,
  NormalizedThread,
  OutboundMessagePayload,
} from '@/adapters/_contracts/messaging-adapter';

const GRAPH_VERSION = 'v23.0';
const META_WINDOW_HOURS = 24;

type MetaChannel = 'messenger' | 'instagram';

type MetaCredentials = {
  META_PAGE_ACCESS_TOKEN: string;
  META_IG_USER_ID: string;
  META_WEBHOOK_VERIFY_TOKEN: string;
  META_APP_SECRET: string;
};

type MetaConversation = {
  id?: string;
  platform?: string;
  channel?: string;
  updated_time?: string;
  unread_count?: number;
  unreadCount?: number;
  participants?: { data?: Array<{ id?: string; name?: string }> };
  messages?: { data?: MetaInboundMessage[] };
  conversation?: { id?: string };
  raw?: Record<string, unknown>;
};

type MetaInboundMessage = {
  id?: string;
  from?: { id?: string; name?: string };
  to?: { data?: Array<{ id?: string; name?: string }> };
  created_time?: string;
  timestamp?: string;
  message?: string;
  text?: { body?: string };
  attachments?: Array<{
    type?: string;
    payload?: { url?: string; asset_id?: string };
    id?: string;
    mime_type?: string;
    filename?: string;
    url?: string;
  }>;
  image?: { id?: string; asset_id?: string; url?: string; mime_type?: string; filename?: string };
  video?: { id?: string; asset_id?: string; url?: string; mime_type?: string; filename?: string };
  audio?: { id?: string; asset_id?: string; url?: string; mime_type?: string; filename?: string };
  file?: { id?: string; asset_id?: string; url?: string; mime_type?: string; filename?: string };
  is_echo?: boolean;
  raw?: Record<string, unknown>;
};

type GraphCollection<T> = {
  data?: T[];
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
};

export class MetaConfigurationError extends Error {
  code = 'META_CONFIGURATION_ERROR' as const;
  missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(`Missing required Meta configuration: ${missingKeys.join(', ')}`);
    this.name = 'MetaConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export class MetaWebhookError extends Error {
  code = 'META_WEBHOOK_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'MetaWebhookError';
  }
}

export class MetaServiceWindowError extends Error {
  code = 'META_SERVICE_WINDOW_EXPIRED' as const;

  constructor(
    public threadId: string,
    public serviceWindowExpiresAt: string,
  ) {
    super(`The 24h Meta service window for thread "${threadId}" expired at ${serviceWindowExpiresAt}.`);
    this.name = 'MetaServiceWindowError';
  }
}

export class MetaThreadNotFoundError extends Error {
  code = 'META_THREAD_NOT_FOUND' as const;

  constructor(threadId: string) {
    super(`Meta thread "${threadId}" was not found.`);
    this.name = 'MetaThreadNotFoundError';
  }
}

export class MetaUnsupportedPayloadError extends Error {
  code = 'META_UNSUPPORTED_PAYLOAD' as const;

  constructor(message: string) {
    super(message);
    this.name = 'MetaUnsupportedPayloadError';
  }
}

function requireConfig(credentials: Record<string, string>): MetaCredentials {
  const missingKeys = [
    'META_PAGE_ACCESS_TOKEN',
    'META_IG_USER_ID',
    'META_WEBHOOK_VERIFY_TOKEN',
    'META_APP_SECRET',
  ].filter(key => !credentials[key]);

  if (missingKeys.length > 0) {
    throw new MetaConfigurationError(missingKeys);
  }

  return {
    META_PAGE_ACCESS_TOKEN: credentials.META_PAGE_ACCESS_TOKEN,
    META_IG_USER_ID: credentials.META_IG_USER_ID,
    META_WEBHOOK_VERIFY_TOKEN: credentials.META_WEBHOOK_VERIFY_TOKEN,
    META_APP_SECRET: credentials.META_APP_SECRET,
  };
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return value;
  }
  return undefined;
}

function buildGraphUrl(base: string, path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
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

function normalizeChannel(value: unknown): MetaChannel {
  const raw = typeof value === 'string' ? value.toLowerCase() : '';
  return raw.includes('instagram') ? 'instagram' : 'messenger';
}

function normalizeAttachmentType(attachment: { type?: string; mimeType?: string; mime_type?: string; url?: string; payload?: { url?: string } }): MessageAttachment['mimeType'] {
  const mime = attachment.mimeType ?? attachment.mime_type ?? '';
  if (mime) return mime;

  const attachmentType = (attachment.type ?? '').toLowerCase();
  if (attachmentType === 'image') return 'image/jpeg';
  if (attachmentType === 'video') return 'video/mp4';
  if (attachmentType === 'audio') return 'audio/mpeg';
  if (attachmentType === 'file' || attachmentType === 'document') return 'application/octet-stream';
  if (attachment.url ?? attachment.payload?.url) return 'application/octet-stream';

  return 'application/octet-stream';
}

function attachmentKindFromMime(mimeType: string): 'image' | 'video' | 'audio' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

function extractMessageBody(message: MetaInboundMessage): string | undefined {
  return message.text?.body ?? message.message ?? undefined;
}

function extractMessageAttachments(message: MetaInboundMessage): Array<{
  assetId?: string;
  url?: string;
  mimeType: string;
  filename?: string;
}> {
  const attachments: Array<{
    assetId?: string;
    url?: string;
    mimeType: string;
    filename?: string;
  }> = [];

  for (const attachment of message.attachments ?? []) {
    attachments.push({
      assetId: attachment.payload?.asset_id ?? attachment.id,
      url: attachment.payload?.url ?? attachment.url,
      mimeType: normalizeAttachmentType(attachment),
      filename: attachment.filename,
    });
  }

  for (const source of [message.image, message.video, message.audio, message.file]) {
    if (!source) continue;
    attachments.push({
      assetId: source.asset_id ?? source.id,
      url: source.url,
      mimeType: source.mime_type ?? 'application/octet-stream',
      filename: source.filename,
    });
  }

  return attachments;
}

function pickParticipantId(conversation: MetaConversation): string | undefined {
  const participants = conversation.participants?.data ?? [];
  if (participants.length === 1) return participants[0]?.id;
  if (participants.length > 1) {
    const candidate = participants.find(participant => participant.id && participant.name)?.id
      ?? participants.find(participant => participant.id)?.id;
    if (candidate) return candidate;
  }
  return undefined;
}

function pickMessageContactId(messages: MetaInboundMessage[]): string | undefined {
  const inbound = messages.find(message => !message.is_echo && message.from?.id);
  if (inbound?.from?.id) return inbound.from.id;

  const first = messages.find(message => message.from?.id);
  return first?.from?.id;
}

function computeServiceWindowExpiresAt(messages: MetaInboundMessage[]): string | undefined {
  const inbound = messages.find(message => !message.is_echo && (message.created_time || message.timestamp));
  const timestamp = inbound?.created_time ?? inbound?.timestamp;
  if (!timestamp) return undefined;

  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) return undefined;

  return new Date(ms + META_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

function normalizeThreadId(conversationId: string): string {
  return conversationId.trim();
}

function normalizeMessage(
  threadId: string,
  channel: MetaChannel,
  message: MetaInboundMessage,
  contactExternalId?: string,
): NormalizedMessage {
  const attachments = extractMessageAttachments(message);
  const resolvedAttachments = attachments.length > 0
    ? attachments.map(attachment => ({
      externalId: attachment.assetId,
      url: attachment.url,
      mimeType: attachment.mimeType,
      filename: attachment.filename,
    }))
    : undefined;

  return {
    id: message.id ?? crypto.randomUUID(),
    externalId: message.id,
    threadId,
    channel,
    direction: message.is_echo ? 'outbound' : 'inbound',
    type: attachments.length > 0
      ? attachmentKindFromMime(attachments[0].mimeType)
      : 'text',
    body: extractMessageBody(message),
    attachments: resolvedAttachments,
    sentAt: toIsoTimestamp(message.created_time ?? message.timestamp),
    status: message.is_echo ? 'sent' : undefined,
    raw: {
      ...message.raw,
      attachments,
      contact_external_id: contactExternalId,
    },
  };
}

async function fetchJson(fetchImpl: typeof globalThis.fetch, url: string, init: RequestInit): Promise<any> {
  const response = await fetchImpl(url, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error?.message ?? json.message ?? `Meta API error ${response.status}`);
  }
  return json;
}

async function fetchBinary(fetchImpl: typeof globalThis.fetch, url: string, init: RequestInit): Promise<{ bytesBase64: string; contentType?: string }> {
  const response = await fetchImpl(url, init);
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message ?? json.message ?? `Meta media error ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer()).toString('base64');
  return {
    bytesBase64: bytes,
    contentType: response.headers.get('content-type') ?? undefined,
  };
}

function mergePage<T>(response: GraphCollection<T>): { items: T[]; nextCursor?: string } {
  return {
    items: response.data ?? [],
    nextCursor: response.paging?.cursors?.after,
  };
}

export class MetaAdapter implements MessagingAdapter {
  private readonly config: MetaCredentials;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(credentials: Record<string, string>, options: { fetch?: typeof globalThis.fetch } = {}) {
    this.config = requireConfig(credentials);
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: 'Meta configuration loaded.' };
  }

  private getPageToken(): string {
    return this.config.META_PAGE_ACCESS_TOKEN;
  }

  private buildFacebookUrl(path: string, query?: Record<string, string | number | undefined>): string {
    return buildGraphUrl(`https://graph.facebook.com/${GRAPH_VERSION}`, path, query);
  }

  private buildInstagramUrl(path: string, query?: Record<string, string | number | undefined>): string {
    return buildGraphUrl(`https://graph.instagram.com/${GRAPH_VERSION}`, path, query);
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getPageToken()}`,
      'Content-Type': 'application/json',
    };
  }

  private async fetchConversationPage(params?: { cursor?: string; limit?: number }): Promise<ListPage<MetaConversation>> {
    const url = this.buildFacebookUrl('/me/conversations', {
      fields: 'id,platform,updated_time,unread_count,participants',
      limit: params?.limit ?? 20,
      after: params?.cursor,
    });

    const response = await fetchJson(this.fetchImpl, url, {
      method: 'GET',
      headers: this.authHeaders(),
    });

    return mergePage<MetaConversation>(response);
  }

  private async fetchMessagesPage(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<MetaInboundMessage>> {
    const url = this.buildFacebookUrl(`/${threadId}/messages`, {
      fields: 'id,from,to,message,text,created_time,attachments,is_echo,image,video,audio,file',
      limit: params?.limit ?? 20,
      after: params?.cursor,
    });

    const response = await fetchJson(this.fetchImpl, url, {
      method: 'GET',
      headers: this.authHeaders(),
    });

    return mergePage<MetaInboundMessage>(response);
  }

  private async resolveThreadIdentity(
    threadId: string,
    options: { includeServiceWindow?: boolean } = {},
  ): Promise<{ channel: MetaChannel; contactExternalId: string; serviceWindowExpiresAt?: string }> {
    const threadResponse = await fetchJson(this.fetchImpl, this.buildFacebookUrl(`/${threadId}`, {
      fields: 'id,platform,channel,participants,updated_time',
    }), {
      method: 'GET',
      headers: this.authHeaders(),
    });

    const conversation = threadResponse as MetaConversation;
    const channel = normalizeChannel(conversation.platform ?? conversation.channel);

    let contactExternalId = pickParticipantId(conversation);
    let messages: MetaInboundMessage[] = [];

    if (!contactExternalId || options.includeServiceWindow) {
      const messagePage = await this.fetchMessagesPage(threadId, { limit: 25 });
      messages = messagePage.items;
      contactExternalId = pickMessageContactId(messages) ?? contactExternalId;
    }

    if (!contactExternalId) {
      throw new MetaThreadNotFoundError(threadId);
    }

    const serviceWindowExpiresAt = options.includeServiceWindow ? computeServiceWindowExpiresAt(messages) : undefined;
    return { channel, contactExternalId, serviceWindowExpiresAt };
  }

  private async resolveAssetUrl(assetId: string): Promise<{ url: string; mimeType: string; filename?: string }> {
    const response = await fetchJson(this.fetchImpl, this.buildFacebookUrl(`/${assetId}`, {
      fields: 'media_url,mime_type,filename',
    }), {
      method: 'GET',
      headers: this.authHeaders(),
    });

    const url = response.media_url ?? response.url;
    if (!url) {
      throw new MetaWebhookError(`Asset ${assetId} did not return a media_url.`);
    }

    return {
      url,
      mimeType: response.mime_type ?? 'application/octet-stream',
      filename: response.filename ?? undefined,
    };
  }

  private buildSendUrl(channel: MetaChannel): string {
    if (channel === 'instagram') {
      return this.buildInstagramUrl(`/${this.config.META_IG_USER_ID}/messages`);
    }
    return this.buildFacebookUrl('/me/messages');
  }

  async listThreads(params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedThread>> {
    const page = await this.fetchConversationPage(params);
    const items: NormalizedThread[] = [];

    for (const conversation of page.items) {
      const threadId = normalizeThreadId(conversation.id ?? '');
      if (!threadId) continue;

      const channel = normalizeChannel(conversation.platform ?? conversation.channel);
      const messagePage = await this.fetchMessagesPage(threadId, { limit: 25 });
      const normalizedMessages = messagePage.items.map(message => normalizeMessage(threadId, channel, message));
      const contactExternalId = pickMessageContactId(messagePage.items) ?? pickParticipantId(conversation);

      if (!contactExternalId) {
        throw new MetaThreadNotFoundError(threadId);
      }

      items.push({
        id: threadId,
        channel,
        contact: {
          channel,
          externalId: contactExternalId,
        },
        lastMessageAt: normalizedMessages[0]?.sentAt,
        unreadCount: conversation.unread_count ?? conversation.unreadCount,
        serviceWindowExpiresAt: computeServiceWindowExpiresAt(messagePage.items),
      });
    }

    return {
      items,
      nextCursor: page.nextCursor,
    };
  }

  async listMessages(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedMessage>> {
    const identity = await this.resolveThreadIdentity(threadId);
    const page = await this.fetchMessagesPage(threadId, params);

    return {
      items: page.items.map(message => normalizeMessage(threadId, identity.channel, message, identity.contactExternalId)),
      nextCursor: page.nextCursor,
    };
  }

  async sendMessage(threadId: string, payload: OutboundMessagePayload): Promise<NormalizedMessage> {
    if (payload.templateRef) {
      throw new MetaUnsupportedPayloadError('Meta Messaging does not support templateRef payloads in this adapter.');
    }

    const identity = await this.resolveThreadIdentity(threadId, { includeServiceWindow: true });
    if (identity.serviceWindowExpiresAt && Date.parse(identity.serviceWindowExpiresAt) <= Date.now() && !payload.messageTag) {
      throw new MetaServiceWindowError(threadId, identity.serviceWindowExpiresAt);
    }

    const attachments = payload.attachments ?? [];
    if (attachments.length > 1) {
      throw new MetaUnsupportedPayloadError('Meta Messaging accepts a single outbound attachment per message.');
    }

    const requestBody: Record<string, unknown> = {
      recipient: { id: identity.contactExternalId },
      messaging_type: 'RESPONSE',
    };

    if (payload.messageTag) {
      requestBody.message_tag = 'HUMAN_AGENT';
    }

    if (payload.body) {
      requestBody.message = { text: payload.body };
    }

    if (attachments.length === 1) {
      const attachment = attachments[0];
      if (!attachment.url && !attachment.externalId) {
        throw new MetaUnsupportedPayloadError('Meta outbound attachments require either url or externalId.');
      }

      requestBody.message = {
        attachment: {
          type: attachment.mimeType.startsWith('image/') ? 'image'
            : attachment.mimeType.startsWith('video/') ? 'video'
              : attachment.mimeType.startsWith('audio/') ? 'audio'
                : 'file',
          payload: {
            url: attachment.url,
          },
        },
      };
    }

    if (!requestBody.message) {
      throw new MetaUnsupportedPayloadError('Meta sendMessage requires body or a single attachment.');
    }

    const response = await fetchJson(this.fetchImpl, this.buildSendUrl(identity.channel), {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(requestBody),
    });

    const messageId = response.message_id ?? response.messages?.[0]?.id ?? response.id;
    if (!messageId) {
      throw new MetaWebhookError('Meta API did not return a message id.');
    }

    return {
      id: crypto.randomUUID(),
      externalId: messageId,
      threadId,
      channel: identity.channel,
      direction: 'outbound',
      type: attachments.length === 1 ? attachmentKindFromMime(attachments[0].mimeType) : 'text',
      body: payload.body,
      attachments: attachments.length
        ? attachments.map(attachment => ({
          externalId: attachment.externalId,
          url: attachment.url,
          mimeType: attachment.mimeType,
          filename: attachment.filename,
        }))
        : undefined,
      sentAt: new Date().toISOString(),
      status: 'sent',
      raw: response,
    };
  }

  async handleWebhook(rawBody: string, headers: Record<string, string>): Promise<NormalizedMessage[]> {
    void headers;

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new MetaWebhookError('Webhook body is not valid JSON.');
    }

    const messages: NormalizedMessage[] = [];

    for (const entry of parsed.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const channel = normalizeChannel(value.platform ?? value.channel ?? value.messaging_product);
        const threadId = normalizeThreadId(String(value.conversation?.id ?? value.id ?? ''));

        for (const inboundMessage of value.messages ?? []) {
          const attachments = extractMessageAttachments(inboundMessage);
          const resolvedAttachments: Array<{
            externalId?: string;
            url?: string;
            mimeType: string;
            filename?: string;
            bytesBase64?: string;
            contentType?: string;
          }> = [];

          for (const attachment of attachments) {
            if (!attachment.assetId && !attachment.url) {
              resolvedAttachments.push(attachment);
              continue;
            }

            const asset = attachment.assetId
              ? await this.resolveAssetUrl(attachment.assetId)
              : { url: attachment.url ?? '', mimeType: attachment.mimeType, filename: attachment.filename };

            const binary = asset.url
              ? await fetchBinary(this.fetchImpl, asset.url, {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${this.getPageToken()}`,
                },
              })
              : undefined;

            resolvedAttachments.push({
              externalId: attachment.assetId,
              url: asset.url,
              mimeType: asset.mimeType ?? attachment.mimeType,
              filename: asset.filename ?? attachment.filename,
              bytesBase64: binary?.bytesBase64,
              contentType: binary?.contentType,
            });
          }

          messages.push({
            id: inboundMessage.id ?? crypto.randomUUID(),
            externalId: inboundMessage.id,
            threadId: threadId || inboundMessage.from?.id || crypto.randomUUID(),
            channel,
            direction: inboundMessage.is_echo ? 'outbound' : 'inbound',
            type: resolvedAttachments.length > 0
              ? attachmentKindFromMime(resolvedAttachments[0].mimeType)
              : 'text',
            body: extractMessageBody(inboundMessage),
            attachments: resolvedAttachments.length > 0
              ? resolvedAttachments.map(attachment => ({
                externalId: attachment.externalId,
                url: attachment.url,
                mimeType: attachment.mimeType,
                filename: attachment.filename,
              }))
              : undefined,
            sentAt: toIsoTimestamp(inboundMessage.created_time ?? inboundMessage.timestamp),
            raw: {
              ...inboundMessage.raw,
              resolvedAttachments,
            },
          });
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
      .createHmac('sha256', this.config.META_APP_SECRET)
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
    if (verifyToken !== this.config.META_WEBHOOK_VERIFY_TOKEN) return null;

    return challenge;
  }
}
