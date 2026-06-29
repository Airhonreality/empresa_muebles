import { NextRequest } from 'next/server';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import { getStrategy } from '@/server/getStrategy';
import { executeObserve, executeAgnoCommand } from '@/lib/agnostic/agno-executor';

// ── System prompt ─────────────────────────────────────────────────────────────

const BASE_PROMPT = `Eres un agente de construcción para el sistema Agnostic. Tu razonamiento es estrictamente lógico, analítico y estructural — basado en las relaciones entre entidades del sistema.

## MODELO MENTAL DEL SISTEMA

El sistema es un grafo relacional de 5 átomos:
  Schema → define la estructura de datos (campos tipados)
  Record → instancia de un Schema (datos reales)
  Block  → referencia a un Schema en una posición de una Route
  Route  → contenedor ordenado de Blocks en un path URL
  Adapter → capa de persistencia (read/write/remove)

INVARIANTE CRÍTICO: block.context === schema.data.name === nombre_del_archivo_de_datos
Si este invariante se rompe, el bloque renderiza vacío sin error visible.

ORDEN DE CONSTRUCCIÓN (dependencias):
  1. Route (sin dependencias) o Schema (sin dependencias)
  3. Block (Route — block.context)
  4. Record (depende de Schema)

## PROTOCOLO DE DECISIÓN

Antes de actuar, evalúa:
  - ¿El pedido especifica todos los campos necesarios? Si no → responde con texto preguntando las variables exactas.
  - ¿El pedido elimina o sobreescribe datos existentes? Si sí → responde con texto listando exactamente qué IDs/nombres se destruirán y pide confirmación explícita antes de ejecutar.
  - ¿Existe ya un schema/ruta con ese nombre? → llama \`observe\` para verificar antes de crear.
  - ¿El pedido es completo y no destructivo? → \`observe\` + ejecutar con \`execute_agno\`.

## CICLO REACT — LEE EL RESULTADO ANTES DE CADA PASO

La respuesta de cada \`execute_agno\` es tu fuente de verdad para planear el siguiente comando.
Campos clave que debes leer:
  - \`warnings[]\`: acciones necesarias para que el bloque renderice correctamente.
  - \`next_steps[]\`: comandos exactos sugeridos para el paso siguiente.
  - \`required_visual_params[]\`: params que deben setearse con update-block ... visual.KEY.
  - \`still_missing[]\`: tras update-block, lo que aún falta configurar.
  - \`ok: false\` + \`error\`: detente, diagnostica y ajusta antes de continuar.

Nunca declares éxito hasta que warnings[] esté vacío o hayas confirmado que el bloque es funcional.

Cuando termines todas las acciones, responde con texto resumiendo lo construido. No necesitas herramienta especial para terminar.

## REGLAS DE INTEGRIDAD — NUNCA VIOLAR

1. NUNCA inventes un resultado de herramienta. Reporta EXACTAMENTE lo que devolvió \`execute_agno\` o \`observe\`.
2. Si \`execute_agno\` devuelve \`ok: false\`, reporta el error literal y detente. No declares éxito.
3. Cada llamada a \`execute_agno\` acepta UN SOLO comando. Nunca encadenes múltiples comandos en un string.
4. No borres datos en bloque (wildcards, "todos", "all"). Borrar requiere IDs específicos obtenidos con \`observe\` o \`ls\`.
5. Si el usuario pide borrar "todo", usa \`observe\` primero, lista los IDs reales, y pide confirmación por cada entidad.

## ESTILO DE RESPUESTA

- Sin emojis. Sin metáforas. Sin entusiasmo artificial.
- Razonamiento estructural: "Schema X requiere campo Y porque Block Z lo referencia."
- Al preguntar: lista las variables desconocidas con su tipo esperado.
- Al confirmar destructivo: lista exactamente qué IDs/nombres se eliminarán.
- Siempre pide confrimación al usuario antes de ejecutar cualqueir acción por mas obvia que paresca.
- Español. Conciso.`;

// ── Config y modelo ───────────────────────────────────────────────────────────

// Modelos que NO soportan tool calling — se reemplazan automáticamente
const FIM_ONLY_PATTERNS = ['codestral', 'embed', 'moderation'];

function isFimModel(model: string): boolean {
  return FIM_ONLY_PATTERNS.some(p => model.toLowerCase().includes(p));
}

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
  const { messages } = await req.json() as { messages: any[] };
  const adapter = getStrategy();
  const config = await getActiveAiConfig(adapter);

  const provider: string = config?.data?.provider ?? 'mistral';
  const apiKey: string   = config?.data?.api_key  ?? process.env.MISTRAL_API_KEY ?? '';

  // Override FIM-only models (codestral, embed, etc.) that don't support tool calling
  let model: string = config?.data?.model ?? 'mistral-large-latest';
  if (isFimModel(model)) {
    const fallback = provider === 'openai' ? 'gpt-4o-mini'
      : provider === 'anthropic' ? 'claude-haiku-4-5-20251001'
      : 'mistral-large-latest';
    model = fallback;
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'No hay API key configurada. Abre el chat → ⚙ Conexión para configurarla.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const llmModel = buildModel(provider, model, apiKey);
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: llmModel,
    system: BASE_PROMPT,
    messages: modelMessages,
    toolChoice: 'auto',
    stopWhen: stepCountIs(10),
    tools: {
      observe: {
        description: 'Lee el estado actual del sistema: schemas existentes con sus campos, rutas con sus bloques e IDs reales. Llama esto antes de ejecutar comandos.',
        inputSchema: z.object({}),
        execute: async () => executeObserve(adapter),
      },
      execute_agno: {
        description: `Ejecuta UN comando agno CLI sobre el sistema real. Lee el resultado antes del siguiente. Si ok:false, ajusta y reintenta.

GRAMÁTICA:
  create-schema <nombre> [field:<key>:<type>:<label> ...]
  add-field <schema> <key> <type> [label:<L>] [required] [options:<a,b,c>] [entity:<schema>]
  remove-field <schema> <key> | delete-schema <nombre>
  create-route <path> <título>
  add-block <ruta> <tipo> [schema:<nombre>] [intent:create|edit|view] [zap:<n>] [position:<v>]
  update-block <ruta> <blockId> visual.PARAM valor   ← para bloques visuales (hero/text/image/markdown/divider/spacer/faq/embed)
  update-block <ruta> <blockId> context <schema>     ← para bloques de datos (collection/form/table)
  update-block <ruta> <blockId> <prop> <valor>       ← cualquier otro campo del bloque
  remove-block <ruta> <blockId> | delete-route <path>
  create-record <schema> [key=val ...] | update-record <schema> <id> [key=val ...] | delete-record <schema> <id>
  ls | schema <nombre> | route <path> | records <schema>

BLOQUES VISUALES (no requieren schema, params en visual.*):
  hero text markdown image divider spacer faq embed

BLOQUES DE DATOS (requieren schema:<nombre>):
  collection form table action nav

REGLA CRÍTICA: NUNCA pases title:/subtitle:/content:/image: directamente en add-block.
Agrega el bloque primero, luego setea sus params con update-block usando visual.KEY.
La respuesta de add-block incluye required_visual_params y next_steps con los comandos exactos.`,
        inputSchema: z.object({
          command: z.string().describe('El comando exacto.'),
        }),
        execute: async ({ command }) => executeAgnoCommand(command, adapter),
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
