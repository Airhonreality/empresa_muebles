/**
 * RenderAdapter — contrato provider-agnostic para la herramienta de
 * renderizado de espacios (plano/pieza + entorno -> imagen fotorrealista).
 *
 * v2 (2026-07-03) — ajustado con los hallazgos cerrados de
 * ../_research/render_2026.md: patron asincrono con webhook + polling de
 * respaldo, entradas siempre por URL (S3/firmada — el gateway limita el
 * payload a ~10MB, nunca base64), y parametros tipados de control geometrico
 * (ControlNet canny/depth) y de contexto atmosferico (IP-Adapter en modo
 * style transfer) para que el caller nunca conozca ids de nodo del workflow.
 *
 * Distincion importante (confirmada por la investigacion): ComfyUI/RunPod es
 * el UNICO adapter real de esta capability. LoRA, ControlNet e IP-Adapter NO
 * son adapters — son configuracion de workflow (JSON en API format, ver
 * src/modules/render-studio/workflows/) que el mismo adapter ejecuta
 * distinto segun el proyecto.
 *
 * Implementacion: extraida al proyecto satelite `estudio_multimedia`
 * (../estudio_multimedia/adapters/runpod-comfyui/). El fork consumira esta
 * capability via HTTP contra el satelite; este contrato sigue siendo la
 * referencia de forma para ese borde.
 */

/** Id de un workflow JSON (API format) registrado en render-studio/workflows/, ej. 'veta_controlnet_depth_v1'. */
export type RenderWorkflow = string;

export interface RenderInputImage {
  /** Que representa esta imagen para el workflow (plano de linea, foto del espacio, textura, mascara, mapa Z). */
  role: 'plan' | 'reference_photo' | 'texture' | 'mask' | 'depth_map' | (string & {});
  /** Siempre URL accesible por el worker (S3/firmada) — nunca base64 embebido. */
  url: string;
}

/** Inyeccion de control geometrico. Para CAD: canny (bordes deterministas) + depth (volumen), nunca lineart. */
export interface RenderControlNetParams {
  type: 'canny' | 'depth' | (string & {});
  imageUrl: string;
  /** Fortaleza del condicionamiento. Rango recomendado por la investigacion: 0.65–0.85, valores cercanos entre si. */
  strength: number;
}

/** Adopcion lumbrica/atmosferica del entorno via IP-Adapter, restringida por mascara. */
export interface RenderStyleTransferParams {
  /** Foto del espacio del cliente (URL S3/firmada). */
  referenceImageUrl: string;
  /** Peso de adopcion lumInica en las capas de atencion. */
  weight: number;
  /** Mascara binaria que acota la transferencia al area del objeto (masked attention). */
  maskUrl?: string;
  /** 'style_transfer' anula la transferencia de composicion y solo adopta luz/paleta. */
  mode?: 'style_transfer' | (string & {});
}

export interface RenderRequest {
  workflow: RenderWorkflow;
  prompt: string;
  negativePrompt?: string;
  /** Planos exportados, fotos del cliente, etc. — lo que el workflow elegido pida. */
  images?: RenderInputImage[];
  controlNets?: RenderControlNetParams[];
  styleTransfer?: RenderStyleTransferParams;
  /**
   * Overrides puntuales (seed, steps, cfg, ...). El adapter los compila a las
   * rutas de nodo del JSON API-format usando el mapa parametro->nodo
   * registrado junto al workflow — el caller nunca referencia ids de nodo.
   */
  params?: Record<string, unknown>;
  /**
   * URL a notificar al completar (patron principal — el proveedor hace POST
   * con el resultado). `getResult` queda como polling de respaldo si el
   * webhook se pierde.
   */
  webhookUrl?: string;
}

export interface RenderResult {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  /** URLs (S3/firmadas) de las imagenes generadas — puede haber mas de una por job. */
  imageUrls?: string[];
  raw?: Record<string, unknown>;
}

/**
 * Contrato que el proveedor de render del satelite `estudio_multimedia` debe
 * implementar. Si en el futuro se agrega un proveedor distinto (Replicate,
 * Modal, GPU propia), implementa el mismo contrato.
 */
export interface RenderAdapter {
  /** Encola el job (async — nunca usar endpoints sincronos para flujos con ControlNet+IP-Adapter). */
  submit(request: RenderRequest): Promise<RenderResult>;
  /** Polling de respaldo sobre el job encolado; el camino feliz es el webhook. */
  getResult(jobId: string): Promise<RenderResult>;
  /** Ids de workflow disponibles para esta instancia del adapter. */
  listWorkflows(): Promise<string[]>;
}
