'use server'
// Server Actions de lectura escopada para el sitio público y el portal cliente.
// Fix de arquitectura (auditoría 2026-08-15, arnes/lineas/demanda/auditoria_prelanzamiento_seo_20260815.md):
// antes, estas páginas leían de useDataStore()/<DataStoreProvider>, cuyo snapshot (hidratado en
// el layout raíz) contenía TODAS las tablas del ERP sin proyección — cualquier página pública
// filtraba client-side sobre datos de TODOS los clientes/proyectos, ya presentes en el HTML/RSC
// payload. Acá cada función trae por SQL solo lo que la página necesita. Mismo patrón dual
// DATA_IMPL ya establecido en lib/data/actions/portafolio.ts.
import { eq, and, or, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type {
  Portafolio, ProductoTienda, CatalogoAcabado, AcabadoMuestra,
  Proyecto, EspacioVariante, ItemVariante, Contrato, HitoPago,
  ObligacionPendiente, MovimientoFinanciero, ComunicacionProgreso,
  Instalacion, ActaEntrega, CasoGarantia, Modulo, Cliente,
  Testimonio, AtributoTecnico,
} from '../contracts'

export interface FotoGaleriaEspacio {
  url: string
  alt: string
  esRender: boolean
}

const DATA_IMPL = () => process.env.DATA_IMPL ?? 'mock'

// --- Marketing (sin PII, sin datos financieros) ---

export async function listarPortafolioPublicadosAction(): Promise<Portafolio[]> {
  if (DATA_IMPL() === 'drizzle') {
    const rows = await db.select().from(s.portafolio).where(eq(s.portafolio.publicado, true))
    return (rows as unknown as Portafolio[])
      .slice()
      .sort((a, b) => (a.destacado === b.destacado ? a.orden - b.orden : (a.destacado ? -1 : 1)))
  }
  const { getDataStore } = await import('@/lib/data/store')
  return getDataStore().portafolio.publicados()
}

// Testimonios publicados (Home, D-01-9). Escopado y sin PII financiera: solo los campos que ya
// expone el sitio (contenido, nombreAutor, barrio, tipoProyecto, rating, fuente, urlFuente).
export async function listarTestimoniosPublicadosAction(): Promise<Testimonio[]> {
  if (DATA_IMPL() === 'drizzle') {
    const rows = await db.select().from(s.testimonios).where(eq(s.testimonios.publicado, true))
    return (rows as unknown as Testimonio[])
  }
  const { getDataStore } = await import('@/lib/data/store')
  return getDataStore().testimonios.publicados()
}

// F-09 (2026-08-17): galería por tipo de espacio para las landings públicas — junta las fotos
// publicadas de Portafolio con ese tipo y las imágenes cargadas en /erp/portafolio/renders,
// sin distinción visible entre unas y otras (Javier las administra libremente desde el ERP).
export async function obtenerGaleriaEspacioAction(tipoEspacio: string): Promise<FotoGaleriaEspacio[]> {
  const fotos: FotoGaleriaEspacio[] = []

  if (DATA_IMPL() === 'drizzle') {
    // Herencia real (estado.md 2026-08-17): el tipo de espacio se toma de espacio_variantes.tipoEspacio
    // vía espacioVarianteId, NO de portafolio.categoriaEspacio (campo con datos sucios históricos:
    // "Residencial", "Cocina y Zona Social", etc.). Se acepta además categoriaEspacio === tipoEspacio
    // por si algún registro aún no tiene el FK poblado.
    const proyectosPublicados = await db.select()
      .from(s.portafolio)
      .leftJoin(s.espacioVariantes, eq(s.portafolio.espacioVarianteId, s.espacioVariantes.id))
      .where(and(
        eq(s.portafolio.publicado, true),
        or(eq(s.espacioVariantes.tipoEspacio, tipoEspacio), eq(s.portafolio.categoriaEspacio, tipoEspacio)),
      ))
    // Agrupamos las fotos por proyecto para intercalarlas (round-robin) después,
    // garantizando que al menos una foto de cada proyecto asociado aparezca en la muestra.
    const fotosPorProyecto: FotoGaleriaEspacio[][] = []
    for (const row of proyectosPublicados) {
      const p = row.portafolio
      const galeria = ((p.galeriaPortafolioUrl as string[] | null) ?? [])
      const urls = galeria.length > 0 ? galeria : (p.imagenPortafolioUrl ? [p.imagenPortafolioUrl] : [])
      if (urls.length > 0) fotosPorProyecto.push(urls.map((url) => ({ url, alt: p.titulo, esRender: false })))
    }
    // Intercalado round-robin: reparte una foto de cada proyecto por vuelta hasta agotarlas.
    const colas = fotosPorProyecto.filter((g) => g.length > 0)
    let vuelta = 0
    while (colas.some((g) => g.length > 0)) {
      const g = colas[vuelta % colas.length]
      if (g.length > 0) fotos.push(g.shift()!)
      vuelta++
    }

    const renders = await db.select().from(s.rendersConceptuales)
      .where(and(eq(s.rendersConceptuales.tipoEspacio, tipoEspacio), eq(s.rendersConceptuales.visible, true)))
    renders
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .forEach((r) => fotos.push({ url: r.imagenUrl, alt: r.titulo ?? '', esRender: true }))
    return fotos
  }

  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  const fotosPorProyectoMock: FotoGaleriaEspacio[][] = []
  store.portafolio.publicados()
    .filter((p) => p.categoriaEspacio === tipoEspacio)
    .forEach((p) => {
      const urls = p.galeriaPortafolioUrl.length > 0 ? p.galeriaPortafolioUrl : (p.imagenPortafolioUrl ? [p.imagenPortafolioUrl] : [])
      if (urls.length > 0) fotosPorProyectoMock.push(urls.map((url) => ({ url, alt: p.titulo, esRender: false })))
    })
  const colasMock = fotosPorProyectoMock.filter((g) => g.length > 0)
  let vueltaMock = 0
  while (colasMock.some((g) => g.length > 0)) {
    const g = colasMock[vueltaMock % colasMock.length]
    if (g.length > 0) fotos.push(g.shift()!)
    vueltaMock++
  }
  store.renderesConceptuales.porTipoEspacio(tipoEspacio)
    .forEach((r) => fotos.push({ url: r.imagenUrl, alt: r.titulo ?? '', esRender: true }))
  return fotos
}

// Tarjetas del slider "Validación Técnica" de la landing de un tipo de espacio (2026-08-25,
// reemplaza el objeto estático ATRIBUTOS_ESPACIOS que vivía en lib/data/espacios-atributos.ts).
// Solo visible=true, ordenadas por `orden` — el componente las agrupa de a 4 por folio.
export async function obtenerAtributosTecnicosAction(tipoEspacio: string): Promise<AtributoTecnico[]> {
  if (DATA_IMPL() === 'drizzle') {
    const rows = await db.select().from(s.atributosTecnicos)
      .where(and(eq(s.atributosTecnicos.tipoEspacio, tipoEspacio), eq(s.atributosTecnicos.visible, true)))
    return (rows as unknown as AtributoTecnico[]).slice().sort((a, b) => a.orden - b.orden)
  }
  const { getDataStore } = await import('@/lib/data/store')
  return getDataStore().atributosTecnicos.porTipoEspacio(tipoEspacio)
}

export async function listarProductosTiendaVisiblesAction(): Promise<ProductoTienda[]> {
  if (DATA_IMPL() === 'drizzle') {
    const rows = await db.select().from(s.productosTienda).where(eq(s.productosTienda.visibleEnTienda, true))
    return rows as unknown as ProductoTienda[]
  }
  const { getDataStore } = await import('@/lib/data/store')
  return getDataStore().productosTienda.visibles()
}

export interface CatalogoPublico {
  sku: string
  descripcion: string
  imagenUrl: string | null
  categoriaComercial: string | null
}

export interface AcabadoConMuestras extends CatalogoAcabado {
  muestras: AcabadoMuestra[]
}

export interface ProductoTiendaDetalle {
  producto: ProductoTienda
  catalogoPublico: CatalogoPublico | null
  acabados: AcabadoConMuestras[]
}

// R3 (colecciones/[id]): proyección segura del catálogo — sin precioDirecto/stockActual/proveedorId.
export async function obtenerProductoTiendaConDetalleAction(id: string): Promise<ProductoTiendaDetalle | null> {
  if (DATA_IMPL() === 'drizzle') {
    const [producto] = await db.select().from(s.productosTienda).where(eq(s.productosTienda.id, id)).limit(1)
    if (!producto || !producto.visibleEnTienda) return null

    const [catalogo] = await db.select().from(s.productosCatalogo).where(eq(s.productosCatalogo.id, producto.catalogoId)).limit(1)
    const relaciones = await db.select().from(s.catalogoProductoAcabados).where(eq(s.catalogoProductoAcabados.productoCatalogoId, producto.catalogoId))
    const acabadoIds = relaciones.map((r) => r.acabadoId)

    const acabadosRows = acabadoIds.length
      ? await db.select().from(s.catalogoAcabados).where(inArray(s.catalogoAcabados.id, acabadoIds))
      : []
    const muestrasRows = acabadoIds.length
      ? await db.select().from(s.acabadosMuestras).where(and(inArray(s.acabadosMuestras.acabadoId, acabadoIds), eq(s.acabadosMuestras.disponibleWeb, true)))
      : []

    return {
      producto: producto as unknown as ProductoTienda,
      catalogoPublico: catalogo
        ? { sku: catalogo.sku, descripcion: catalogo.descripcion, imagenUrl: catalogo.imagenUrl, categoriaComercial: catalogo.categoriaComercial }
        : null,
      acabados: (acabadosRows as unknown as CatalogoAcabado[]).map((a) => ({
        ...a,
        muestras: (muestrasRows as unknown as AcabadoMuestra[]).filter((m) => m.acabadoId === a.id),
      })),
    }
  }

  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  const producto = store.productosTienda.obtenerPorId(id)
  if (!producto || !producto.visibleEnTienda) return null
  const catalogo = store.catalogo.obtenerPorId(producto.catalogoId)
  const acabadosRelacion = catalogo ? store.catalogoProductoAcabados.porProducto(catalogo.id) : []
  const acabados = acabadosRelacion
    .map((r) => store.catalogoAcabados.listar().find((a) => a.id === r.acabadoId))
    .filter((a): a is CatalogoAcabado => Boolean(a))
    .map((a) => ({ ...a, muestras: store.acabadosMuestras.porAcabado(a.id).filter((m) => m.disponibleWeb) }))

  return {
    producto,
    catalogoPublico: catalogo
      ? { sku: catalogo.sku, descripcion: catalogo.descripcion, imagenUrl: catalogo.imagenUrl, categoriaComercial: catalogo.categoriaComercial }
      : null,
    acabados,
  }
}

// --- Propuesta pública (F-08, /propuesta/[proyectoId]) ---
// R2 (disenio_F08_propuesta_publica.md §4): snapshot proyecta solo campos públicos — sin id
// interno/costo/margen/proveedorId del catálogo, sin traer clientes/personas/movimientosFinancieros/
// proveedores (a diferencia del snapshot completo que este fix reemplaza).

export interface CatalogoItemPublico {
  descripcion: string
  unidadMedida: string | null
  imagenUrl: string | null
  galeriaImagenesUrl: string[]
  sku: string
}

export interface PropuestaPublicaData {
  proyecto: Proyecto
  espacios: EspacioVariante[]
  items: ItemVariante[]
  catalogoPorId: Record<string, CatalogoItemPublico>
  contrato: Contrato | null
  hitos: HitoPago[]
  tarifas: { tarifaDev: number; tarifaAssembly: number; tarifaInstall: number }
}

const HORAS_POR_JORNADA = 8

export async function obtenerPropuestaPublicaAction(proyectoId: string): Promise<PropuestaPublicaData | null> {
  if (DATA_IMPL() === 'drizzle') {
    const [proyecto] = await db.select().from(s.proyectos).where(eq(s.proyectos.id, proyectoId)).limit(1)
    if (!proyecto) return null

    const espacios = await db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, proyectoId))
    const varianteIds = espacios.map((e) => e.id)
    const items = varianteIds.length
      ? await db.select().from(s.itemsVariante).where(inArray(s.itemsVariante.varianteId, varianteIds))
      : []

    const catalogoIds = [...new Set(items.map((it) => it.catalogoId).filter((id): id is string => Boolean(id)))]
    const catalogoRows = catalogoIds.length
      ? await db.select().from(s.productosCatalogo).where(inArray(s.productosCatalogo.id, catalogoIds))
      : []
    const catalogoPorId: Record<string, CatalogoItemPublico> = {}
    for (const c of catalogoRows) {
      catalogoPorId[c.id] = {
        descripcion: c.descripcion,
        unidadMedida: c.unidadMedida,
        imagenUrl: c.imagenUrl,
        galeriaImagenesUrl: (c.galeriaImagenesUrl as string[] | null) ?? [],
        sku: c.sku,
      }
    }

    const [contratoRow] = await db.select().from(s.contratos).where(eq(s.contratos.proyectoId, proyectoId)).limit(1)
    const hitos = contratoRow
      ? await db.select().from(s.hitosPago).where(eq(s.hitosPago.contratoId, contratoRow.id))
      : []

    const clavesTarifa = ['valor_hora_desarrollador', 'valor_hora_carpintero', 'valor_hora_auxiliar']
    const parametrosRows = await db.select().from(s.parametros).where(inArray(s.parametros.clave, clavesTarifa))
    const valorPorClave = (clave: string): number => {
      const p = parametrosRows.find((r) => r.clave === clave)
      const n = Number(p?.valorNumeric ?? p?.valorTexto)
      return Number.isFinite(n) ? n : 0
    }
    // Mismos defaults que PARAMETROS_DEFAULT (lib/modules/finanzas) si el parámetro no existe.
    const { PARAMETROS_DEFAULT } = await import('@/lib/modules/finanzas')
    const valorDev = valorPorClave('valor_hora_desarrollador') || Number(PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.desarrollador)
    const valorCarp = valorPorClave('valor_hora_carpintero') || Number(PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.carpintero)
    const valorAux = valorPorClave('valor_hora_auxiliar') || Number(PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.auxiliar)

    return {
      proyecto: proyecto as unknown as Proyecto,
      espacios: espacios as unknown as EspacioVariante[],
      items: items as unknown as ItemVariante[],
      catalogoPorId,
      contrato: (contratoRow as unknown as Contrato) ?? null,
      hitos: hitos as unknown as HitoPago[],
      tarifas: {
        tarifaDev: valorDev * HORAS_POR_JORNADA,
        tarifaAssembly: valorCarp * HORAS_POR_JORNADA,
        tarifaInstall: valorAux * HORAS_POR_JORNADA,
      },
    }
  }

  const { getDataStore } = await import('@/lib/data/store')
  const { PARAMETROS_DEFAULT } = await import('@/lib/modules/finanzas')
  const store = getDataStore()
  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  if (!proyecto) return null

  const espacios = store.espacios.porProyecto(proyectoId)
  const items = espacios.flatMap((e) => store.items.porVariante(e.id))
  const catalogoPorId: Record<string, CatalogoItemPublico> = {}
  for (const it of items) {
    if (!it.catalogoId || catalogoPorId[it.catalogoId]) continue
    const c = store.catalogo.obtenerPorId(it.catalogoId)
    if (c) {
      catalogoPorId[it.catalogoId] = {
        descripcion: c.descripcion, unidadMedida: c.unidadMedida, imagenUrl: c.imagenUrl,
        galeriaImagenesUrl: c.galeriaImagenesUrl ?? [], sku: c.sku,
      }
    }
  }
  const contrato = store.contratos.porProyecto(proyectoId) ?? null
  const hitos = contrato ? store.hitos.porContrato(contrato.id) : []
  const p = (clave: string) => store.parametros.obtenerPorClave(clave)?.valorTexto ?? store.parametros.obtenerPorClave(clave)?.valorNumeric ?? null
  const valorDev = Number(p('valor_hora_desarrollador')) || Number(PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.desarrollador)
  const valorCarp = Number(p('valor_hora_carpintero')) || Number(PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.carpintero)
  const valorAux = Number(p('valor_hora_auxiliar')) || Number(PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.auxiliar)

  return {
    proyecto, espacios, items, catalogoPorId, contrato, hitos,
    tarifas: {
      tarifaDev: valorDev * HORAS_POR_JORNADA,
      tarifaAssembly: valorCarp * HORAS_POR_JORNADA,
      tarifaInstall: valorAux * HORAS_POR_JORNADA,
    },
  }
}

