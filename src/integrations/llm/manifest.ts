import type { AdapterManifest } from '@agnostic/core';

export const manifest: AdapterManifest = {
  id: 'llm',
  name: 'LLM Adapter',
  description: 'Provider-agnostic LLM chat and image classification via Vercel AI SDK',
  kind: 'llm',
  coreMinVersion: '0.1.0',
  envVars: [
    {
      key: 'OPENAI_API_KEY',
      label: 'OpenAI API Key',
      required: false,
      sensitive: true,
    },
    {
      key: 'ANTHROPIC_API_KEY',
      label: 'Anthropic API Key',
      required: false,
      sensitive: true,
    },
    {
      key: 'GROQ_API_KEY',
      label: 'Groq API Key',
      required: false,
      sensitive: true,
    },
    {
      key: 'MISTRAL_API_KEY',
      label: 'Mistral API Key',
      required: false,
      sensitive: true,
    },
    {
      key: 'GOOGLE_GENERATIVE_AI_API_KEY',
      label: 'Google Generative AI API Key',
      required: false,
      sensitive: true,
    },
  ],
  requiresSchemas: ['ai_config'],
  permissions: {
    network: 'outbound-api',
    outboundHosts: [
      'api.openai.com',
      'api.anthropic.com',
      'api.groq.com',
      'generativelanguage.googleapis.com',
      'api.mistral.ai',
    ],
    runsOutsideSandbox: true,
  },
};
