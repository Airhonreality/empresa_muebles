/**
 * ConversionAdapter — contrato provider-agnostic para reportar conversiones
 * de vuelta a plataformas de pauta (Google Ads, Meta Ads, ...) cuando un
 * lead capturado en storage/db cierra como venta real — a menudo dias o
 * semanas despues del clic original.
 *
 * v2 (2026-07-03) — ajustado con los hallazgos cerrados de
 * ../_research/ad_conversions_2026.md. CAMBIO DE RESPONSABILIDAD respecto a
 * v1: el adapter ahora RECIBE los datos de usuario en crudo y es el
 * responsable de normalizar + hashear (SHA-256) justo antes de transmitir.
 * Razon: las reglas de normalizacion difieren por plataforma (Google exige
 * quitar puntos y sufijos '+' en cuentas de Gmail antes del hash — hashear
 * upstream con otra regla rompe el matching), y Meta exige IP/user-agent
 * SIN cifrar para sostener el Event Match Quality. Invariante que se
 * conserva: el PII jamas se transmite en claro a la plataforma, jamas se
 * loguea y jamas se persiste por el adapter.
 *
 * Los ids de destino (cuenta operativa y conversion action de Google;
 * dataset id y system token de Meta) NO viajan en el evento: son
 * configuracion del adapter via env vars del manifest (fork single-tenant).
 *
 * Sin macro-modulo propio: esta capability se invoca directo desde un zap
 * del fork (ej. cuando un lead pasa a "vendido") — pero el codigo del
 * adapter corre en src/app/api/, nunca dentro del zap (sandbox sin fetch).
 */

export type ConversionEventType = 'lead' | 'qualified_lead' | 'purchase' | (string & {});

/**
 * Datos de usuario EN CRUDO. El adapter normaliza y hashea segun su
 * plataforma. `clientIpAddress`/`clientUserAgent` se transmiten sin cifrar
 * (requisito de Meta para el matching) — capturarlos en la sesion original.
 */
export interface RawUserData {
  email?: string;
  /** Formato E.164 (con codigo de pais, sin espacios ni guiones). */
  phone?: string;
  firstName?: string;
  lastName?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

/** Artefactos de atribucion capturados en la sesion del clic original. */
export interface CampaignAttribution {
  gclid?: string;
  /**
   * Timestamp when the click was captured. Google Ads uses this to enforce the
   * 90/63 day reporting windows locally before the adapter calls the API.
   */
  gclidCapturedAt?: string | number;
  /**
   * Click id de Meta tal como llega en la URL. El adapter de Meta lo
   * sintetiza al formato `fbc` (`fb.1.<timestampMs>.<fbclid>`) — idealmente
   * capturar tambien la cookie `_fbp` y el timestamp de captura del clic
   * en el momento del lead para construirlo sin ambiguedad.
   */
  fbclid?: string;
  /** Timestamp ISO 8601 o epoch ms de cuando se capturo el fbclid. */
  fbclidCapturedAt?: string | number;
  /** Cookie `_fbp` persistente del navegador, si se capturo. */
  fbp?: string;
}

export interface ConversionEvent {
  /**
   * Id unico del evento — clave de deduplicacion cliente/servidor (Meta) y
   * `transactionId` (Google). SIEMPRE string, en todos los canales: la
   * deduplicacion de Meta falla si un canal lo envia como numero.
   */
  eventId: string;
  eventType: ConversionEventType;
  /**
   * Cuando ocurrio la conversion real, ISO 8601 CON offset de zona horaria.
   * Cada adapter lo transforma a su formato (Meta: epoch en segundos) y
   * aplica margen contra clock skew (Google rechaza eventos "del futuro").
   */
  occurredAt: string;
  value?: number;
  currency?: string;
  userData?: RawUserData;
  attribution: CampaignAttribution;
  actionSource?: 'website' | 'physical_store' | 'system_generated';
  raw?: Record<string, unknown>;
}

export interface ConversionResult {
  id: string;
  /** 'throttled' = limite de tasa de la plataforma — reintentar con backoff. */
  status: 'accepted' | 'rejected' | 'throttled' | 'pending';
  /** Id/recibo devuelto por la plataforma, si aplica — para diagnostico. */
  externalId?: string;
  raw?: Record<string, unknown>;
}

/**
 * Contrato que cada src/integrations/<id>/adapter.ts de esta capability debe
 * implementar (manifest `kind: 'other'` mientras el seed no tenga
 * 'ad-conversion').
 */
export interface ConversionAdapter {
  reportConversion(event: ConversionEvent): Promise<ConversionResult>;
  /**
   * Envio por lotes (Meta acepta hasta 1000 eventos por request; Google
   * recomienda batching contra las cuotas de GCP). Opcional: si falta, el
   * caller itera reportConversion.
   */
  reportConversions?(events: ConversionEvent[]): Promise<ConversionResult[]>;
}
