'use server'
// Hidratación inicial + verificación liviana de versión (§3.1d del plan F10).
// fetchSnapshotAction() alimenta tanto el layout raíz (SSR, sin loading flicker)
// como el polling del Provider cuando detecta cambios. fetchVersionTokenAction()
// es la query barata que el Provider llama cada 2-4s para decidir si hace falta
// traer el snapshot completo.
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { num, numOrNull } from './mappers'
import { emptySnapshot, type StoreSnapshot } from '../snapshot'
import { requireSesionEmpleado } from '@/lib/auth/session'

export async function fetchVersionTokenAction(): Promise<string> {
  // Query barata: MAX(updated_at) de proyectos (toca casi todo flujo de negocio) +
  // COUNT(*) de un puñado de tablas de alto volumen de escritura, sumados en una
  // sola fila. No es un hash exhaustivo de las 55 tablas (eso volvería el poll tan
  // caro como el snapshot completo) — es suficiente para detectar "algo cambió"
  // en la enorme mayoría de los flujos (cotizador, gates, finanzas, compras).
  const rows = await db.execute(sql`
    SELECT
      (SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamptz) FROM proyectos)::text AS max_updated,
      (
        (SELECT COUNT(*) FROM proyectos) + (SELECT COUNT(*) FROM espacio_variantes) +
        (SELECT COUNT(*) FROM items_variante) + (SELECT COUNT(*) FROM contratos) +
        (SELECT COUNT(*) FROM checks_produccion) + (SELECT COUNT(*) FROM novedades_criticas) +
        (SELECT COUNT(*) FROM schemas_proyecto) + (SELECT COUNT(*) FROM verificaciones) +
        (SELECT COUNT(*) FROM ordenes_compra) + (SELECT COUNT(*) FROM movimientos_financieros) +
        (SELECT COUNT(*) FROM instalaciones) + (SELECT COUNT(*) FROM casos_garantia)
      )::text AS total
  `)
  const row = rows[0] as { max_updated: string; total: string } | undefined
  return `${row?.max_updated ?? '0'}:${row?.total ?? '0'}`
}

