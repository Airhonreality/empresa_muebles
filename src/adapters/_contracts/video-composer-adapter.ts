/**
 * VideoComposerAdapter — contrato provider-agnostic para componer video a
 * partir de clips ya seleccionados y una lista de decisiones de edicion (EDL).
 *
 * v2 (2026-07-03) — ajustado con los hallazgos cerrados de
 * ../_research/video_2026.md: la composicion se delega a un servicio
 * hospedado de renderizado por EDL (primer provider real: Shotstack — ffmpeg
 * propio en serverless es inviable por tamano de binario, timeouts y RAM).
 * Se agregan transiciones por decision, parametros de salida y webhook de
 * completado. Los clips se referencian SIEMPRE por URL accesible
 * (publica/firmada) — el proveedor los descarga, nunca se suben en el body.
 *
 * Deliberadamente atomico: NO incluye clasificacion/analisis de clips ni
 * deteccion de escenas ni BPM. La clasificacion es un workflow sobre el LLM
 * adapter (../llm/); la deteccion de escenas y el BPM son decisiones del
 * macro modulo video-editor (ver su INDEX.md) — no de este contrato.
 *
 * Implementacion: extraida al proyecto satelite `estudio_multimedia`
 * (../estudio_multimedia/adapters/shotstack-composer/). El fork consumira
 * esta capability via HTTP contra el satelite; este contrato sigue siendo la
 * referencia de forma para ese borde. Si en el futuro se agrega otro
 * proveedor de composicion (Creatomate, Remotion Lambda, ffmpeg en worker
 * propio), implementa este mismo contrato.
 */

export interface EditDecision {
  /** URL accesible por el proveedor (publica o firmada). */
  clipUrl: string;
  startSeconds?: number;
  endSeconds?: number;
  /** Orden de aparicion en el video final. */
  order: number;
  /** Transicion de entrada de este clip (vocabulario del proveedor, ej. 'fade'). Sin transicion si se omite. */
  transition?: string;
}

export interface ComposeRequest {
  decisions: EditDecision[];
  audioTrackUrl?: string;
  outputFormat?: 'mp4' | 'mov' | (string & {});
  /** Resolucion de salida (vocabulario del proveedor, ej. 'hd', '1080'). */
  resolution?: string;
  /** Relacion de aspecto de salida, ej. '9:16' para vertical. */
  aspectRatio?: string;
  /**
   * URL a notificar al completar (patron principal). `getResult` queda como
   * polling de respaldo si el webhook se pierde.
   */
  webhookUrl?: string;
}

export interface ComposeResult {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  /**
   * URL del video final. Los proveedores hospedados expiran esta URL:
   * el consumidor debe persistir el archivo a storage propio al recibirla.
   */
  videoUrl?: string;
  raw?: Record<string, unknown>;
}

/**
 * Contrato que el compositor de video del satelite `estudio_multimedia` debe
 * implementar.
 */
export interface VideoComposerAdapter {
  compose(request: ComposeRequest): Promise<ComposeResult>;
  /** Polling de respaldo sobre el job encolado; el camino feliz es el webhook. */
  getResult(jobId: string): Promise<ComposeResult>;
}
