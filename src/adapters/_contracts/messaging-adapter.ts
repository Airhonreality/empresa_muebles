/**
 * MessagingAdapter — contrato provider-agnostic para el modulo de bandeja
 * de entrada multicanal (WhatsApp, Meta/Instagram, TikTok, Gmail, ...).
 *
 * v2 (2026-07-03) — ajustado con los hallazgos cerrados de
 * ../_research/messaging_2026.md: attachments multiples tipados, metadatos de
 * ventana de servicio por hilo, etiqueta human_agent, headers RFC 2822 para
 * correo, y verificacion de webhook sobre el cuerpo crudo (raw body).
 *
 * Implementacion: cada proveedor vive en src/integrations/<id>/adapter.ts
 * (subsistema de adapters del seed) con manifest.ts `kind: 'messaging'`,
 * `permissions: { network: 'outbound-api', runsOutsideSandbox: true }`.
 * Las rutas de webhook viven bajo src/app/api/ — nunca en un zap.
 */

export type MessageChannel = 'whatsapp' | 'messenger' | 'instagram' | 'tiktok' | 'gmail' | (string & {});

export type MessageDirection = 'inbound' | 'outbound';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'template' | 'interactive' | 'system';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageAttachment {
  /**
   * Id del asset en el proveedor (media_id de WhatsApp, asset_id de
   * Instagram). Puede requerir una llamada secundaria a la Graph API para
   * resolverse a una URL de descarga temporal.
   */
  externalId?: string;
  /**
   * URL de descarga. A menudo efimera (los links de Meta caducan en 24h):
   * el consumidor debe persistir el binario al procesar el webhook.
   */
  url?: string;
  /** Obligatorio para ensamblar MIME (Gmail) y para enviar documentos (WhatsApp). */
  mimeType: string;
  filename?: string;
}

export interface NormalizedContact {
  channel: MessageChannel;
  /** Id del contacto en el sistema del proveedor (phone id, PSID/IGSID, user id, email, ...). */
  externalId: string;
  displayName?: string;
  /** Telefono, @usuario, email — lo que el canal use como handle visible. */
  handle?: string;
}

export interface NormalizedMessage {
  /** Id interno (namespace de storage/db, no del proveedor). */
  id: string;
  /** Id del mensaje en el sistema del proveedor, si aplica. */
  externalId?: string;
  threadId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  type: MessageType;
  body?: string;
  attachments?: MessageAttachment[];
  /** ISO 8601. */
  sentAt: string;
  status?: MessageStatus;
  /** Payload crudo del proveedor — escape hatch para datos no normalizados todavia. */
  raw?: Record<string, unknown>;
}

export interface NormalizedThread {
  id: string;
  channel: MessageChannel;
  contact: NormalizedContact;
  lastMessageAt?: string;
  unreadCount?: number;
  /** Solo canales de correo (gmail): asunto del hilo. */
  subject?: string;
  /**
   * Cuando expira la ventana de servicio del canal (ISO 8601):
   * 24h en Meta/WhatsApp, 48h en TikTok. Fuera de la ventana el envio de
   * texto libre sera rechazado por el proveedor.
   */
  serviceWindowExpiresAt?: string;
  /** Mensajes salientes restantes antes del bloqueo del canal (TikTok: 10 continuos por ventana). */
  outboundQuotaRemaining?: number;
}

export interface OutboundMessagePayload {
  type: MessageType;
  body?: string;
  attachments?: MessageAttachment[];
  /** Para tipos 'template'/'interactive': id o nombre de plantilla del proveedor. */
  templateRef?: string;
  templateParams?: Record<string, string>;
  /**
   * Unica etiqueta vigente en Meta (desde abr-2026) para extender la ventana
   * de 24h a 7 dias. Meta la audita: solo respuestas de agentes humanos
   * reales — usarla para automatizacion causa bloqueo permanente de la app.
   * El adapter la mapea al literal del proveedor ('HUMAN_AGENT').
   */
  messageTag?: 'human_agent';
  /** Headers RFC 2822 — solo canales de correo (gmail). */
  headers?: {
    subject?: string;
    cc?: string[];
    bcc?: string[];
  };
}

export interface ListPage<T> {
  items: T[];
  nextCursor?: string;
}

/**
 * Espejo local de hilos/mensajes para canales push-only: WhatsApp y TikTok
 * no exponen endpoints de listado — su unica fuente entrante es el webhook.
 * El macro modulo (inbox) provee la implementacion real sobre storage/db; el
 * CLI puede usar una implementacion efimera en memoria. Los adapters de esos
 * canales reciben un MessageStore inyectado en su constructor y sus
 * listThreads/listMessages delegan en el; los canales con listado nativo
 * (gmail, meta) consultan al proveedor directamente.
 */
export interface MessageStore {
  upsertThread(thread: NormalizedThread): Promise<void>;
  upsertMessage(message: NormalizedMessage): Promise<void>;
  listThreads(params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedThread>>;
  listMessages(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedMessage>>;
}

/**
 * Contrato que cada src/integrations/<id>/adapter.ts de esta capability debe
 * implementar. Los tres metodos de webhook son opcionales porque el modelo
 * varia por canal (Gmail usa Pub/Sub + polling de history, no webhooks
 * directos; TikTok firma con HMAC, Meta con handshake GET + X-Hub-Signature).
 */
export interface MessagingAdapter {
  listThreads(params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedThread>>;
  listMessages(threadId: string, params?: { cursor?: string; limit?: number }): Promise<ListPage<NormalizedMessage>>;
  sendMessage(threadId: string, payload: OutboundMessagePayload): Promise<NormalizedMessage>;

  /**
   * Normaliza un evento entrante en 0+ mensajes. Recibe el cuerpo CRUDO
   * (antes de JSON.parse) porque un mismo POST puede traer N mensajes
   * anidados y porque la verificacion de firma necesita el texto exacto.
   */
  handleWebhook?(rawBody: string, headers: Record<string, string>): Promise<NormalizedMessage[]>;

  /**
   * Verifica la firma criptografica del evento sobre el cuerpo crudo
   * (X-Hub-Signature-256 de Meta, TikTok-Signature t=/s= con HMAC-SHA256 y
   * tolerancia de 5s). Nunca parsear el body antes de verificar.
   */
  verifyWebhook?(rawBody: string, headers: Record<string, string>): boolean;

  /**
   * Resuelve el handshake GET de suscripcion (hub.mode/hub.challenge/
   * hub.verify_token de Meta/WhatsApp). Devuelve el string de respuesta
   * esperado, o null si la verificacion falla.
   */
  resolveWebhookChallenge?(query: Record<string, string>): string | null;
}
