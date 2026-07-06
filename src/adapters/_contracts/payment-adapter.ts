/**
 * PaymentAdapter — contrato provider-agnostic para pasarelas de pago
 * (nacionales e internacionales).
 *
 * v2 (2026-07-03) — ajustado con los hallazgos cerrados de
 * ../_research/payments_co_2026.md (Parte 3): montos siempre en centavos,
 * metodo de pago como union discriminada (card exige token + cuotas, PSE
 * exige banco + tipo de persona), tokens legales/anti-fraude de Wompi,
 * estados asincronos con nextAction (push de Nequi, redireccion PSE), y
 * verificacion de webhook sobre el cuerpo crudo (el HMAC-SHA256 de Wompi se
 * calcula sobre el texto exacto, antes de JSON.parse).
 *
 * Implementacion: cada proveedor vive en src/integrations/<id>/adapter.ts
 * (subsistema de adapters del seed) con manifest.ts `kind: 'payment'`,
 * `permissions: { network: 'outbound-api', runsOutsideSandbox: true }`.
 * Las rutas de webhook viven bajo src/app/api/ — nunca en un zap.
 */

export type Currency = 'COP' | 'USD' | (string & {});

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'refunded' | 'failed';

/** Tipos de documento exigidos por reguladores en LATAM (cedula, extranjeria, NIT, pasaporte). */
export type DocumentType = 'cc' | 'ce' | 'nit' | 'pp' | (string & {});

export interface PaymentCustomer {
  name: string;
  email: string;
  documentType?: DocumentType;
  /** Cedula/NIT/RUT/etc — requerido por varias pasarelas nacionales (ej. PSE). */
  documentId?: string;
  phone?: string;
}

/**
 * Union discriminada por instrumento: cada metodo exige datos distintos.
 * 'card' recibe un token generado en el cliente (widget/libreria JS del
 * proveedor) — el backend nunca ve el PAN. 'installments' (cuotas) es
 * obligatorio para tarjetas en LATAM.
 */
export type PaymentMethodInput =
  | { type: 'card'; token: string; installments: number }
  | { type: 'pse'; bankCode: string; userType: 'natural' | 'legal' }
  | { type: 'nequi'; phoneNumber: string }
  | { type: 'cash' };

export interface ChargeRequest {
  /** Monto en la menor unidad de la moneda (centavos) para evitar errores de float. */
  amountInCents: number;
  currency: Currency;
  /** Id interno de la orden/cotizacion — para conciliar con storage/db. */
  reference: string;
  customer: PaymentCustomer;
  method: PaymentMethodInput;
  /**
   * Tokens legales generados en el cliente y exigidos por el proveedor
   * (Wompi: acceptance_token de terminos + accept_personal_auth de datos
   * personales). Opcionales a nivel de contrato; el adapter valida cuales
   * exige su proveedor.
   */
  legalTokens?: {
    acceptanceToken: string;
    acceptPersonalAuth?: string;
  };
  /** Token de sesion anti-fraude generado en el cliente (Wompi: session_id del device fingerprint). */
  fraudSessionId?: string;
  /** Para flujos con redireccion (PSE, checkout hospedado). */
  redirectUrl?: string;
  metadata?: Record<string, string>;
}

export interface ChargeResult {
  /** Id interno. */
  id: string;
  /** Id del proveedor, si aplica. */
  externalId?: string;
  status: PaymentStatus;
  amountInCents: number;
  currency: Currency;
  /** URL a la que redirigir al cliente si el flujo lo requiere. */
  checkoutUrl?: string;
  /**
   * Presente cuando el pago quedo 'pending' y el flujo exige accion del
   * cliente: autorizar el push en el telefono (Nequi), completar la
   * redireccion bancaria (PSE) o pagar en efectivo con instrucciones.
   * El frontend decide con esto si hace polling o muestra instrucciones.
   */
  nextAction?: {
    type: 'awaiting_push_notification' | 'redirect_to_bank' | 'cash_payment_instructions';
    instructions?: string;
  };
  raw?: Record<string, unknown>;
}

export interface RefundRequest {
  chargeId: string;
  /** Parcial si se especifica (en centavos), total si se omite. */
  amountInCents?: number;
  reason?: string;
}

/**
 * Contrato que cada src/integrations/<id>/adapter.ts de esta capability debe
 * implementar. `refund`/`handleWebhook`/`verifyWebhook` son opcionales porque
 * no todo proveedor soporta reembolso via API, y el modelo de webhook varia
 * por pasarela. `getResult` es el verbo unico de consulta post-creacion en
 * todos los contratos asincronos de _contracts/ (antes `getStatus`).
 */
export interface PaymentAdapter {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  getResult(chargeId: string): Promise<ChargeResult>;

  refund?(request: RefundRequest): Promise<ChargeResult>;

  /**
   * Normaliza un evento de webhook entrante (confirmacion, reversal, etc.)
   * en 0+ resultados. Recibe el cuerpo CRUDO: la firma se valida sobre el
   * texto exacto y algunos proveedores agrupan eventos.
   */
  handleWebhook?(rawBody: string, headers: Record<string, string>): Promise<ChargeResult[]>;

  /**
   * Verifica la firma/autenticidad del webhook sobre el cuerpo crudo antes
   * de procesarlo (Wompi: HMAC-SHA256 de signature.properties concatenados +
   * timestamp + events secret, comparado contra X-Event-Checksum).
   */
  verifyWebhook?(rawBody: string, headers: Record<string, string>): boolean;
}
