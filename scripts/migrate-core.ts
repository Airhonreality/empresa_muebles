// Fase 2 (t-115/116) — clon de datos reales legacy -> V3, primera corrida de PRUEBA contra
// v3-preview (Javier revisa manualmente antes de considerar nada "definitivo").
// Lee agnostic_records de producción real (DATABASE_URL_LEGACY, solo lectura) y escribe en
// la rama v3-preview de Neon (DATABASE_URL_V3_PREVIEW). Nunca toca production ni dev-local.
//
// Alcance decidido con el Supervisor (2026-08-14, ver arnes/lineas/ola7/migracion/validacion_valores.md):
//   clientes, productos_catalogo, proyectos, espacio_variantes, items_variante.
//   NO incluye: contratos/hitos_pago, propuestas_publicas, portafolio (se regeneran solos).
//
// Reglas de remediation aplicadas (todas del Supervisor, no inventadas):
//   1. SKU: se regenera automáticamente para los 278 productos (nunca se usó operativamente).
//   2. Huérfanos: 2 espacio_variantes + 97 items_variante sin cadena a un proyecto real -> se
//      descartan. 1 proyecto con nombre vacío pero con hijo real -> se conserva igual.
//   3. estado='visita_tecnica' (1 proyecto) -> remapea a 'negociacion'.
//   4. estado NULL (13 proyectos) -> default 'borrador'.
//   5. cotizaciones NO se migra como namespace separado: los 18 registros comparten el mismo id
//      que 18 de los 51 proyectos (descubierto en esta sesión, no estaba en el mapeo original) —
//      migrarlos como filas nuevas duplicaría 18 proyectos reales. Se ignora por completo.
import { config } from 'dotenv'
config({ path: '.env.local' })
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { randomUUID } from 'node:crypto'
import * as schema from '../lib/db/schema'

const legacyUrl = process.env.DATABASE_URL_LEGACY
const previewUrl = process.env.DATABASE_URL_V3_PREVIEW
if (!legacyUrl) throw new Error('falta DATABASE_URL_LEGACY en .env.local')
if (!previewUrl) throw new Error('falta DATABASE_URL_V3_PREVIEW en .env.local')

// 🔴 BLOQUEADO A PROPÓSITO (2026-08-20) — NO BORRAR ESTE GUARD SIN CONFIRMAR CON JAVIER.
// Este script hace TRUNCATE ... CASCADE sobre proyectos/espacio_variantes/items_variante/
// productos_catalogo/clientes en DATABASE_URL_V3_PREVIEW. Cuando se escribió (2026-08-14)
// v3-preview era descartable. Ya NO lo es: Javier confirmó que v3-preview (ep-muddy-cherry-
// at5j2mz7) es hoy su base de trabajo real — tiene 62 `contratos` reales (backfill del
// 2026-08-16, ver arnes/estado.md) y ediciones de ERP en vivo hasta la fecha. Volver a correr
// este script BORRARÍA todo eso. Ver arnes/estado.md, entrada "CORRECCIÓN CRÍTICA DE ENTORNO".
// Para correrlo a propósito (confirmado con Javier), exportar CONFIRM_MIGRATE_CORE_DESTRUCTIVE=1.
if (!process.env.CONFIRM_MIGRATE_CORE_DESTRUCTIVE) {
  throw new Error(
    'migrate-core.ts deshabilitado: v3-preview ya no es descartable, ver arnes/estado.md (2026-08-20). ' +
    'Si de verdad necesitas correr esto, confirma con Javier primero y exporta CONFIRM_MIGRATE_CORE_DESTRUCTIVE=1.'
  )
}

const prod = postgres(legacyUrl, { prepare: false })
const previewClient = postgres(previewUrl, { prepare: false })
const db = drizzle(previewClient, { schema })

