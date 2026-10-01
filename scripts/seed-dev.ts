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

// 🔴 Hosts que NUNCA deben recibir un seed, aunque estén en la allowlist.
// `ep-muddy-cherry-at5j2mz7` es v3-preview, que desde 2026-08-20 es la base REAL que lee Vercel
// (73 tablas, 146 proyectos, 93 clientes, 64 contratos — ver arnes/estado.md, "CORRECCIÓN CRÍTICA
// DE ENTORNO" y la entrada del 2026-09-30). Este host estaba en la allowlist de "desarrollo",
// o sea que el guard se contradecía a sí mismo: advertía "nunca contra producción" mientras
// autorizaba el host de producción. Ver arnes/lineas/respuesta_cliente/riesgo_seed_allowlist_produccion.md
const PRODUCCION_NUNCA = new Set(['ep-muddy-cherry-at5j2mz7'])

const DEV_HOST_ALLOWLIST = new Set([
  'ep-silent-field-ac8slpbc-pooler.sa-east-1.aws.neon.tech',
  'ep-round-queen-at3nzf87-pooler.c-9.us-east-1.aws.neon.tech',
])

/** Compara solo el nombre del branch de Neon: el hostname real lleva sufijos -pooler.c-N. */
function branchDe(hostname: string): string {
  return hostname.split('-pooler')[0]
}

function guard(): void {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no definida')
  const hostname = new URL(url).hostname
  const branch = branchDe(hostname)

  // Va PRIMERO y gana sobre cualquier allowlist. La única puerta de salida es deliberada y
  // explícita: sin CONFIRM_SEED_PRODUCCION, contra producción este script no arranca.
  if (PRODUCCION_NUNCA.has(branch) && !process.env.CONFIRM_SEED_PRODUCCION) {
    throw new Error(
      `SEED BLOQUEADO: "${branch}" es la base de producción (la que lee Vercel). ` +
        'Este script NUNCA debe correr contra ella. Si de verdad lo necesitas, confirma con el ' +
        'Supervisor y exporta CONFIRM_SEED_PRODUCCION=1.',
    )
  }
  if (!DEV_HOST_ALLOWLIST.has(hostname) && !DEV_HOST_ALLOWLIST.has(branch)) {
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
  // par26-par33 (2026-10-01): mismas 8 claves ya definidas en lib/data/fixtures.ts (par26-par33,
  // único consumidor hoy del mock-store) -- fixtures.ts no se lee acá a propósito (seed-dev.ts es
  // autocontenido, dev-only, con guard propio contra producción; acoplarlo a fixtures de ejemplo
  // mezclaría dos cosas con ciclos de vida distintos). `transiciones_lead` sigue el mismo patrón
  // que `transiciones_proyecto` (par08): tipo 'texto' con JSON.stringify -- el schema no admite
  // un tipo 'jsonb' real (CHECK parametros_exclusion_valores solo permite numerico/texto/booleano).
  {
    clave: 'transiciones_lead',
    grupo: 'comercial',
    tipo: 'texto',
    valorTexto: JSON.stringify({
      nuevo_lead: ['contactado', 'descartado'],
      contactado: ['asesoria_agendada', 'cotizado', 'descartado'],
      asesoria_agendada: ['cotizado', 'descartado'],
      cotizado: ['contrato_firmado', 'descartado'],
      contrato_firmado: [],
      descartado: [],
    }),
    descripcion: 'Reglas de transición de etapa de lead (matriz mínima). Sobrescribe el default de lib/modules/comercial/leads.ts si está presente.',
  },
  {
    clave: 'lead_cotizado_silencio_horas',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '48',
    unidad: 'horas',
    descripcion: 'Lead cotizado sin avanzar la etapa durante este tiempo = crítico (incidente Cocina Integral Chía, 2026-09-30).',
  },
  {
    clave: 'lead_nuevo_sin_contacto_horas',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '24',
    unidad: 'horas',
    descripcion: 'Lead nuevo sin ningún contacto en este tiempo = atención.',
  },
  {
    clave: 'lead_ventana_abierta_horas',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '72',
    unidad: 'horas',
    descripcion: 'Antigüedad máxima de un lead para seguir apareciendo en la bandeja de seguimiento comercial.',
  },
  {
    clave: 'regla_ack_minutos',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '5',
    unidad: 'minutos',
    descripcion: 'Regla de oro: todo requerimiento del cliente se confirma en menos de este tiempo con acuse de recibo y hora exacta de entrega.',
  },
  {
    clave: 'alerta_comercial_horas',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '2',
    unidad: 'horas',
    descripcion: 'Sin respuesta del comercial tras este tiempo, el caso escala a alerta de urgencia.',
  },
  {
    clave: 'autonomia_ia',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '0',
    unidad: 'nivel 0-3',
    descripcion: 'Escalera de autonomía de la IA sobre mensajes de clientes. Arranca en 0 a propósito.',
  },
  {
    clave: 'tope_mensajes_ia_dia',
    grupo: 'comercial',
    tipo: 'numerico',
    valorNumeric: '3',
    unidad: 'mensajes/día',
    descripcion: 'Tope duro de mensajes automáticos por conversación por día.',
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
