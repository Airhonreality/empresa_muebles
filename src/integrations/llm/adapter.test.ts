import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmAdapter, type StorageAdapter, type LlmRuntime } from './adapter';

// Mock storage adapter
const createMockStorage = (records: any[] = []): StorageAdapter => ({
  read: vi.fn().mockResolvedValue(records),
});

// Mock runtime for testing
const createMockRuntime = (): LlmRuntime => ({
  executeChat: vi.fn().mockResolvedValue({
    text: 'mock response',
    usage: { promptTokens: 10, completionTokens: 5 },
  }),
  executeClassifyImage: vi.fn().mockResolvedValue({
    label: 'test_label',
    confidence: 0.95,
  }),
});

const mockAiConfig = [
  {
    id: 'test-config',
    context: 'ai_config',
    data: {
      provider: 'mistral',
      model: 'mistral-large-latest',
      api_key: 'test-key',
      active: true,
    },
    updated_at: '2026-07-03T00:00:00Z',
  },
];

describe('LlmAdapter', () => {
  describe('initialization', () => {
    it('should create adapter with storage and runtime', () => {
      const storage = createMockStorage();
      const runtime = createMockRuntime();
      const adapter = new LlmAdapter(storage, runtime);
      expect(adapter).toBeDefined();
    });

    it('should create adapter with default VercelAiRuntime', () => {
      const storage = createMockStorage();
      const adapter = new LlmAdapter(storage);
      expect(adapter).toBeDefined();
    });
  });

  describe('chat', () => {
    let storage: StorageAdapter;
    let runtime: LlmRuntime;
    let adapter: LlmAdapter;

    beforeEach(() => {
      runtime = createMockRuntime();
      storage = createMockStorage(mockAiConfig);
      adapter = new LlmAdapter(storage, runtime);
    });

    it('should call runtime.executeChat with correct args', async () => {
      await adapter.chat({
        messages: [{ role: 'user' as const, content: 'hello' }],
        systemPrompt: 'You are helpful.',
      });

      expect(runtime.executeChat).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'mistral',
          model: 'mistral-large-latest',
          apiKey: 'test-key',
          messages: [{ role: 'user', content: 'hello' }],
          systemPrompt: 'You are helpful.',
        })
      );
    });

    it('should return text and metadata from runtime', async () => {
      const result = await adapter.chat({
        messages: [{ role: 'user' as const, content: 'test' }],
      });

      expect(result.text).toBe('mock response');
      expect(result.raw).toMatchObject({
        provider: 'mistral',
        model: 'mistral-large-latest',
        usage: { promptTokens: 10, completionTokens: 5 },
      });
    });

    it('should throw error when ai_config not found', async () => {
      const emptyStorage = createMockStorage([]);
      const adapterNoConfig = new LlmAdapter(emptyStorage, runtime);

      await expect(
        adapterNoConfig.chat({
          messages: [{ role: 'user' as const, content: 'test' }],
        })
      ).rejects.toThrow('No ai_config found');
    });

    it('should throw error when api_key missing', async () => {
      const storageNoKey = createMockStorage([
        {
          id: 'test',
          context: 'ai_config',
          data: {
            provider: 'mistral',
            model: 'mistral-large-latest',
            api_key: '',
          },
        },
      ]);
      const adapterNoKey = new LlmAdapter(storageNoKey, runtime);

      // Stub env vars
      vi.stubEnv('MISTRAL_API_KEY', '');

      await expect(
        adapterNoKey.chat({
          messages: [{ role: 'user' as const, content: 'test' }],
        })
      ).rejects.toThrow(/Missing API key/);
    });

    it('should use environment variable if api_key not in config', async () => {
      vi.stubEnv('MISTRAL_API_KEY', 'env-key');
      const storageNoKey = createMockStorage([
        {
          id: 'test',
          context: 'ai_config',
          data: {
            provider: 'mistral',
            model: 'mistral-large-latest',
            api_key: '',
          },
        },
      ]);
      const adapterEnvKey = new LlmAdapter(storageNoKey, runtime);

      await adapterEnvKey.chat({
        messages: [{ role: 'user' as const, content: 'test' }],
      });

      expect(runtime.executeChat).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'env-key',
        })
      );
    });
  });

  describe('classifyImage', () => {
    let storage: StorageAdapter;
    let runtime: LlmRuntime;
    let adapter: LlmAdapter;

    beforeEach(() => {
      runtime = createMockRuntime();
      storage = createMockStorage(mockAiConfig);
      adapter = new LlmAdapter(storage, runtime);
    });

    it('should call runtime.executeClassifyImage with correct args', async () => {
      await adapter.classifyImage({
        imageUrl: 'https://example.com/img.jpg',
        instructions: 'classify frame stability',
      });

      expect(runtime.executeClassifyImage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'mistral',
          model: 'mistral-large-latest',
          apiKey: 'test-key',
          imageUrl: 'https://example.com/img.jpg',
          instructions: 'classify frame stability',
        })
      );
    });

    it('should return label and confidence from runtime', async () => {
      const result = await adapter.classifyImage({
        imageUrl: 'https://example.com/img.jpg',
        instructions: 'classify',
      });

      expect(result.label).toBe('test_label');
      expect(result.confidence).toBe(0.95);
      expect(result.raw).toMatchObject({
        provider: 'mistral',
        model: 'mistral-large-latest',
      });
    });

    it('should throw error when ai_config not found', async () => {
      const emptyStorage = createMockStorage([]);
      const adapterNoConfig = new LlmAdapter(emptyStorage, runtime);

      await expect(
        adapterNoConfig.classifyImage({
          imageUrl: 'https://example.com/img.jpg',
          instructions: 'classify',
        })
      ).rejects.toThrow('No ai_config found');
    });
  });

  describe('testConnection', () => {
    it('should return ok:true when chat succeeds', async () => {
      const runtime = createMockRuntime();
      const storage = createMockStorage(mockAiConfig);
      const adapter = new LlmAdapter(storage, runtime);

      const result = await adapter.testConnection();

      expect(result.ok).toBe(true);
      expect(runtime.executeChat).toHaveBeenCalled();
    });

    it('should return ok:false with error message on failure', async () => {
      const runtime: LlmRuntime = {
        executeChat: vi.fn().mockRejectedValue(new Error('Network error')),
        executeClassifyImage: vi.fn(),
      };
      const storage = createMockStorage(mockAiConfig);
      const adapter = new LlmAdapter(storage, runtime);

      const result = await adapter.testConnection();

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('runtime injectionand configuration resolution', () => {
    it('should use active config if multiple configs exist', async () => {
      const configs = [
        {
          id: '1',
          context: 'ai_config',
          data: {
            provider: 'openai',
            model: 'gpt-4',
            api_key: 'key1',
            active: false,
          },
        },
        {
          id: '2',
          context: 'ai_config',
          data: {
            provider: 'mistral',
            model: 'mistral-large',
            api_key: 'key2',
            active: true,
          },
        },
      ];
      const runtime = createMockRuntime();
      const storage = createMockStorage(configs);
      const adapter = new LlmAdapter(storage, runtime);

      await adapter.chat({
        messages: [{ role: 'user' as const, content: 'test' }],
      });

      expect(runtime.executeChat).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'mistral',
          apiKey: 'key2',
        })
      );
    });

    it('should use first config if no active config', async () => {
      const configs = [
        {
          id: '1',
          context: 'ai_config',
          data: {
            provider: 'anthropic',
            model: 'claude-3',
            api_key: 'key1',
          },
        },
      ];
      const runtime = createMockRuntime();
      const storage = createMockStorage(configs);
      const adapter = new LlmAdapter(storage, runtime);

      await adapter.chat({
        messages: [{ role: 'user' as const, content: 'test' }],
      });

      expect(runtime.executeChat).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'anthropic',
          apiKey: 'key1',
        })
      );
    });
  });
});