const ESTADO_PROYECTO_ENUM = new Set([
  'borrador', 'en_revision', 'cotizado', 'negociacion', 'en_contrato',
  'desarrollo', 'aprobado_compras', 'armado', 'verificado', 'en_instalacion', 'instalado',
  'entregado', 'perdida', 'cancelada',
  'activa', 'enviada', 'pre_produccion', 'produccion', 'retoma',
])

type Row = { id: string; data: Record<string, unknown> }

async function fetchNamespace(namespace: string): Promise<Row[]> {
  return prod<Row[]>`SELECT id, data FROM agnostic_records WHERE namespace = ${namespace}`
}

function s(v: unknown): string | undefined {
  if (v === null || v === undefined || v === '') return undefined
  return String(v)
}

function parseImagenesLegacy(v: unknown): string[] {
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  if (typeof v !== 'string' || !v) return []
  // Caso normal encontrado en el dato real: un string con JSON de un array de URLs adentro.
  if (v.trim().startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(v)
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string')
    } catch {
      // no era JSON válido pese a empezar con '[' — cae al tratamiento como URL suelta abajo
    }
  }
  // String que no es JSON de array: se asume que es una URL suelta.
  return [v]
}

function resuelveEstadoProyecto(legacyEstado: unknown): string {
  const v = s(legacyEstado)
  if (!v) return 'borrador' // regla 4
  if (v === 'visita_tecnica') return 'negociacion' // regla 3
  if (ESTADO_PROYECTO_ENUM.has(v)) return v
  console.warn(`  aviso: estado de proyecto desconocido '${v}', se usa 'borrador' como resguardo`)
  return 'borrador'
}

