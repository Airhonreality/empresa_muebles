import { config } from 'dotenv'
config({ path: '.env.local' })
import { createHash } from 'node:crypto'

import { db, client } from '../lib/db/client'
import { roles, parametros, testimonios } from '../lib/db/schema'
import { TESTIMONIOS } from '../lib/data/fixtures'

// Los fixtures usan ids simbólicos tipo 'mock-test01' (válidos en el mock-store, no en Postgres).
// Para el seed real se deriva un UUID estable desde el id del fixture: idempotente entre corridas
// y sin colisiones entre corridas (mismo id -> mismo UUID).
function stableUuid(seed: string): string {
  const hex = createHash('md5').update(seed).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

const DEV_HOST_ALLOWLIST = new Set([
  'ep-silent-field-ac8slpbc-pooler.sa-east-1.aws.neon.tech',
  'ep-muddy-cherry-at5j2mz7.c-9.us-east-1.aws.neon.tech',
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

  // Testimonios reales curados de GBP (I-019/I-050): mismo seed canónico de fixtures. Idempotente
  // por id fijo (UUID estable derivado del id de fixture). Solo publicado=true llega al Home
  // (listarTestimoniosPublicadosAction). clienteId/proyectoId se siembran en null porque los ids
  // simbólicos de los fixtures ('mock-c01', 'mock-proj01') no existen como clientes/proyectos reales
  // en la BD y sus columnas son uuid con FK — el Home no las consume.
  const testimoniosInserted = await db
    .insert(testimonios)
    .values(
      TESTIMONIOS.map((t) => ({
        id: stableUuid(t.id),
        contenido: t.contenido,
        nombreAutor: t.nombreAutor,
        rating: t.rating,
        curado: t.curado,
        aprobado: t.aprobado,
        publicado: t.publicado,
        fuente: t.fuente,
        barrio: t.barrio,
        tipoProyecto: t.tipoProyecto,
        urlFuente: t.urlFuente,
        fechaPublicacion: t.fechaPublicacion,
        clienteId: null,
        proyectoId: null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    )
    .onConflictDoNothing({ target: testimonios.id })
    .returning({ id: testimonios.id })

  const totalTestimonios = await db.$count(testimonios)
  console.log(`[seed-dev] testimonios insertados: ${testimoniosInserted.length}`)
  console.log(`[seed-dev] total testimonios en tabla: ${totalTestimonios}`)
  console.log('[seed-dev] OK contra dev-local')
}

seed()
  .catch((err) => {
    console.error('[seed-dev] FALLÓ:', err)
    process.exit(1)
  })
  .finally(() => client.end())
