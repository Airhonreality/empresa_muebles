import { config } from 'dotenv'
config({ path: '.env.local' })

import { db, client } from '../lib/db/client'
import { roles } from '../lib/db/schema'

const DEV_HOST_ALLOWLIST = new Set([
  'ep-silent-field-ac8slpbc-pooler.sa-east-1.aws.neon.tech',
])

function guard(): void {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no definida')
  const hostname = new URL(url).hostname
  if (!DEV_HOST_ALLOWLIST.has(hostname)) {
    throw new Error(
      `SEED BLOQUEADO: host "${hostname}" no está en la allowlist de desarrollo. ` +
        'Este script NUNCA debe correr contra producción.',
    )
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SEED BLOQUEADO: NODE_ENV=production. No se siembra en producción.')
  }
}

const ROLES_BASE = [
  { codigo: 'admin', nombre: 'Administrador', descripcion: 'Acceso total al ERP' },
  { codigo: 'comercial', nombre: 'Comercial', descripcion: 'Embudo, cotizador y contratos' },
  { codigo: 'desarrollador', nombre: 'Desarrollador', descripcion: 'Schemas, BOM y verificación E-18' },
  { codigo: 'taller', nombre: 'Taller', descripcion: 'Armado y módulos' },
  { codigo: 'finanzas', nombre: 'Finanzas', descripcion: 'Caja, movimientos y compensación' },
  { codigo: 'supervisora_qa', nombre: 'Supervisora QA', descripcion: 'Calidad, gates y trazabilidad' },
]

async function seed(): Promise<void> {
  guard()

  const inserted = await db
    .insert(roles)
    .values(ROLES_BASE)
    .onConflictDoNothing({ target: roles.codigo })
    .returning({ codigo: roles.codigo })

  const total = await db.$count(roles)
  console.log(`[seed-dev] roles insertados: ${inserted.length}`)
  console.log(`[seed-dev] total roles en tabla: ${total}`)
  console.log('[seed-dev] OK contra dev-local')
}

seed()
  .catch((err) => {
    console.error('[seed-dev] FALLÓ:', err)
    process.exit(1)
  })
  .finally(() => client.end())