async function main() {
  console.log('=== Fase 2 (PRUEBA) — clon legacy (producción, solo lectura) -> v3-preview ===\n')

  // Limpia las 5 tablas destino en preview (idempotente — es una prueba, se puede re-correr)
  await previewClient`TRUNCATE TABLE items_variante, espacio_variantes, proyectos, productos_catalogo, clientes RESTART IDENTITY CASCADE`
  console.log('v3-preview: tablas destino vaciadas para una corrida limpia.\n')

  // ---- clientes ----
  const clientesLegacy = await fetchNamespace('clientes')
  const clienteIdMap = new Map<string, string>()
  const clientesInsert = clientesLegacy.map((r) => {
    const nuevoId = randomUUID()
    clienteIdMap.set(r.id, nuevoId)
    return {
      id: nuevoId,
      nombre: s(r.data.nombre) ?? '(sin nombre)',
      documento: s(r.data.documento),
      telefono: s(r.data.telefono),
      email: s(r.data.email),
      domicilio: s(r.data.domicilio),
    }
  })
  if (clientesInsert.length) await db.insert(schema.clientes).values(clientesInsert)
  console.log(`clientes: ${clientesInsert.length} migrados`)

  // ---- productos_catalogo ----
  const catalogoLegacy = await fetchNamespace('productos_catalogo')
  const catalogoIdMap = new Map<string, string>()
  let skuCounter = 0
  const catalogoInsert = catalogoLegacy.map((r) => {
    const nuevoId = randomUUID()
    catalogoIdMap.set(r.id, nuevoId)
    skuCounter++
    return {
      id: nuevoId,
      sku: `AUTO-${String(skuCounter).padStart(6, '0')}`, // regla 1: se regenera para los 278
      descripcion: s(r.data.descripcion) ?? '(sin descripción)',
      tipo: s(r.data.tipo),
      unidadMedida: s(r.data.unidad_medida) ?? 'ud',
      precioDirecto: s(r.data.precio_directo),
      precioPublico: s(r.data.precio_publico),
      stockActual: r.data.stock_actual != null ? Number(r.data.stock_actual) : 0,
      imagenUrl: s(r.data.imagen_url) ?? s(r.data.imagen),
      modelo3dUrl: s(r.data.modelo_3d),
      categoriaComercial: s(r.data.categoria_comercial),
      publicadoWeb: Boolean(r.data.publicado_web),
    }
  })
  if (catalogoInsert.length) await db.insert(schema.productosCatalogo).values(catalogoInsert)
  console.log(`productos_catalogo: ${catalogoInsert.length} migrados (SKU autogenerado para todos)`)

  // ---- proyectos (SOLO namespace 'proyectos' — 'cotizaciones' se ignora, regla 5) ----
  const proyectosLegacy = await fetchNamespace('proyectos')
  const proyectoIdMap = new Map<string, string>()
  let sinNombreCount = 0
  const proyectosInsert = proyectosLegacy.map((r) => {
    const nuevoId = randomUUID()
    proyectoIdMap.set(r.id, nuevoId)
    const nombre = s(r.data.nombre_proyecto)
    if (!nombre) sinNombreCount++
    const clienteLegacyId = s(r.data.cliente_id)
    return {
      id: nuevoId,
      clienteId: clienteLegacyId ? clienteIdMap.get(clienteLegacyId) ?? null : null,
      nombreProyecto: nombre ?? '(sin nombre)',
      direccionObra: s(r.data.direccion_obra),
      estado: resuelveEstadoProyecto(r.data.estado) as (typeof schema.estadoProyecto.enumValues)[number],
      costosOperativos: s(r.data.costos_operativos) ?? '0',
      imprevistosInstalacion: s(r.data.imprevistos_instalacion) ?? '0',
    }
  })
  if (proyectosInsert.length) await db.insert(schema.proyectos).values(proyectosInsert)
  console.log(`proyectos: ${proyectosInsert.length} migrados (${sinNombreCount} sin nombre -> '(sin nombre)', cotizaciones NO migradas por separado)`)

  // ---- espacio_variantes (descarta huérfanos sin proyecto padre resoluble) ----
  const espaciosLegacy = await fetchNamespace('espacio_variantes')
  const espacioIdMap = new Map<string, string>()
  let espaciosDescartados = 0
  const espaciosInsert: (typeof schema.espacioVariantes.$inferInsert)[] = []
  for (const r of espaciosLegacy) {
    const proyectoLegacyId = s(r.data.proyecto_id)
    const proyectoNuevoId = proyectoLegacyId ? proyectoIdMap.get(proyectoLegacyId) : undefined
    if (!proyectoNuevoId) { espaciosDescartados++; continue } // regla 2
    const nuevoId = randomUUID()
    espacioIdMap.set(r.id, nuevoId)
    espaciosInsert.push({
      id: nuevoId,
      proyectoId: proyectoNuevoId,
      nombreEspacio: s(r.data.nombre_espacio) ?? '(sin nombre)',
      nombreVariante: s(r.data.nombre_variante) ?? 'Inicial',
      descripcion: s(r.data.descripcion),
      activa: Boolean(r.data.activa),
      orden: r.data.orden != null ? Number(r.data.orden) : (r.data.orden_espacio != null ? Number(r.data.orden_espacio) : 0),
      jornadasDesarrolloTecnico: s(r.data.jornadas_desarrollo_tecnico) ?? '0',
      jornadasEnsamblajeTaller: s(r.data.jornadas_ensamblaje_taller) ?? '0',
      jornadasInstalacionObra: s(r.data.jornadas_instalacion_obra) ?? '0',
      // corregido tras revisión manual del Supervisor (2026-08-14): faltaba mapear las fotos.
      // dato legacy real: 'imagenes' nunca es un array JSONB nativo — es null (97 casos) o un
      // STRING que contiene JSON codificado de un array de URLs (42 casos, ej. el string literal
      // '["url1.jpg","url2.jpg"]'). Envolver el string crudo en un array (intento anterior) guarda
      // el texto JSON como si fuera una URL — hay que parsearlo primero.
      fotosEspacio: parseImagenesLegacy(r.data.imagenes),
    })
  }
  if (espaciosInsert.length) await db.insert(schema.espacioVariantes).values(espaciosInsert)
  console.log(`espacio_variantes: ${espaciosInsert.length} migrados, ${espaciosDescartados} descartados (sin proyecto padre resoluble)`)

  // ---- items_variante (descarta huérfanos sin espacio padre resoluble) ----
  const itemsLegacy = await fetchNamespace('items_variante')
  let itemsDescartados = 0
  const itemsInsert: (typeof schema.itemsVariante.$inferInsert)[] = []
  for (const r of itemsLegacy) {
    const varianteLegacyId = s(r.data.variante_id)
    const varianteNuevoId = varianteLegacyId ? espacioIdMap.get(varianteLegacyId) : undefined
    if (!varianteNuevoId) { itemsDescartados++; continue } // regla 2
    const catalogoLegacyId = s(r.data.catalogo_id)
    itemsInsert.push({
      id: randomUUID(),
      varianteId: varianteNuevoId,
      catalogoId: catalogoLegacyId ? catalogoIdMap.get(catalogoLegacyId) ?? null : null,
      cantidad: s(r.data.cantidad) ?? '1',
      precioUnitario: s(r.data.precio_unitario) ?? '0',
      totalLinea: s(r.data.total_linea),
    })
  }
  // ---- items_obra_civil (mano de obra / logística / materiales) -> itemsVariante referencial ----
  // Namespace descubierto en la revisión manual del Supervisor (2026-08-14) — no estaba en el
  // mapeo original (mapeo_campos.md nunca lo listó). Mismo patrón que items_variante pero sin
  // catalogo_id real (siempre viene vacío) y con descripcion_manual + categoria en vez de producto.
  const obraCivilLegacy = await fetchNamespace('items_obra_civil')
  let obraCivilDescartados = 0
  const obraCivilInsert: (typeof schema.itemsVariante.$inferInsert)[] = []
  for (const r of obraCivilLegacy) {
    const varianteLegacyId = s(r.data.variante_id)
    const varianteNuevoId = varianteLegacyId ? espacioIdMap.get(varianteLegacyId) : undefined
    if (!varianteNuevoId) { obraCivilDescartados++; continue }
    obraCivilInsert.push({
      id: randomUUID(),
      varianteId: varianteNuevoId,
      catalogoId: null,
      nombrePersonalizado: s(r.data.descripcion_manual) ?? '(sin descripción)',
      cantidad: s(r.data.cantidad) ?? '1',
      precioUnitario: s(r.data.precio_unitario) ?? '0',
      totalLinea: s(r.data.total_linea),
      esReferencial: true,
      fuenteReferencial: 'obra_civil',
      grupoReferencial: s(r.data.categoria),
    })
  }
  if (obraCivilInsert.length) await db.insert(schema.itemsVariante).values(obraCivilInsert)
  console.log(`items_obra_civil: ${obraCivilInsert.length} migrados como itemsVariante referencial (esReferencial=true, fuenteReferencial='obra_civil'), ${obraCivilDescartados} descartados`)

  if (itemsInsert.length) await db.insert(schema.itemsVariante).values(itemsInsert)
  console.log(`items_variante: ${itemsInsert.length} migrados, ${itemsDescartados} descartados (sin espacio padre resoluble — incluye los 97 ya conocidos + los que colgaban de un espacio también descartado)`)

  console.log('\n=== Resumen ===')
  console.log(`clientes: ${clientesInsert.length}`)
  console.log(`productos_catalogo: ${catalogoInsert.length}`)
  console.log(`proyectos: ${proyectosInsert.length}`)
  console.log(`espacio_variantes: ${espaciosInsert.length} (${espaciosDescartados} descartados)`)
  console.log(`items_variante: ${itemsInsert.length} (${itemsDescartados} descartados)`)
  console.log(`items_obra_civil (referenciales): ${obraCivilInsert.length} (${obraCivilDescartados} descartados)`)

  await prod.end()
  await previewClient.end()
}

main().catch((err) => {
  console.error('Error en el clone:', err)
  process.exit(1)
})
