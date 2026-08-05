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
  out: process.env.DRIZZLE_OUT ?? './drizzle',
  dbCredentials: { url },
})
