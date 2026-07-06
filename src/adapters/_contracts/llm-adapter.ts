/**
 * LlmAdapter — contrato provider-agnostic para llamadas a un modelo de
 * lenguaje (chat y, opcionalmente, clasificación multimodal de imágenes).
 *
 * BORRADOR. El seed ya implementa esta misma idea en
 * src/app/api/chat/route.ts (Vercel AI SDK: streamText, provider-swapping
 * openai/anthropic/mistral vía el registro ai_config) — este contrato la
 * formaliza como algo importable desde un fork, no la reemplaza.
 *
 * Dos consumidores ya identificados en este fork: el workflow de
 * clasificación de clips de video-editor, y el auto-responder de inbox
 * (ver src/modules/inbox/docs/05_orquestacion_automatizacion.md).
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: LlmMessage[];
  /** Prompt base — normalmente leído desde storage/db/ai_config.json, no hardcodeado. */
  systemPrompt?: string;
}

export interface ChatResult {
  text: string;
  raw?: Record<string, unknown>;
}

export interface ClassifyImageRequest {
  imageUrl: string;
  /** Instrucciones de clasificación, ej. "clasifica este frame como estable/movido/cambio de camara". */
  instructions: string;
}

export interface ClassifyImageResult {
  label: string;
  confidence?: number;
  raw?: Record<string, unknown>;
}

/**
 * Contrato que src/integrations/llm/adapter.ts debe implementar (subsistema
 * de adapters del seed — manifest `kind: 'llm'`). `classifyImage`
 * es opcional porque no toda tarea que use este adapter necesita visión
 * (ej. el auto-responder de mensajería solo usa `chat`).
 */
export interface LlmAdapter {
  chat(request: ChatRequest): Promise<ChatResult>;
  classifyImage?(request: ClassifyImageRequest): Promise<ClassifyImageResult>;
}
