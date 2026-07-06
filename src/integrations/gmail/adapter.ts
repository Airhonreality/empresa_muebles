import crypto from 'crypto';
import type {
  ListPage,
  MessageAttachment,
  MessagingAdapter,
  NormalizedContact,
  NormalizedMessage,
  NormalizedThread,
  OutboundMessagePayload,
} from '@/adapters/_contracts/messaging-adapter';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_ATTACHMENT_LINE_LENGTH = 76;

export type GmailCredentials = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GMAIL_PUBSUB_TOPIC?: string;
  GMAIL_PUBSUB_VERIFICATION_AUDIENCE?: string;
};

export type GmailSendRequest = {
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  body: { raw: string; threadId?: string };
  mime: string;
};

export type GmailPubSubNotification = {
  emailAddress: string;
  historyId: string;
};

export type GmailSyncResult = {
  emailAddress: string;
  historyId: string;
  fullSync: boolean;
  messages: NormalizedMessage[];
};

export type GmailWatchResult = {
  emailAddress: string;
  historyId: string;
  expiration?: string;
  topicName: string;
};

export class GmailConfigurationError extends Error {
  code = 'GMAIL_CONFIGURATION_ERROR' as const;
  missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(`Missing required Gmail configuration: ${missingKeys.join(', ')}`);
    this.name = 'GmailConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export class GmailApiError extends Error {
  code = 'GMAIL_API_ERROR' as const;

  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GmailApiError';
  }
}

export class GmailSendPayloadError extends Error {
  code = 'GMAIL_SEND_PAYLOAD_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'GmailSendPayloadError';
  }
}

function requireConfig(credentials: Record<string, string>): GmailCredentials {
  const missingKeys = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
  ].filter(key => !credentials[key]);

  if (missingKeys.length > 0) {
    throw new GmailConfigurationError(missingKeys);
  }

  return {
    GOOGLE_CLIENT_ID: credentials.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: credentials.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: credentials.GOOGLE_REFRESH_TOKEN,
    GMAIL_PUBSUB_TOPIC: credentials.GMAIL_PUBSUB_TOPIC || undefined,
    GMAIL_PUBSUB_VERIFICATION_AUDIENCE: credentials.GMAIL_PUBSUB_VERIFICATION_AUDIENCE || undefined,
  };
}

function lowerHeaderLookup(headers: Record<string, string>, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return value;
  }
  return undefined;
}

function toIsoTimestamp(value: unknown): string {
  const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  if (Number.isFinite(raw) && raw > 0) {
    return new Date(raw > 1e12 ? raw : raw * 1000).toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }

  return new Date().toISOString();
}