export async function fetchSnapshotAction(): Promise<StoreSnapshot> {
  const [
    proyectos, clientes, espacios, items, artefactos, catalogo, parametros, contratosRows, hitos,
    proyectosEstadosHistorial,
    cronogramas, cronogramaEtapas, desfasesRows, checksRows, novedades, comunicaciones,
    schemas, bom, verificaciones, retomas, cambiosContrato,
    personas, personasRoles, modulos, estimacionesRows,
    ordenesTrabajo, pedidosWeb, citacionesCalidad, reprocesos, instalaciones,
    actasEntrega, casosGarantia, citasGarantia,
    cuentasFinancieras, movimientosFinancieros, obligacionesPendientes,
    proveedores, ordenesCompra, registrosGateCaja, cuentasCobroProveedor,
    categorias, productosTiendaRows, productosTiendaComponentes,
    catalogoAcabados, catalogoProductoAcabados, acabadosMuestras,
    portafolio, modulosArtefactos, bitacoraArticulos, testimonios,
    itemsOrdenCompra, recepcionesMaterial, herramientas, documentosProyecto,
  ] = await Promise.all([
    db.select().from(s.proyectos),
    db.select().from(s.clientes),
    db.select().from(s.espacioVariantes),
    db.select().from(s.itemsVariante),
    db.select().from(s.espaciosArtefactos),
    db.select().from(s.productosCatalogo),
    db.select().from(s.parametros),
    db.select().from(s.contratos),
    db.select().from(s.hitosPago),
    db.select().from(s.proyectosEstadosHistorial),
    db.select().from(s.cronogramas),
    db.select().from(s.cronogramaEtapas),
    db.select().from(s.desfasesCronograma),
    db.select().from(s.checksProduccion),
    db.select().from(s.novedadesCriticas),
    db.select().from(s.comunicacionesProgreso),
    db.select().from(s.schemasProyecto),
    db.select().from(s.bomMaterial),
    db.select().from(s.verificaciones),
    db.select().from(s.retomas),
    db.select().from(s.cambiosContrato),
    db.select().from(s.personas),
    db.select().from(s.personasRoles),
    db.select().from(s.modulos),
    db.select().from(s.estimaciones),
    db.select().from(s.ordenesTrabajo),
    db.select().from(s.pedidosWeb),
    db.select().from(s.citacionesCalidad),
    db.select().from(s.reprocesos),
    db.select().from(s.instalaciones),
    db.select().from(s.actasEntrega),
    db.select().from(s.casosGarantia),
    db.select().from(s.citasGarantia),
    db.select().from(s.cuentasFinancieras),
    db.select().from(s.movimientosFinancieros),
    db.select().from(s.obligacionesPendientes),
    db.select().from(s.proveedores),
    db.select().from(s.ordenesCompra),
    db.select().from(s.registrosGateCaja),
    db.select().from(s.cuentasCobroProveedor),
    db.select().from(s.categorias),
    db.select().from(s.productosTienda),
    db.select().from(s.productosTiendaComponentes),
    db.select().from(s.catalogoAcabados),
    db.select().from(s.catalogoProductoAcabados),
    db.select().from(s.acabadosMuestras),
    db.select().from(s.portafolio),
    db.select().from(s.modulosArtefactos),
    db.select().from(s.bitacoraArticulos),
    db.select().from(s.testimonios),
    db.select().from(s.itemsOrdenCompra),
    db.select().from(s.recepcionesMaterial),
    db.select().from(s.herramientas),
    db.select().from(s.documentosProyecto),
  ])

  const version = await fetchVersionTokenAction()
  const base = emptySnapshot()

  // Usuario real de la sesión de empleado (D-08b, F10 2026-08-15) — sin
  // llamada extra a DB, requireSesionEmpleado() solo lee la cookie. Sin
  // sesión (visitante público, portal cliente, o /erp/login sin loguear
  // todavía) cae en el placeholder — inofensivo acá: middleware.ts ya
  // bloqueó el acceso a cualquier página real de /erp/** antes de esto.
  const sesionEmpleado = await requireSesionEmpleado()
  const usuario = sesionEmpleado
    ? { id: sesionEmpleado.usuarioId, email: sesionEmpleado.email, nombre: sesionEmpleado.nombre, rol: sesionEmpleado.rol }
    : base.usuario

  return {
    ...base,
    version,
    proyectos: proyectos as StoreSnapshot['proyectos'],
    clientes: clientes as StoreSnapshot['clientes'],
    espacios: espacios as StoreSnapshot['espacios'],
    items: items as StoreSnapshot['items'],
    artefactos: artefactos as StoreSnapshot['artefactos'],
    catalogo: catalogo as StoreSnapshot['catalogo'],
    parametros: parametros as StoreSnapshot['parametros'],
    contratos: contratosRows as StoreSnapshot['contratos'],
    hitos: hitos as StoreSnapshot['hitos'],
    usuario,
    proyectosEstadosHistorial: proyectosEstadosHistorial as StoreSnapshot['proyectosEstadosHistorial'],
    cronogramas: cronogramas as StoreSnapshot['cronogramas'],
    cronogramaEtapas: cronogramaEtapas as StoreSnapshot['cronogramaEtapas'],
    desfases: desfasesRows as StoreSnapshot['desfases'],
    checks: checksRows.map(c => ({
      ...c,
      ratioInsumos: num(c.ratioInsumos), ratioPagos: num(c.ratioPagos), ratioProduccion: num(c.ratioProduccion),
      comisionesReducidasPct: numOrNull(c.comisionesReducidasPct),
    })) as StoreSnapshot['checks'],
    novedades: novedades as StoreSnapshot['novedades'],
    comunicaciones: comunicaciones as StoreSnapshot['comunicaciones'],
    schemas: schemas as StoreSnapshot['schemas'],
    bom: bom as StoreSnapshot['bom'],
    verificaciones: verificaciones as StoreSnapshot['verificaciones'],
    retomas: retomas as StoreSnapshot['retomas'],
    cambiosContrato: cambiosContrato as StoreSnapshot['cambiosContrato'],
    personas: personas as StoreSnapshot['personas'],
    personasRoles: personasRoles as StoreSnapshot['personasRoles'],
    modulos: modulos as StoreSnapshot['modulos'],
    estimaciones: estimacionesRows.map(e => ({ ...e, factorCrecimiento: num(e.factorCrecimiento) })) as StoreSnapshot['estimaciones'],
    ordenesTrabajo: ordenesTrabajo as StoreSnapshot['ordenesTrabajo'],
    pedidosWeb: pedidosWeb as StoreSnapshot['pedidosWeb'],
    citacionesCalidad: citacionesCalidad as StoreSnapshot['citacionesCalidad'],
    reprocesos: reprocesos as StoreSnapshot['reprocesos'],
    instalaciones: instalaciones as StoreSnapshot['instalaciones'],
    actasEntrega: actasEntrega as StoreSnapshot['actasEntrega'],
    casosGarantia: casosGarantia as StoreSnapshot['casosGarantia'],
    citasGarantia: citasGarantia as StoreSnapshot['citasGarantia'],
    cuentasFinancieras: cuentasFinancieras as StoreSnapshot['cuentasFinancieras'],
    movimientosFinancieros: movimientosFinancieros as StoreSnapshot['movimientosFinancieros'],
    obligacionesPendientes: obligacionesPendientes as StoreSnapshot['obligacionesPendientes'],
    proveedores: proveedores as StoreSnapshot['proveedores'],
    ordenesCompra: ordenesCompra as StoreSnapshot['ordenesCompra'],
    registrosGateCaja: registrosGateCaja as StoreSnapshot['registrosGateCaja'],
    cuentasCobroProveedor: cuentasCobroProveedor as StoreSnapshot['cuentasCobroProveedor'],
    categorias: categorias as StoreSnapshot['categorias'],
    productosTienda: productosTiendaRows.map(p => ({ ...p, calificacionPromedio: numOrNull(p.calificacionPromedio) })) as StoreSnapshot['productosTienda'],
    productosTiendaComponentes: productosTiendaComponentes as StoreSnapshot['productosTiendaComponentes'],
    catalogoAcabados: catalogoAcabados as StoreSnapshot['catalogoAcabados'],
    catalogoProductoAcabados: catalogoProductoAcabados as StoreSnapshot['catalogoProductoAcabados'],
    acabadosMuestras: acabadosMuestras as StoreSnapshot['acabadosMuestras'],
    portafolio: portafolio as StoreSnapshot['portafolio'],
    modulosArtefactos: modulosArtefactos as StoreSnapshot['modulosArtefactos'],
    bitacoraArticulos: bitacoraArticulos as StoreSnapshot['bitacoraArticulos'],
    testimonios: testimonios as StoreSnapshot['testimonios'],
    itemsOrdenCompra: itemsOrdenCompra as StoreSnapshot['itemsOrdenCompra'],
    recepcionesMaterial: recepcionesMaterial as StoreSnapshot['recepcionesMaterial'],
    herramientas: herramientas as StoreSnapshot['herramientas'],
    documentosProyecto: documentosProyecto as StoreSnapshot['documentosProyecto'],
  }
}
