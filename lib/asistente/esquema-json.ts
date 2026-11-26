// lib/asistente/esquema-json.ts
// Convierte un esquema Zod (v4) a JSON Schema simple para describir operaciones al modelo.
// Solo se usa para lectura del modelo; la validación real siempre la hace Zod.
import { z } from 'zod'

export function zodToJsonSchema(esquema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(esquema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>
  delete json.$schema
  return json
}