// --- Portal cliente (F-07, /cuenta/**) — escopado por clienteId/proyectoId, no el snapshot global ---

export interface ProyectoClienteResumen {
  proyecto: Proyecto
  espaciosCount: number
  contrato: Contrato | null
  obligaciones: ObligacionPendiente[]
}

export interface ProyectosClienteData {
  cliente: Cliente | null
  proyectos: ProyectoClienteResumen[]
}

export async function obtenerProyectosClienteAction(clienteId: string): Promise<ProyectosClienteData> {
  if (DATA_IMPL() === 'drizzle') {
    const [cliente] = await db.select().from(s.clientes).where(eq(s.clientes.id, clienteId)).limit(1)
    const proyectosRows = await db.select().from(s.proyectos).where(eq(s.proyectos.clienteId, clienteId))
    const proyectos: ProyectoClienteResumen[] = []
    for (const proyecto of proyectosRows) {
      const espacios = await db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, proyecto.id))
      const [contrato] = await db.select().from(s.contratos).where(eq(s.contratos.proyectoId, proyecto.id)).limit(1)
      const obligaciones = await db.select().from(s.obligacionesPendientes).where(eq(s.obligacionesPendientes.proyectoId, proyecto.id))
      proyectos.push({
        proyecto: proyecto as unknown as Proyecto,
        espaciosCount: espacios.length,
        contrato: (contrato as unknown as Contrato) ?? null,
        obligaciones: obligaciones as unknown as ObligacionPendiente[],
      })
    }
    return { cliente: (cliente as unknown as Cliente) ?? null, proyectos }
  }

  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  const cliente = store.clientes.obtenerPorId(clienteId) ?? null
  const proyectos = store.proyectos.listar()
    .filter((p) => p.clienteId === clienteId)
    .map((proyecto) => ({
      proyecto,
      espaciosCount: store.espacios.porProyecto(proyecto.id).length,
      contrato: store.contratos.porProyecto(proyecto.id) ?? null,
      obligaciones: store.obligacionesPendientes.porProyecto(proyecto.id),
    }))
  return { cliente, proyectos }
}

