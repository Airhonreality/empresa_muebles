import { config } from 'dotenv'
config({ path: '.env.local' })

import { db, client } from '../lib/db/client'
import { roles, parametros } from '../lib/db/schema'

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
  { codigo: 'compras', nombre: 'Compras', descripcion: 'Órdenes de compra y gate de caja E-20' },
  { codigo: 'taller', nombre: 'Taller', descripcion: 'Armado y módulos' },
  { codigo: 'finanzas', nombre: 'Finanzas', descripcion: 'Caja, movimientos y compensación' },
  { codigo: 'supervisora_qa', nombre: 'Supervisora QA', descripcion: 'Calidad, gates y trazabilidad' },
]

const PARAMETROS_BASE = [
  {
    clave: 'neto_diseno_3d_pct',
    grupo: 'compensacion',
    tipo: 'numerico',
    valorNumeric: '97.5',
    unidad: '%',
    descripcion: 'Neto del diseñador por diseño 3D (100 − retención 2.5% servicios CO). V1 estimado, validar contador.',
  },
  {
    clave: 'iva_diseno_3d_pct',
    grupo: 'compensacion',
    tipo: 'numerico',
    valorNumeric: '19',
    unidad: '%',
    descripcion: 'IVA del diseño 3D facturado. V1 estimado (19), validar tratamiento ±IVA con contador.',
  },
  {
    clave: 'recargo_hora_extra_pct',
    grupo: 'nominas',
    tipo: 'numerico',
    valorNumeric: '25',
    unidad: '%',
    descripcion: 'Recargo por hora extra diurna (legal Colombia estándar 25%). Revisar vigencia 2026.',
  },
  {
    clave: 'umbral_novedad_check15',
    grupo: 'cronograma',
    tipo: 'numerico',
    valorNumeric: '3',
    unidad: 'dias',
    descripcion: 'Desfase (días) que dispara el check de los 15 días (E-59). V1 estimado ≥3 días.',
  },
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

  const paramsInserted = await db
    .insert(parametros)
    .values(PARAMETROS_BASE)
    .onConflictDoNothing({ target: parametros.clave })
    .returning({ clave: parametros.clave })

  const totalParams = await db.$count(parametros)
  console.log(`[seed-dev] parámetros insertados: ${paramsInserted.length}`)
  console.log(`[seed-dev] total parámetros en tabla: ${totalParams}`)
  console.log('[seed-dev] OK contra dev-local')
}

seed()
  .catch((err) => {
    console.error('[seed-dev] FALLÓ:', err)
    process.exit(1)
  })
  .finally(() => client.end())
