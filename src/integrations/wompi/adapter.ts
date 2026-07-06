import crypto from 'crypto';
import type {
  ChargeRequest,
  ChargeResult,
  PaymentAdapter,
  PaymentMethodInput,
  PaymentStatus,
  RefundRequest,
} from '@/adapters/_contracts/payment-adapter';

const WOMPI_API_BASE_URLS = {
  sandbox: 'https://sandbox.wompi.co/v1',
  production: 'https://production.wompi.co/v1',
} as const;

type WompiEnvironment = keyof typeof WOMPI_API_BASE_URLS;

type WompiCredentials = {
  WOMPI_PUBLIC_KEY: string;
  WOMPI_PRIVATE_KEY: string;
  WOMPI_EVENTS_SECRET: string;
  WOMPI_ENV: WompiEnvironment;
};

type WompiChargePayload = {
  amount_in_cents: number;
  currency: string;
  reference: string;
  customer_data: {
    full_name: string;
    email: string;
    document_type?: string;
    document_number?: string;
    phone_number?: string;
  };
  legal_tokens: {
    acceptance_token: string;
    accept_personal_auth?: string;
  };
  fraud_session_id: string;
  redirect_url?: string;
  metadata?: Record<string, string>;
  payment_method: {
    type: string;
    token?: string;
    installments?: number;
    bank_code?: string;
    user_type?: 'natural' | 'legal';
    phone_number?: string;
  };
};

export class WompiConfigurationError extends Error {
  code = 'WOMPI_CONFIGURATION_ERROR' as const;
  missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(`Missing required Wompi configuration: ${missingKeys.join(', ')}`);
    this.name = 'WompiConfigurationError';
    this.missingKeys = missingKeys;
  }
}

export class WompiValidationError extends Error {
  code = 'WOMPI_VALIDATION_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'WompiValidationError';
  }
}

export class WompiWebhookError extends Error {
  code = 'WOMPI_WEBHOOK_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'WompiWebhookError';
  }
}

export class WompiApiError extends Error {
  code = 'WOMPI_API_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'WompiApiError';
  }
}

export class WompiRefundNotSupportedError extends Error {
  code = 'WOMPI_REFUND_DISABLED' as const;

  constructor() {
    super('Wompi refund is disabled in this adapter because the current API contract does not confirm a safe refund flow for this integration.');
    this.name = 'WompiRefundNotSupportedError';
  }
}

const processedWebhookKeys = new Set<string>();

