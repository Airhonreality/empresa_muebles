import { NextRequest } from 'next/server';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { getStrategy } from '@/server/getStrategy';

// ── Base system prompt ────────────────────────────────────────────────────────

const BASE_PROMPT = `Eres el asistente de diseño del sistema Agnostic. Tu trabajo es ayudar a construir y modificar interfaces usando comandos de agno CLI.

Cuando el usuario pida crear o modificar algo, responde SIEMPRE con los comandos exactos de agno en un bloque de código marcado con \`\`\`agno.

COMANDOS DISPONIBLES:
LECTURA:
  ls | schema <name> | schema id <name> | route <path> | ui <path>
  records <schema> [limit=N] [key=val] | script <name>

SCHEMA CRUD:
  create-schema <name> [field:<key>:<type>[:<label>] ...]
  add-field <schema> <key> <type> [label:<label>] [required] [options:<a,b,c>] [entity:<schema>]
  remove-field <schema> <key> | delete-schema <name>
  set <schema>.<field>.<prop> <value>   (prop: label|type|required|entity)

ROUTE / BLOCK CRUD:
  create-route <path> <title>
  add-block <route> <type> [schema:<name>] [intent:<edit|view|create>] [zap:<name>]
  update-block <route> <blockId> <prop> <value>
  remove-block <route> <blockId> | delete-route <path>

RECORD CRUD:
  create-record <schema> [key=val ...] | update-record <schema> <id> [key=val ...]
  delete-record <schema> <id>

COLA:
  commit | commit --force | drop | status

Responde siempre en español. Sé conciso.`;

// ── Generador de estado actual del sistema ────────────────────────────────────

async function generateSystemState(adapter: any): Promise<string> {
  try {
    const [schemas, routes] = await Promise.all([
      adapter.read('schema_definitions') as Promise<any[]>,
      adapter.read('page_routes') as Promise<any[]>,
    ]);

    const schemaLines = schemas.map((s: any) => {
      const fields = (s.data?.fields || [])
        .map((f: any) => `${f.key}:${f.type}${f.required ? '*' : ''}`)
        .join(', ');
      return `  ${s.data?.name}(${fields})`;
    }).join('\n');

    const routeLines = routes.map((r: any) => {
      const blocks = (r.data?.blocks || [])
        .map((b: any) => `${b.type}${b.context ? '→' + b.context : ''}${b.position ? '[' + b.position + ']' : ''}`)
        .join(', ');
      return `  ${r.data?.path}(${blocks || 'sin bloques'})`;
    }).join('\n');

    return `\n--- ESTADO ACTUAL DEL SISTEMA (generado en tiempo real) ---\nSCHEMAS:\n${schemaLines}\n\nROUTES:\n${routeLines}\n---`;
  } catch {
    return '';
  }
}

// ── Config y modelo ───────────────────────────────────────────────────────────

async function getActiveAiConfig(adapter: any) {
  try {
    const records = (await adapter.read('ai_config')) as any[];
    return records.find((r: any) => r.data?.active) ?? records[0] ?? null;
  } catch {
    return null;
  }
}

function buildModel(provider: string, model: string, apiKey: string) {
  switch (provider) {
    case 'openai': {
      const client = createOpenAI({ apiKey });
      return client(model || 'gpt-4o-mini');
    }
    case 'anthropic': {
      const client = createAnthropic({ apiKey });
      return client(model || 'claude-haiku-4-5-20251001');
    }
    case 'mistral':
    default: {
      const client = createMistral({ apiKey });
      return client(model || 'mistral-large-latest');
    }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const adapter = getStrategy();

  const [config, systemState] = await Promise.all([
    getActiveAiConfig(adapter),
    generateSystemState(adapter),
  ]);

  const provider: string = config?.data?.provider ?? 'mistral';
  const model: string    = config?.data?.model    ?? 'mistral-large-latest';
  const apiKey: string   = config?.data?.api_key  ?? process.env.MISTRAL_API_KEY ?? '';

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'No hay API key configurada. Abre el chat → ⚙ Conexión para configurarla.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Construir system prompt: base + estado actual + manifest + reglas del usuario
  const manifestSection = config?.data?.manifest
    ? `\n--- MANIFEST TÉCNICO ---\n${config.data.manifest}\n---`
    : '';

  const rulesSection = config?.data?.custom_rules?.trim()
    ? `\n--- REGLAS DEL NEGOCIO ---\n${config.data.custom_rules}\n---`
    : '';

  const systemPrompt = [BASE_PROMPT, systemState, manifestSection, rulesSection]
    .filter(Boolean)
    .join('\n');

  const llmModel = buildModel(provider, model, apiKey);

  const result = streamText({
    model: llmModel,
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