export interface ProyectoClienteDetalle {
  proyecto: Proyecto
  espacios: EspacioVariante[]
  contrato: Contrato | null
  obligaciones: ObligacionPendiente[]
  movimientos: MovimientoFinanciero[]
  comunicaciones: ComunicacionProgreso[]
  instalaciones: Instalacion[]
  actaEntrega: ActaEntrega | null
  casosGarantia: CasoGarantia[]
  modulos: Modulo[]
}

// Verifica ownership de nuevo server-side (defensa en profundidad — el caller ya validó
// requireSesionCliente() + proyecto.clienteId === clienteId antes de llamar, ver page.tsx).
export async function obtenerProyectoClienteAction(proyectoId: string, clienteId: string): Promise<ProyectoClienteDetalle | null> {
  if (DATA_IMPL() === 'drizzle') {
    const [proyecto] = await db.select().from(s.proyectos).where(eq(s.proyectos.id, proyectoId)).limit(1)
    if (!proyecto || proyecto.clienteId !== clienteId) return null

    const [espacios, contratoRows, obligaciones, movimientos, comunicacionesRows, instalacionesRows, actaEntregaRows, casosGarantiaRows, modulosRows] = await Promise.all([
      db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, proyectoId)),
      db.select().from(s.contratos).where(eq(s.contratos.proyectoId, proyectoId)).limit(1),
      db.select().from(s.obligacionesPendientes).where(eq(s.obligacionesPendientes.proyectoId, proyectoId)),
      db.select().from(s.movimientosFinancieros).where(eq(s.movimientosFinancieros.proyectoId, proyectoId)),
      db.select().from(s.comunicacionesProgreso).where(and(eq(s.comunicacionesProgreso.proyectoId, proyectoId), eq(s.comunicacionesProgreso.visibleAlCliente, true))),
      db.select().from(s.instalaciones).where(eq(s.instalaciones.proyectoId, proyectoId)),
      db.select().from(s.actasEntrega).where(eq(s.actasEntrega.proyectoId, proyectoId)).limit(1),
      db.select().from(s.casosGarantia).where(eq(s.casosGarantia.proyectoId, proyectoId)),
      db.select().from(s.modulos).where(eq(s.modulos.proyectoId, proyectoId)),
    ])

    return {
      proyecto: proyecto as unknown as Proyecto,
      espacios: espacios as unknown as EspacioVariante[],
      contrato: (contratoRows[0] as unknown as Contrato) ?? null,
      obligaciones: obligaciones as unknown as ObligacionPendiente[],
      movimientos: movimientos as unknown as MovimientoFinanciero[],
      comunicaciones: comunicacionesRows as unknown as ComunicacionProgreso[],
      instalaciones: instalacionesRows as unknown as Instalacion[],
      actaEntrega: (actaEntregaRows[0] as unknown as ActaEntrega) ?? null,
      casosGarantia: casosGarantiaRows as unknown as CasoGarantia[],
      modulos: modulosRows as unknown as Modulo[],
    }
  }

  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  if (!proyecto || proyecto.clienteId !== clienteId) return null

  return {
    proyecto,
    espacios: store.espacios.porProyecto(proyectoId),
    contrato: store.contratos.porProyecto(proyectoId) ?? null,
    obligaciones: store.obligacionesPendientes.porProyecto(proyectoId),
    movimientos: store.movimientosFinancieros.porProyecto(proyectoId),
    comunicaciones: store.comunicaciones.visiblesAlCliente(proyectoId),
    instalaciones: store.instalaciones.porProyecto(proyectoId),
    actaEntrega: store.actasEntrega.porProyecto(proyectoId) ?? null,
    casosGarantia: store.casosGarantia.porProyecto(proyectoId),
    modulos: store.modulos.porProyecto(proyectoId),
  }
}