function base64UrlEncode(text: string | Buffer): string {
  return Buffer.from(text).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(data?: string): string {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function encodeMimeHeaderValue(value: string): string {
  if (!/[^\x20-\x7E]/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function foldHeaderLine(name: string, value: string): string {
  return `${name}: ${value}`;
}

function wrapBase64(value: string): string {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += GMAIL_ATTACHMENT_LINE_LENGTH) {
    chunks.push(value.slice(index, index + GMAIL_ATTACHMENT_LINE_LENGTH));
  }
  return chunks.join('\r\n');
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractEmailAddress(value?: string): string {
  if (!value) return '';
  const match = value.match(/<([^>]+)>/);
  if (match) return match[1].trim();
  return value.trim().replace(/^"|"$/g, '');
}

function parseAddressList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(part => extractEmailAddress(part))
    .filter(Boolean);
}

function collectParts(part: GmailPart | undefined): GmailPart[] {
  if (!part) return [];
  const parts = [part];
  for (const child of part.parts ?? []) {
    parts.push(...collectParts(child));
  }
  return parts;
}

function decodePartText(part: GmailPart | undefined): string {
  if (!part?.body?.data) return '';
  const mimeType = (part.mimeType ?? '').toLowerCase();
  const decoded = base64UrlDecode(part.body.data);
  if (mimeType === 'text/html') return stripHtml(decoded);
  return decoded.trim();
}

function findBestBody(part: GmailPart | undefined): string {
  if (!part) return '';

  const candidates = collectParts(part);
  const textPlain = candidates.find(child => (child.mimeType ?? '').toLowerCase() === 'text/plain');
  if (textPlain) {
    const decoded = decodePartText(textPlain);
    if (decoded) return decoded;
  }

  const textHtml = candidates.find(child => (child.mimeType ?? '').toLowerCase() === 'text/html');
  if (textHtml) {
    const decoded = decodePartText(textHtml);
    if (decoded) return decoded;
  }

  const inline = candidates.find(child => !!child.body?.data && (child.filename ?? '') === '');
  if (inline) {
    const decoded = decodePartText(inline);
    if (decoded) return decoded;
  }

  return '';
}

function extractAttachments(part: GmailPart | undefined): MessageAttachment[] {
  if (!part) return [];

  const attachments: MessageAttachment[] = [];
  for (const child of collectParts(part)) {
    const attachmentId = child.body?.attachmentId ?? '';
    const filename = child.filename ?? '';
    if (!attachmentId && !filename) continue;
    if ((child.mimeType ?? '').toLowerCase().startsWith('text/') && !attachmentId) continue;

    attachments.push({
      externalId: attachmentId || undefined,
      url: undefined,
      mimeType: child.mimeType || 'application/octet-stream',
      filename: filename || undefined,
    });
  }

  return attachments;
}

function getPartHeaders(part: GmailPart | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const header of part?.headers ?? []) {
    if (!header?.name) continue;
    out[header.name] = header.value ?? '';
  }
  return out;
}

function getHeader(part: GmailPart | undefined, name: string): string | undefined {
  return lowerHeaderLookup(getPartHeaders(part), name);
}

function normalizeContactFromAddressList(channel: 'gmail', addresses: string[], fallback: string): NormalizedContact {
  const email = addresses[0] ?? fallback;
  return {
    channel,
    externalId: email,
    handle: email,
    displayName: email,
  };
}

function normalizeGmailMessage(
  threadId: string,
  message: GmailMessage,
  accountEmail?: string,
): NormalizedMessage {
  const root = message.payload;
  const headers = getPartHeaders(root);
  const from = extractEmailAddress(headers.From);
  const to = parseAddressList(headers.To);
  const cc = parseAddressList(headers.Cc);
  const bcc = parseAddressList(headers.Bcc);
  const attachments = extractAttachments(root);
  const body = findBestBody(root) || message.snippet || undefined;
  const senderIsAccount = !!accountEmail && from && from.toLowerCase() === accountEmail.toLowerCase();
  const direction = senderIsAccount || (message.labelIds ?? []).includes('SENT') ? 'outbound' : 'inbound';

  return {
    id: message.id ?? crypto.randomUUID(),
    externalId: message.id,
    threadId,
    channel: 'gmail',
    direction,
    type: attachments.length > 0 ? 'file' : 'text',
    body,
    attachments: attachments.length > 0 ? attachments : undefined,
    sentAt: toIsoTimestamp(message.internalDate ?? Date.now()),
    status: (message.labelIds ?? []).includes('FAILED') ? 'failed' : direction === 'outbound' ? 'sent' : undefined,
    raw: {
      ...message,
      extractedHeaders: { from, to, cc, bcc },
    },
  };
}

function normalizeGmailThread(
  thread: GmailThread,
  accountEmail?: string,
): NormalizedThread {
  const messages = thread.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const lastHeaders = getPartHeaders(lastMessage?.payload);
  const firstRemoteMessage = messages.find(message => {
    const from = extractEmailAddress(getHeader(message.payload, 'From'));
    if (!from) return false;
    if (!accountEmail) return true;
    return from.toLowerCase() !== accountEmail.toLowerCase();
  }) ?? lastMessage ?? messages[0];

  const remoteFrom = extractEmailAddress(getHeader(firstRemoteMessage?.payload, 'From'));
  const subject = getHeader(lastMessage?.payload, 'Subject')
    ?? getHeader(messages[0]?.payload, 'Subject')
    ?? thread.snippet
    ?? undefined;

  return {
    id: thread.id ?? crypto.randomUUID(),
    channel: 'gmail',
    contact: normalizeContactFromAddressList('gmail', [remoteFrom].filter(Boolean), accountEmail ?? ''),
    lastMessageAt: lastMessage ? toIsoTimestamp(lastMessage.internalDate ?? Date.now()) : undefined,
    unreadCount: (messages ?? []).filter(message => (message.labelIds ?? []).includes('UNREAD')).length || undefined,
    subject,
    serviceWindowExpiresAt: undefined,
    outboundQuotaRemaining: undefined,
  };
}

function requireMimePayload(payload: OutboundMessagePayload): void {
  if (payload.type !== 'text' && payload.type !== 'file') {
    throw new GmailSendPayloadError(`Gmail sendMessage only supports text/file payloads in this adapter. Received '${payload.type}'.`);
  }
}

async function fetchJson(fetchImpl: typeof globalThis.fetch, url: string, init: RequestInit): Promise<any> {
  const response = await fetchImpl(url, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GmailApiError(json.error?.message ?? json.message ?? `Gmail API error ${response.status}`, response.status);
  }
  return json;
}

async function fetchBinary(fetchImpl: typeof globalThis.fetch, url: string): Promise<Buffer> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new GmailApiError(text || `Attachment fetch failed with status ${response.status}`, response.status);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function buildMimeBodyPart(contentType: string, content: string): string {
  return [
    `Content-Type: ${contentType}; charset="UTF-8"`,
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(Buffer.from(content, 'utf8').toString('base64')),
  ].join('\r\n');
}

function buildAttachmentPart(attachment: MessageAttachment, bytes: Buffer): string {
  const filename = attachment.filename ?? 'attachment.bin';
  const mimeType = attachment.mimeType || 'application/octet-stream';
  return [
    `Content-Type: ${mimeType}; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    wrapBase64(bytes.toString('base64')),
  ].join('\r\n');
}

function buildMimeMessage(args: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: Array<{ attachment: MessageAttachment; bytes: Buffer }>;
}): string {
  const headers: string[] = [
    'MIME-Version: 1.0',
    foldHeaderLine('To', args.to.join(', ')),
  ];

  if (args.cc?.length) {
    headers.push(foldHeaderLine('Cc', args.cc.join(', ')));
  }

  if (args.bcc?.length) {
    headers.push(foldHeaderLine('Bcc', args.bcc.join(', ')));
  }

  headers.push(foldHeaderLine('Subject', encodeMimeHeaderValue(args.subject || '')));

  if (args.inReplyTo) {
    headers.push(foldHeaderLine('In-Reply-To', args.inReplyTo));
  }

  if (args.references) {
    headers.push(foldHeaderLine('References', args.references));
  }

  const body = args.body ?? '';
  const hasAttachments = (args.attachments ?? []).length > 0;
  if (!hasAttachments) {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    headers.push('Content-Transfer-Encoding: base64');
    headers.push('');
    headers.push(wrapBase64(Buffer.from(body, 'utf8').toString('base64')));
    return headers.join('\r\n');
  }

  const boundary = `gmail_${crypto.randomUUID().replace(/-/g, '')}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  headers.push('');
  headers.push(`--${boundary}`);
  headers.push(buildMimeBodyPart('text/plain', body));

  for (const { attachment, bytes } of args.attachments ?? []) {
    headers.push(`--${boundary}`);
    headers.push(buildAttachmentPart(attachment, bytes));
  }

  headers.push(`--${boundary}--`);
  return headers.join('\r\n');
}

async function getAccessToken(config: GmailCredentials, fetchImpl: typeof globalThis.fetch): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    client_secret: config.GOOGLE_CLIENT_SECRET,
    refresh_token: config.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const response = await fetchImpl(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GmailApiError(json.error_description ?? json.error?.message ?? `OAuth token error ${response.status}`, response.status);
  }

  if (!json.access_token) {
    throw new GmailApiError('OAuth token response did not include an access_token.');
  }

  return String(json.access_token);
}

async function getAccountProfile(fetchImpl: typeof globalThis.fetch, accessToken: string): Promise<{ emailAddress: string }> {
  const profile = await fetchJson(fetchImpl, `${GMAIL_API_BASE}/users/me/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    emailAddress: String(profile.emailAddress ?? profile.email_address ?? ''),
  };
}

async function getThread(fetchImpl: typeof globalThis.fetch, accessToken: string, threadId: string): Promise<GmailThread> {
  return fetchJson(fetchImpl, `${GMAIL_API_BASE}/users/me/threads/${encodeURIComponent(threadId)}?format=full`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

async function getThreadSummary(fetchImpl: typeof globalThis.fetch, accessToken: string, threadId: string, accountEmail?: string): Promise<NormalizedThread> {
  const thread = await getThread(fetchImpl, accessToken, threadId);
  return normalizeGmailThread(thread, accountEmail);
}

async function resolveReplyContext(fetchImpl: typeof globalThis.fetch, accessToken: string, threadId: string, accountEmail?: string): Promise<{
  subject: string;
  to: string[];
  cc: string[];
  bcc: string[];
  inReplyTo?: string;
  references?: string;
}> {
  const thread = await getThread(fetchImpl, accessToken, threadId);
  const messages = thread.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const lastHeaders = getPartHeaders(lastMessage?.payload);
  const subject = lastHeaders.Subject || thread.snippet || `Re: ${threadId}`;
  const fromMessage = messages.find(message => {
    const from = extractEmailAddress(getHeader(message.payload, 'From'));
    if (!from) return false;
    if (!accountEmail) return true;
    return from.toLowerCase() !== accountEmail.toLowerCase();
  }) ?? lastMessage ?? messages[0];

  const remoteTo = parseAddressList(getHeader(fromMessage?.payload, 'To'))
    .concat(parseAddressList(getHeader(fromMessage?.payload, 'Cc')))
    .concat(parseAddressList(getHeader(fromMessage?.payload, 'From')))
    .filter(email => !accountEmail || email.toLowerCase() !== accountEmail.toLowerCase());

  const recipient = remoteTo.length > 0 ? remoteTo : parseAddressList(lastHeaders.To).filter(email => !accountEmail || email.toLowerCase() !== accountEmail.toLowerCase());
  const inReplyTo = getHeader(lastMessage?.payload, 'Message-ID');
  const references = [getHeader(lastMessage?.payload, 'References'), inReplyTo].filter(Boolean).join(' ').trim() || undefined;

  return {
    subject,
    to: recipient,
    cc: [],
    bcc: [],
    inReplyTo,
    references,
  };
}

async function buildSendRequest(
  config: GmailCredentials,
  fetchImpl: typeof globalThis.fetch,
  threadId: string,
  payload: OutboundMessagePayload,
): Promise<GmailSendRequest> {
  requireMimePayload(payload);
  const accessToken = await getAccessToken(config, fetchImpl);
  const profile = await getAccountProfile(fetchImpl, accessToken);
  const replyContext = await resolveReplyContext(fetchImpl, accessToken, threadId, profile.emailAddress);

  const subject = payload.headers?.subject ?? replyContext.subject;
  if (!replyContext.to.length) {
    throw new GmailSendPayloadError('Unable to derive Gmail recipients from the target thread. Provide a thread that already has remote participants.');
  }

  const attachments: Array<{ attachment: MessageAttachment; bytes: Buffer }> = [];
  for (const attachment of payload.attachments ?? []) {
    if (attachment.url) {
      const bytes = await fetchBinary(fetchImpl, attachment.url);
      attachments.push({ attachment, bytes });
      continue;
    }
    throw new GmailSendPayloadError('Gmail attachments require a downloadable url in this adapter. externalId alone is not enough to assemble MIME.');
  }

  const mime = buildMimeMessage({
    to: replyContext.to,
    cc: payload.headers?.cc ?? replyContext.cc,
    bcc: payload.headers?.bcc ?? replyContext.bcc,
    subject,
    body: payload.body ?? '',
    inReplyTo: replyContext.inReplyTo,
    references: replyContext.references,
    attachments,
  });

  return {
    endpoint: `${GMAIL_API_BASE}/users/me/messages/send`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: {
      raw: base64UrlEncode(mime),
      threadId,
    },
    mime,
  };
}

async function fullSyncMailbox(
  fetchImpl: typeof globalThis.fetch,
  accessToken: string,
  accountEmail?: string,
): Promise<NormalizedMessage[]> {
  const threadsPage = await fetchJson(fetchImpl, `${GMAIL_API_BASE}/users/me/threads?maxResults=100&q=in%3Ainbox`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const out: NormalizedMessage[] = [];
  for (const threadRef of threadsPage.threads ?? []) {
    const thread = await getThread(fetchImpl, accessToken, String(threadRef.id));
    for (const message of thread.messages ?? []) {
      out.push(normalizeGmailMessage(String(thread.id ?? threadRef.id), message, accountEmail));
    }
  }

  return out;
}

async function reconcileGmailNotification(
  config: GmailCredentials,
  fetchImpl: typeof globalThis.fetch,
  notification: GmailPubSubNotification,
): Promise<GmailSyncResult> {
  const accessToken = await getAccessToken(config, fetchImpl);
  const profile = await getAccountProfile(fetchImpl, accessToken);
  const uniqueMessages = new Map<string, NormalizedMessage>();

  try {
    const history = await fetchJson(
      fetchImpl,
      `${GMAIL_API_BASE}/users/me/history?startHistoryId=${encodeURIComponent(notification.historyId)}&historyTypes=messageAdded`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    for (const item of history.history ?? []) {
      for (const added of item.messagesAdded ?? []) {
        const messageId = String(added.message?.id ?? added.message?.messageId ?? added.messageId ?? '');
        if (!messageId || uniqueMessages.has(messageId)) continue;
        const message = await fetchJson(fetchImpl, `${GMAIL_API_BASE}/users/me/messages/${encodeURIComponent(messageId)}?format=full`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        uniqueMessages.set(messageId, normalizeGmailMessage(String(message.threadId ?? message.threadId), message, profile.emailAddress));
      }
    }

    return {
      emailAddress: notification.emailAddress,
      historyId: String(history.historyId ?? notification.historyId),
      fullSync: false,
      messages: [...uniqueMessages.values()],
    };
  } catch (error: any) {
    if (!(error instanceof GmailApiError) || error.status !== 404) {
      throw error;
    }

    const messages = await fullSyncMailbox(fetchImpl, accessToken, profile.emailAddress);
    return {
      emailAddress: notification.emailAddress,
      historyId: notification.historyId,
      fullSync: true,
      messages,
    };
  }
}

async function renewGmailWatchRequest(
  config: GmailCredentials,
  fetchImpl: typeof globalThis.fetch,
): Promise<GmailWatchResult> {
  const topicName = config.GMAIL_PUBSUB_TOPIC?.trim();
  if (!topicName) {
    throw new GmailSendPayloadError('GMAIL_PUBSUB_TOPIC is required to renew a Gmail watch.');
  }

  const accessToken = await getAccessToken(config, fetchImpl);
  const profile = await getAccountProfile(fetchImpl, accessToken);
  const result = await fetchJson(fetchImpl, `${GMAIL_API_BASE}/users/me/watch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topicName,
    }),
  });

  return {
    emailAddress: profile.emailAddress,
    historyId: String(result.historyId ?? ''),
    expiration: result.expiration ? String(result.expiration) : undefined,
    topicName,
  };
}

