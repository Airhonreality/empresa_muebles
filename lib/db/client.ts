import { config } from 'dotenv'
config({ path: '.env.local' })
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL no definida en el entorno (requiere .env.local con la rama dev-local de Neon)')
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
export { client }