export interface GarantiasClienteData {
  casos: CasoGarantia[]
  proyectos: Proyecto[]
}

export async function obtenerGarantiasClienteAction(clienteId: string): Promise<GarantiasClienteData> {
  if (DATA_IMPL() === 'drizzle') {
    const [casos, proyectos] = await Promise.all([
      db.select().from(s.casosGarantia).where(eq(s.casosGarantia.clienteId, clienteId)),
      db.select().from(s.proyectos).where(eq(s.proyectos.clienteId, clienteId)),
    ])
    return { casos: casos as unknown as CasoGarantia[], proyectos: proyectos as unknown as Proyecto[] }
  }

  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  return {
    casos: store.casosGarantia.porCliente(clienteId),
    proyectos: store.proyectos.listar().filter((p) => p.clienteId === clienteId),
  }
}

// --- Precios Parametrizados (Fase 1 - Plan B3) ---

export async function obtenerPrecioAsesoria3dAction(): Promise<number | null> {
  if (DATA_IMPL() === 'drizzle') {
    const [param] = await db.select().from(s.parametros).where(eq(s.parametros.clave, 'precio_asesoria_3d')).limit(1)
    if (!param || !param.valorNumeric) return null
    const valor = Number(param.valorNumeric)
    return Number.isNaN(valor) ? null : valor
  }

  const { getDataStore } = await import('@/lib/data/store')
  const param = getDataStore().parametros.obtenerPorClave('precio_asesoria_3d')
  if (!param || !param.valorNumeric) return null
  const valor = Number(param.valorNumeric)
  return Number.isNaN(valor) ? null : valor
}