type GmailHeader = { name?: string; value?: string };
type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    size?: number;
    data?: string;
    attachmentId?: string;
  };
  parts?: GmailPart[];
};
type GmailMessage = {
  id?: string;
  threadId?: string;
  historyId?: string;
  internalDate?: string | number;
  labelIds?: string[];
  snippet?: string;
  payload?: GmailPart;
};
type GmailThread = {
  id?: string;
  historyId?: string;
  snippet?: string;
  messages?: GmailMessage[];
};

export class GmailAdapter implements MessagingAdapter {
  private readonly config: GmailCredentials;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(credentials: Record<string, string>, options: { fetch?: typeof globalThis.fetch } = {}) {
    this.config = requireConfig(credentials);
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      const accessToken = await getAccessToken(this.config, this.fetchImpl);
      const profile = await getAccountProfile(this.fetchImpl, accessToken);
      return { ok: true, message: profile.emailAddress ? `Connected as ${profile.emailAddress}` : 'Gmail configuration loaded.' };
    } catch (error: any) {
      return { ok: false, message: error?.message ?? String(error) };
    }
  }

  async listThreads(params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedThread>> {
    const accessToken = await getAccessToken(this.config, this.fetchImpl);
    const profile = await getAccountProfile(this.fetchImpl, accessToken);
    const page = await fetchJson(this.fetchImpl, `${GMAIL_API_BASE}/users/me/threads?maxResults=${Math.min(Math.max(params?.limit ?? 20, 1), 100)}${params?.cursor ? `&pageToken=${encodeURIComponent(params.cursor)}` : ''}&q=in%3Ainbox`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const items = [];
    for (const threadRef of page.threads ?? []) {
      items.push(await getThreadSummary(this.fetchImpl, accessToken, String(threadRef.id), profile.emailAddress));
    }

    return {
      items,
      nextCursor: page.nextPageToken ? String(page.nextPageToken) : undefined,
    };
  }

  async listMessages(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedMessage>> {
    const accessToken = await getAccessToken(this.config, this.fetchImpl);
    const profile = await getAccountProfile(this.fetchImpl, accessToken);
    const thread = await getThread(this.fetchImpl, accessToken, threadId);
    const messages = thread.messages ?? [];
    const start = params?.cursor ? Number.parseInt(params.cursor, 10) : 0;
    const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const slice = messages.slice(safeStart, safeStart + limit);

    return {
      items: slice.map(message => normalizeGmailMessage(String(thread.id ?? threadId), message, profile.emailAddress)),
      nextCursor: safeStart + limit < messages.length ? String(safeStart + limit) : undefined,
    };
  }

  async sendMessage(threadId: string, payload: OutboundMessagePayload): Promise<NormalizedMessage> {
    const request = await buildSendRequest(this.config, this.fetchImpl, threadId, payload);
    const result = await fetchJson(this.fetchImpl, request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });

    return {
      id: crypto.randomUUID(),
      externalId: result.id ?? result.messageId ?? result.message_id ?? undefined,
      threadId,
      channel: 'gmail',
      direction: 'outbound',
      type: payload.attachments?.length ? 'file' : 'text',
      body: payload.body,
      attachments: payload.attachments?.length ? payload.attachments : undefined,
      sentAt: new Date().toISOString(),
      status: 'sent',
      raw: {
        request: request.body,
        response: result,
      },
    };
  }

  async syncFromPubSub(notification: GmailPubSubNotification): Promise<GmailSyncResult> {
    return reconcileGmailNotification(this.config, this.fetchImpl, notification);
  }
}

export async function reconcileGmailPubSubNotification(
  credentials: Record<string, string>,
  notification: GmailPubSubNotification,
  options: { fetch?: typeof globalThis.fetch } = {},
): Promise<GmailSyncResult> {
  const config = requireConfig(credentials);
  return reconcileGmailNotification(config, options.fetch ?? globalThis.fetch.bind(globalThis), notification);
}

export async function renewGmailWatch(
  credentials: Record<string, string>,
  options: { fetch?: typeof globalThis.fetch } = {},
): Promise<GmailWatchResult> {
  const config = requireConfig(credentials);
  return renewGmailWatchRequest(config, options.fetch ?? globalThis.fetch.bind(globalThis));
}

export function buildGmailSendRequest(
  credentials: Record<string, string>,
  threadId: string,
  payload: OutboundMessagePayload,
  options: { fetch?: typeof globalThis.fetch } = {},
): Promise<GmailSendRequest> {
  const config = requireConfig(credentials);
  return buildSendRequest(config, options.fetch ?? globalThis.fetch.bind(globalThis), threadId, payload);
}

export function previewGmailSendMessage(
  credentials: Record<string, string>,
  threadId: string,
  payload: OutboundMessagePayload,
  options: { fetch?: typeof globalThis.fetch } = {},
): Promise<GmailSendRequest> {
  return buildGmailSendRequest(credentials, threadId, payload, options);
}
