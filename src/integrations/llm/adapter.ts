import { z } from 'zod';
import type {
  LlmAdapter as LlmAdapterContract,
  ChatRequest,
  ChatResult,
  ClassifyImageRequest,
  ClassifyImageResult,
} from '@/adapters/_contracts/llm-adapter';

interface AiConfigRecord {
  id: string;
  context: string;
  data: {
    provider: string;
    model: string;
    api_key: string;
    active?: boolean;
    [key: string]: unknown;
  };
  updated_at?: string;
}

export type StorageAdapter = {
  read(schema: string): Promise<AiConfigRecord[]>;
};

// ── Internal execution layer (injectable for testability) ────────────────

export interface LlmRuntime {
  executeChat(args: {
    provider: string;
    model: string;
    apiKey: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    systemPrompt: string;
  }): Promise<{ text: string; usage?: Record<string, unknown> }>;

  executeClassifyImage(args: {
    provider: string;
    model: string;
    apiKey: string;
    imageUrl: string;
    instructions: string;
  }): Promise<{ label: string; confidence?: number }>;
}

// ── Production runtime (uses Vercel AI SDK) ──────────────────────────────

class VercelAiRuntime implements LlmRuntime {
  async executeChat(args: {
    provider: string;
    model: string;
    apiKey: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    systemPrompt: string;
  }): Promise<{ text: string; usage?: Record<string, unknown> }> {
    const { generateText } = await import('ai');
    const model = this.buildModel(args.provider, args.model, args.apiKey);

    const result = await generateText({
      model,
      messages: args.messages,
      system: args.systemPrompt,
    });

    return {
      text: result.text,
      usage: result.usage,
    };
  }

  async executeClassifyImage(args: {
    provider: string;
    model: string;
    apiKey: string;
    imageUrl: string;
    instructions: string;
  }): Promise<{ label: string; confidence?: number }> {
    const { generateObject } = await import('ai');
    const model = this.buildModel(args.provider, args.model, args.apiKey);

    const ClassificationSchema = z.object({
      label: z.string().describe('The classification label'),
      confidence: z.number().optional().describe('Confidence score between 0 and 1'),
    });

    const result = await generateObject({
      model,
      schema: ClassificationSchema,
      messages: [
        {
          role: 'user' as const,
          content: [
            {
              type: 'image' as const,
              image: args.imageUrl,
            },
            {
              type: 'text' as const,
              text: args.instructions,
            },
          ],
        },
      ],
    });

    return {
      label: result.object.label,
      confidence: result.object.confidence,
    };
  }

  private buildModel(provider: string, model: string, apiKey: string) {
    // Dynamic imports to avoid hard dependency on SDK at module load time
    switch (provider) {
      case 'openai': {
        const { createOpenAI } = require('@ai-sdk/openai');
        const client = createOpenAI({ apiKey });
        return client(model || 'gpt-4o-mini');
      }
      case 'anthropic': {
        const { createAnthropic } = require('@ai-sdk/anthropic');
        const client = createAnthropic({ apiKey });
        return client(model || 'claude-3-5-haiku-20241022');
      }
      case 'mistral': {
        const { createMistral } = require('@ai-sdk/mistral');
        const client = createMistral({ apiKey });
        return client(model || 'mistral-large-latest');
      }
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }
}

// ── Configuration helpers ────────────────────────────────────────────────

async function getActiveAiConfig(storageAdapter: StorageAdapter): Promise<AiConfigRecord | null> {
  try {
    const records = await storageAdapter.read('ai_config');
    if (!Array.isArray(records)) return null;
    return records.find((r: AiConfigRecord) => r.data?.active) ?? records[0] ?? null;
  } catch {
    return null;
  }
}

function getEnvApiKey(provider: string): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY ?? '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY ?? '';
    case 'mistral':
      return process.env.MISTRAL_API_KEY ?? '';
    default:
      return '';
  }
}

// ── Main adapter ─────────────────────────────────────────────────────────

export class LlmAdapter implements LlmAdapterContract {
  private storageAdapter: StorageAdapter;
  private runtime: LlmRuntime;

  constructor(storageAdapter: any, runtime?: LlmRuntime) {
    // storageAdapter here is credentials Record<string, string>, but we need storage
    // For CLI testing, we create a mock. For real use, pass getStrategy() result.
    this.storageAdapter = storageAdapter?.read ? storageAdapter : { read: async () => [] };
    this.runtime = runtime || new VercelAiRuntime();
  }

  // ServerAdapter compatibility (for CLI registry) — LlmAdapter is not a data-source
  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      await this.chat({ messages: [{ role: 'user' as const, content: 'ping' }] });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    const config = await getActiveAiConfig(this.storageAdapter);

    if (!config) {
      throw new Error('No ai_config found in storage. Install and configure an LLM provider first.');
    }

    const provider: string = config.data.provider ?? 'mistral';
    const modelName: string = config.data.model ?? 'mistral-large-latest';
    let apiKey: string = config.data.api_key ?? '';

    if (!apiKey) {
      apiKey = getEnvApiKey(provider);
    }

    if (!apiKey) {
      throw new Error(
        `Missing API key for provider "${provider}". ` +
          `Set the environment variable or configure ai_config.api_key.`
      );
    }

    const { text, usage } = await this.runtime.executeChat({
      provider,
      model: modelName,
      apiKey,
      messages: request.messages.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      systemPrompt: request.systemPrompt ?? '',
    });

    return {
      text,
      raw: {
        provider,
        model: modelName,
        usage,
      },
    };
  }

  async classifyImage(request: ClassifyImageRequest): Promise<ClassifyImageResult> {
    const config = await getActiveAiConfig(this.storageAdapter);

    if (!config) {
      throw new Error('No ai_config found in storage. Install and configure an LLM provider first.');
    }

    const provider: string = config.data.provider ?? 'mistral';
    const modelName: string = config.data.model ?? 'mistral-large-latest';
    let apiKey: string = config.data.api_key ?? '';

    if (!apiKey) {
      apiKey = getEnvApiKey(provider);
    }

    if (!apiKey) {
      throw new Error(
        `Missing API key for provider "${provider}". ` +
          `Set the environment variable or configure ai_config.api_key.`
      );
    }

    const { label, confidence } = await this.runtime.executeClassifyImage({
      provider,
      model: modelName,
      apiKey,
      imageUrl: request.imageUrl,
      instructions: request.instructions,
    });

    return {
      label,
      confidence,
      raw: {
        provider,
        model: modelName,
      },
    };
  }
}
