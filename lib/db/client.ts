import { config } from 'dotenv'
config({ path: '.env.local' })
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL no definida en el entorno (requiere .env.local con la rama dev-local de Neon)')
}

// DIAGNÓSTICO TEMPORAL (2026-08-16, revertir después de identificar el host) — el build de
// Vercel falla con relaciones faltantes distintas a las de v3-preview (ep-muddy-cherry-at5j2mz7),
// que ya está migrada y verificada. Esto expone SOLO el hostname (nunca la contraseña) en el log
// de build para confirmar a qué branch de Neon apunta el DATABASE_URL real de Vercel.
if (process.env.VERCEL === '1') {
  console.error('[DIAGNÓSTICO] DATABASE_URL host real en Vercel:', new URL(connectionString).hostname)
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
export { client }
