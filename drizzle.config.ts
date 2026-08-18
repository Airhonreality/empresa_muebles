import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL no definida en .env.local (rama dev-local de Neon)')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  // './drizzle' (sin sufijo) es la carpeta legacy pre-V3 — el historial real vive en
  // './drizzle/v3'. Default corregido 2026-08-17: sin esto, `drizzle-kit generate` diffeaba
  // contra el snapshot legacy desactualizado y disparaba prompts de ambigüedad falsos
  // (ej. contratos.especificaciones_desmonte, ya resuelto hace semanas en v3).
  out: process.env.DRIZZLE_OUT ?? './drizzle/v3',
  dbCredentials: { url },
})