export async function obtenerHeroCarouselImagesAction(categoriaEspacio?: string): Promise<{src: string, alt: string}[]> {
  const limit = 5;
  const fotos: {src: string, alt: string}[] = [];

  if (DATA_IMPL() === 'drizzle') {
    let query = db.select().from(s.portafolio).where(eq(s.portafolio.publicado, true));
    if (categoriaEspacio) {
      query = db.select().from(s.portafolio).where(and(eq(s.portafolio.publicado, true), eq(s.portafolio.categoriaEspacio, categoriaEspacio)));
    }
    
    const rows = await query;
    // Ordenamos por orden (los más recientes/destacados)
    const sorted = (rows as unknown as Portafolio[]).sort((a, b) => a.orden - b.orden);
    
    for (const p of sorted) {
      if (p.imagenPortafolioUrl) {
        // Evitar duplicados de la misma URL
        if (!fotos.find(f => f.src === p.imagenPortafolioUrl)) {
          fotos.push({ src: p.imagenPortafolioUrl, alt: p.titulo });
        }
      }
      if (fotos.length >= limit) break;
    }
  } else {
    const { getDataStore } = await import('@/lib/data/store')
    const store = getDataStore()
    let proyectos = store.portafolio.publicados();
    if (categoriaEspacio) {
      proyectos = proyectos.filter(p => p.categoriaEspacio === categoriaEspacio);
    }
    proyectos.sort((a, b) => a.orden - b.orden);
    for (const p of proyectos) {
      if (p.imagenPortafolioUrl) {
        if (!fotos.find(f => f.src === p.imagenPortafolioUrl)) {
          fotos.push({ src: p.imagenPortafolioUrl, alt: p.titulo });
        }
      }
      if (fotos.length >= limit) break;
    }
  }

  return fotos;
}