function requireConfig(credentials: Record<string, string>): WompiCredentials {
  const missingKeys = ['WOMPI_PUBLIC_KEY', 'WOMPI_PRIVATE_KEY', 'WOMPI_EVENTS_SECRET'].filter(key => !credentials[key]);

  if (missingKeys.length > 0) {
    throw new WompiConfigurationError(missingKeys);
  }

  const env = (credentials.WOMPI_ENV || 'sandbox').toLowerCase();

  return {
    WOMPI_PUBLIC_KEY: credentials.WOMPI_PUBLIC_KEY,
    WOMPI_PRIVATE_KEY: credentials.WOMPI_PRIVATE_KEY,
    WOMPI_EVENTS_SECRET: credentials.WOMPI_EVENTS_SECRET,
    WOMPI_ENV: env === 'production' ? 'production' : 'sandbox',
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

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function getPathValue(source: unknown, path: string): unknown {
  if (!source || typeof source !== 'object') return undefined;
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function toHexBuffer(hex: string): Buffer {
  const normalized = hex.trim().toLowerCase();
  return Buffer.from(normalized.length % 2 === 0 ? normalized : `0${normalized}`, 'hex');
}

function compareHex(left: string, right: string): boolean {
  const leftBuffer = toHexBuffer(left);
  const rightBuffer = toHexBuffer(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function computeWebhookChecksum(body: Record<string, unknown>, secret: string): string | null {
  const signature = body.signature as Record<string, unknown> | undefined;
  const properties = Array.isArray(signature?.properties)
    ? (signature.properties as unknown[]).map(property => String(property))
    : [];
  const checksum = toStringValue(signature?.checksum);
  const timestamp = toStringValue(signature?.timestamp ?? body.timestamp ?? body.created_at ?? body.createdAt);

  if (!properties.length || !timestamp) {
    return checksum || null;
  }

  const payload = `${properties.map(property => toStringValue(getPathValue(body, property))).join('')}${timestamp}${secret}`;
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  switch (String(value ?? '').toLowerCase()) {
    case 'approved':
      return 'approved';
    case 'declined':
      return 'declined';
    case 'voided':
      return 'voided';
    case 'refunded':
      return 'refunded';
    case 'pending':
      return 'pending';
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'failed';
  }
}

function normalizeTransaction(record: Record<string, unknown>, fallback?: Partial<ChargeRequest>): ChargeResult {
  const externalId = toStringValue(record.id ?? record.external_id ?? record.externalId) || undefined;
  const status = normalizePaymentStatus(record.status ?? record.transaction_status ?? record.transactionStatus);
  const amountInCents = Number(record.amount_in_cents ?? record.amountInCents ?? fallback?.amountInCents ?? 0);
  const currency = toStringValue(record.currency ?? fallback?.currency ?? 'COP') || 'COP';
  const paymentMethod = record.payment_method;
  const paymentMethodType = String(
    paymentMethod && typeof paymentMethod === 'object'
      ? (paymentMethod as Record<string, unknown>).type ?? record.payment_method_type ?? ''
      : record.payment_method_type ?? '',
  ).toUpperCase();
  const checkoutUrl = toStringValue(
    record.checkout_url
    ?? record.checkoutUrl
    ?? record.redirect_url
    ?? record.redirectUrl
    ?? record.payment_link_url
    ?? record.paymentLinkUrl,
  ) || undefined;

  const nextAction = (() => {
    if (status !== 'pending') return undefined;

    if (paymentMethodType === 'NEQUI') {
      return {
        type: 'awaiting_push_notification' as const,
        instructions: 'Autoriza el pago en la app de Nequi para completar la transacción.',
      };
    }

    if (paymentMethodType === 'PSE') {
      return {
        type: 'redirect_to_bank' as const,
        instructions: 'Completa la redirección bancaria para finalizar el pago por PSE.',
      };
    }

    if (paymentMethodType === 'CASH') {
      return {
        type: 'cash_payment_instructions' as const,
        instructions: 'Sigue las instrucciones de pago en efectivo emitidas por Wompi.',
      };
    }

    return undefined;
  })();

  return {
    id: crypto.randomUUID(),
    externalId,
    status,
    amountInCents: Number.isFinite(amountInCents) ? amountInCents : Number(fallback?.amountInCents ?? 0),
    currency,
    checkoutUrl,
    nextAction: nextAction ?? (paymentMethodType === 'PSE' && checkoutUrl
      ? {
        type: 'redirect_to_bank',
        instructions: 'Completa la redirección bancaria para finalizar el pago por PSE.',
      }
      : undefined),
    raw: record,
  };
}

function buildMethodPayload(method: PaymentMethodInput): WompiChargePayload['payment_method'] {
  switch (method.type) {
    case 'card':
      return {
        type: 'CARD',
        token: method.token,
        installments: method.installments,
      };
    case 'pse':
      return {
        type: 'PSE',
        bank_code: method.bankCode,
        user_type: method.userType,
      };
    case 'nequi':
      return {
        type: 'NEQUI',
        phone_number: method.phoneNumber,
      };
    case 'cash':
      return {
        type: 'CASH',
      };
  }
}

function assertRequestShape(request: ChargeRequest): void {
  if (!Number.isInteger(request.amountInCents) || request.amountInCents <= 0) {
    throw new WompiValidationError('amountInCents must be a positive integer in cents.');
  }

  if (!request.reference.trim()) {
    throw new WompiValidationError('reference is required.');
  }

  if (!request.customer.email.trim()) {
    throw new WompiValidationError('customer.email is required.');
  }

  if (!request.customer.name.trim()) {
    throw new WompiValidationError('customer.name is required.');
  }

  if (!request.legalTokens?.acceptanceToken?.trim()) {
    throw new WompiValidationError('legalTokens.acceptanceToken is required.');
  }

  if (!request.legalTokens?.acceptPersonalAuth?.trim()) {
    throw new WompiValidationError('legalTokens.acceptPersonalAuth is required.');
  }

  if (!request.fraudSessionId?.trim()) {
    throw new WompiValidationError('fraudSessionId is required.');
  }

  if (request.method.type === 'card') {
    if (!request.method.token?.trim()) {
      throw new WompiValidationError('method.token is required for card payments.');
    }

    if (!Number.isInteger(request.method.installments) || request.method.installments <= 0) {
      throw new WompiValidationError('method.installments must be a positive integer for card payments.');
    }
  }

  if (request.method.type === 'pse') {
    if (!request.method.bankCode.trim()) {
      throw new WompiValidationError('method.bankCode is required for PSE payments.');
    }

    if (!request.customer.documentType?.trim() || !request.customer.documentId?.trim()) {
      throw new WompiValidationError('customer.documentType and customer.documentId are required for PSE payments.');
    }

    if (!request.redirectUrl?.trim()) {
      throw new WompiValidationError('redirectUrl is required for PSE payments.');
    }
  }

  if (request.method.type === 'nequi' && !request.method.phoneNumber.trim()) {
    throw new WompiValidationError('method.phoneNumber is required for Nequi payments.');
  }
}

function buildChargePayload(request: ChargeRequest): WompiChargePayload {
  assertRequestShape(request);

  return {
    amount_in_cents: request.amountInCents,
    currency: request.currency,
    reference: request.reference,
    customer_data: {
      full_name: request.customer.name,
      email: request.customer.email,
      document_type: request.customer.documentType,
      document_number: request.customer.documentId,
      phone_number: request.customer.phone,
    },
    legal_tokens: {
      acceptance_token: request.legalTokens!.acceptanceToken,
      accept_personal_auth: request.legalTokens?.acceptPersonalAuth,
    },
    fraud_session_id: request.fraudSessionId!,
    redirect_url: request.redirectUrl,
    metadata: request.metadata,
    payment_method: buildMethodPayload(request.method),
  };
}

async function fetchJson(fetchImpl: typeof globalThis.fetch, url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetchImpl(url, init);
  const json = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok) {
    const message = toStringValue((json as Record<string, unknown>).message ?? (json as Record<string, unknown>).error) || `Wompi API error ${response.status}`;
    throw new WompiApiError(message);
  }
  return json as Record<string, unknown>;
}

function getTransactionEnvelope(response: Record<string, unknown>): Record<string, unknown> {
  if (response.data && typeof response.data === 'object') {
    const data = response.data as Record<string, unknown>;
    if (data.transaction && typeof data.transaction === 'object') return data.transaction as Record<string, unknown>;
    return data;
  }
  if (response.transaction && typeof response.transaction === 'object') {
    return response.transaction as Record<string, unknown>;
  }
  return response;
}

function webhookEventKey(body: Record<string, unknown>, headers: Record<string, string>): string {
  const signature = body.signature as Record<string, unknown> | undefined;
  const checksum = toStringValue(signature?.checksum) || getHeader(headers, 'X-Event-Checksum') || '';
  const event = toStringValue(body.event ?? body.type ?? body.event_type ?? body.eventType);
  const transaction = getTransactionEnvelope(body);
  const transactionId = toStringValue(transaction.id ?? body.id ?? body.data_id);
  const status = toStringValue(transaction.status ?? body.status);

  return checksum || [event, transactionId, status].filter(Boolean).join(':');
}

export class WompiAdapter implements PaymentAdapter {
  private readonly config: WompiCredentials;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(credentials: Record<string, string>, options: { fetch?: typeof globalThis.fetch } = {}) {
    this.config = requireConfig(credentials);
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: 'Wompi configuration loaded.' };
  }

  private get baseUrl(): string {
    return WOMPI_API_BASE_URLS[this.config.WOMPI_ENV];
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.WOMPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const payload = buildChargePayload(request);
    const response = await fetchJson(this.fetchImpl, `${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(payload),
    });

    return normalizeTransaction(getTransactionEnvelope(response), request);
  }

  async getResult(chargeId: string): Promise<ChargeResult> {
    if (!chargeId.trim()) {
      throw new WompiValidationError('chargeId is required.');
    }

    const response = await fetchJson(this.fetchImpl, `${this.baseUrl}/transactions/${encodeURIComponent(chargeId)}`, {
      method: 'GET',
      headers: this.authHeaders(),
    });

    return normalizeTransaction(getTransactionEnvelope(response));
  }

  async refund(_request: RefundRequest): Promise<ChargeResult> {
    throw new WompiRefundNotSupportedError();
  }

  async handleWebhook(rawBody: string, headers: Record<string, string>): Promise<ChargeResult[]> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw new WompiWebhookError('Webhook body is not valid JSON.');
    }

    const key = webhookEventKey(parsed, headers);
    if (processedWebhookKeys.has(key)) {
      return [];
    }

    const transaction = getTransactionEnvelope(parsed);
    const transactionId = toStringValue(transaction.id);
    if (!transactionId) {
      return [];
    }

    processedWebhookKeys.add(key);
    return [normalizeTransaction(transaction)];
  }

  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return false;
    }

    const expected = computeWebhookChecksum(parsed, this.config.WOMPI_EVENTS_SECRET);
    if (!expected) return false;

    const checksumHeader = getHeader(headers, 'X-Event-Checksum');
    const bodyChecksum = toStringValue((parsed.signature as Record<string, unknown> | undefined)?.checksum);

    if (checksumHeader && compareHex(expected, checksumHeader)) return true;
    if (bodyChecksum && compareHex(expected, bodyChecksum)) return true;
    return false;
  }
}

export function previewWompiChargeRequest(
  credentials: Record<string, string>,
  request: ChargeRequest,
): WompiChargePayload {
  void credentials;
  return buildChargePayload(request);
}
