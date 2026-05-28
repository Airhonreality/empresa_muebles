import { NextRequest, NextResponse } from 'next/server';

interface ModelEntry { value: string; label: string }

function dedup(models: ModelEntry[]): ModelEntry[] {
  const seen = new Set<string>();
  return models.filter(m => {
    if (seen.has(m.value)) return false;
    seen.add(m.value);
    return true;
  });
}

async function fetchMistralModels(apiKey: string): Promise<ModelEntry[]> {
  const res = await fetch('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Mistral API error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const entries = (json.data as any[])
    .filter(m => !m.id.includes('embed'))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(m => ({ value: m.id, label: m.id }));
  return dedup(entries);
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelEntry[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const entries = (json.data as any[])
    .filter(m => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('o4'))
    .sort((a, b) => b.created - a.created)
    .map(m => ({ value: m.id, label: m.id }));
  return dedup(entries);
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelEntry[]> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const entries = (json.data as any[])
    .map(m => ({ value: m.id, label: m.display_name ?? m.id }));
  return dedup(entries);
}

async function fetchOllamaModels(ollamaUrl: string): Promise<ModelEntry[]> {
  const base = (ollamaUrl ?? 'http://localhost:11434').replace(/\/$/, '');
  const res = await fetch(`${base}/api/tags`);
  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const json = await res.json();
  return (json.models as any[]).map(m => ({ value: m.name, label: m.name }));
}

// POST — acepta { provider, api_key, ollama_url? } del body del form
// No lee del vault: permite testar la key ANTES de guardar
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider: string = body.provider ?? '';
    const apiKey: string   = body.api_key ?? '';
    const ollamaUrl: string = body.ollama_url ?? 'http://localhost:11434';

    if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 });

    if (provider === 'ollama') {
      const models = await fetchOllamaModels(ollamaUrl);
      return NextResponse.json({ models, count: models.length });
    }

    if (!apiKey) return NextResponse.json({ error: 'api_key required', models: [] }, { status: 400 });

    let models: ModelEntry[] = [];
    switch (provider) {
      case 'mistral':   models = await fetchMistralModels(apiKey);   break;
      case 'openai':    models = await fetchOpenAIModels(apiKey);    break;
      case 'anthropic': models = await fetchAnthropicModels(apiKey); break;
      default: return NextResponse.json({ error: `provider not supported: ${provider}` }, { status: 400 });
    }

    return NextResponse.json({ models, count: models.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'fetch failed', models: [] }, { status: 502 });
  }
}
