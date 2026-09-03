// Repositorio mock en memoria. Datos reales del negocio cargados desde fixtures.
// Todas las mutaciones son sobre el grafo en memoria; se resetean al reiniciar el servidor.
import type {
  DataStore, Proyecto, Cliente, EspacioVariante, ItemVariante, ProductoCatalogo, EspacioArtefacto, Parametro, Contrato, HitoPago, TransicionesProyecto, UsuarioMock, ProyectosEstadosHistorial, Cronograma, CronogramaEtapa, DesfaseCronograma, CheckProduccion, NovedadCritica, ComunicacionProgreso, SchemaProyecto, BomMaterial, Verificacion, Retoma, CambioContrato, Persona, PersonaRol, Modulo, Estimacion, LineaCronograma, EtapaCronograma, TipoGate, VeredictoGate, DesenlaceCheck, CausaDesfase, EstadoNovedadCritica, EstadoSchema, RolCanonico, OrigenBom, EstadoProyecto,
  OrdenTrabajo, TipoOrdenTrabajo, PedidoWeb, CitacionCalidad, Reproceso, OrigenReproceso, Instalacion, ActaEntrega, CasoGarantia, CitaGarantia,
  CuentaFinanciera, MovimientoFinanciero, ObligacionPendiente, OrigenObligacion, EstadoObligacion, Proveedor, OrdenCompra, EstadoOrdenCompra, RegistroGateCaja, CuentaCobroProveedor,
  Categoria, ProductoTienda, ProductoTiendaComponente, CatalogoAcabado, CatalogoProductoAcabado, AcabadoMuestra,
  Portafolio, ModuloArtefacto, TipoModuloArtefacto, FuenteModuloArtefacto,
  ItemOrdenCompra, RecepcionMaterial, EstadoRecepcionMaterial, Herramienta, EstadoOperativoHerramienta,
  DocumentoProyecto, MacroFaseProyecto, AlojadorDocumento,
  BitacoraArticulo, Testimonio, RenderConceptual, AtributoTecnico, CatalogoEspacioArquitectonico,
  NotaReunion,
} from './contracts'
import { SHOP_CATEGORIAS } from './contracts'
import { coincide } from '../search/normalizar'
import { masRecientePrimero } from './orden'
import { generarSlugPortafolioBase } from '../utils/portafolio-slug'
import { derivarDesenlace, derivarReduccionComision, P18, P33 } from '../modules/f3/gates'
import {
  transicionModuloValida, puedeEmitirVeredictoCalidad, P24, rangoInstalacionValido,
  dentroGarantiaContractual, calcularCajaDisponible,
} from '../modules/f4f5f6/gates'
import {
  PROYECTOS, CLIENTES, ESPACIOS, ITEMS, ARTEFACTOS, CATALOGO, PARAMETROS,
  CONTRATO_CANONICO, HITOS, USUARIOS,
  PERSONAS, PERSONAS_ROLES, CRONOGRAMAS, CRONOGRAMA_ETAPAS, DESFASES, CHECKS,
  NOVEDADES, COMUNICACIONES, SCHEMAS, BOM, VERIFICACIONES, RETOMAS, CAMBIOS_CONTRATO,
  MODULOS, ESTIMACIONES,
  ORDENES_TRABAJO, PEDIDOS_WEB, CITACIONES_CALIDAD, REPROCESOS, INSTALACIONES, ACTAS_ENTREGA,
  CASOS_GARANTIA, CITAS_GARANTIA, CUENTAS_FINANCIERAS, MOVIMIENTOS_FINANCIEROS, OBLIGACIONES_PENDIENTES,
  PROVEEDORES, ORDENES_COMPRA, REGISTROS_GATE_CAJA, CUENTAS_COBRO_PROVEEDOR,
  CATEGORIAS, PRODUCTOS_TIENDA, PRODUCTOS_TIENDA_COMPONENTES, CATALOGO_ACABADOS, CATALOGO_PRODUCTO_ACABADOS, ACABADOS_MUESTRAS,
  PORTAFOLIO, MODULOS_ARTEFACTOS, CATALOGO_ESPACIOS_ARQUITECTONICOS,
  ITEMS_ORDEN_COMPRA, RECEPCIONES_MATERIAL, HERRAMIENTAS, DOCUMENTOS_PROYECTO,
  BITACORA_ARTICULOS,
} from './fixtures'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function numDe(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function createMockStore(): DataStore {
  const proyectos: Proyecto[] = deepClone(PROYECTOS)
  const clientes: Cliente[] = deepClone(CLIENTES)
  const espacios: EspacioVariante[] = deepClone(ESPACIOS)
  const items: ItemVariante[] = deepClone(ITEMS)
  const artefactos: EspacioArtefacto[] = deepClone(ARTEFACTOS)
  const catalogo: ProductoCatalogo[] = deepClone(CATALOGO)
  const parametros: Parametro[] = deepClone(PARAMETROS)
  const contratos: Contrato[] = deepClone([CONTRATO_CANONICO])
  const hitos: HitoPago[] = deepClone(HITOS)
  const usuario: UsuarioMock = deepClone(USUARIOS)[0]
  const proyectosEstadosHistorial: ProyectosEstadosHistorial[] = []

  // F3 dominios
  const cronogramas: Cronograma[] = deepClone(CRONOGRAMAS)
  const cronogramaEtapas: CronogramaEtapa[] = deepClone(CRONOGRAMA_ETAPAS)
  const desfases: DesfaseCronograma[] = deepClone(DESFASES)
  const checks: CheckProduccion[] = deepClone(CHECKS)
  const novedades: NovedadCritica[] = deepClone(NOVEDADES)
  const comunicaciones: ComunicacionProgreso[] = deepClone(COMUNICACIONES)
  const schemas: SchemaProyecto[] = deepClone(SCHEMAS)
  const bom: BomMaterial[] = deepClone(BOM)
  const verificaciones: Verificacion[] = deepClone(VERIFICACIONES)
  const retomas: Retoma[] = deepClone(RETOMAS)
  const cambiosContrato: CambioContrato[] = deepClone(CAMBIOS_CONTRATO)
  const personas: Persona[] = deepClone(PERSONAS)
  const personasRoles: PersonaRol[] = deepClone(PERSONAS_ROLES)
  const modulos: Modulo[] = deepClone(MODULOS)
  const estimaciones: Estimacion[] = deepClone(ESTIMACIONES)

  // F5 dominios (taller, calidad, instalación, entrega, garantía)
  const ordenesTrabajo: OrdenTrabajo[] = deepClone(ORDENES_TRABAJO)
  const pedidosWeb: PedidoWeb[] = deepClone(PEDIDOS_WEB)
  const citacionesCalidad: CitacionCalidad[] = deepClone(CITACIONES_CALIDAD)
  const reprocesos: Reproceso[] = deepClone(REPROCESOS)
  const instalaciones: Instalacion[] = deepClone(INSTALACIONES)
  const actasEntrega: ActaEntrega[] = deepClone(ACTAS_ENTREGA)
  const casosGarantia: CasoGarantia[] = deepClone(CASOS_GARANTIA)
  const citasGarantia: CitaGarantia[] = deepClone(CITAS_GARANTIA)

  // F6 dominios (finanzas)
  const cuentasFinancieras: CuentaFinanciera[] = deepClone(CUENTAS_FINANCIERAS)
  const movimientosFinancieros: MovimientoFinanciero[] = deepClone(MOVIMIENTOS_FINANCIEROS)
  const obligacionesPendientes: ObligacionPendiente[] = deepClone(OBLIGACIONES_PENDIENTES)
  const proveedores: Proveedor[] = deepClone(PROVEEDORES)
  const ordenesCompra: OrdenCompra[] = deepClone(ORDENES_COMPRA)
  const registrosGateCaja: RegistroGateCaja[] = deepClone(REGISTROS_GATE_CAJA)
  const cuentasCobroProveedor: CuentaCobroProveedor[] = deepClone(CUENTAS_COBRO_PROVEEDOR)

  // F-02 / P-27 dominios (catálogo, tienda web)
  const categorias: Categoria[] = deepClone(CATEGORIAS)
  const productosTienda: ProductoTienda[] = deepClone(PRODUCTOS_TIENDA)
  const productosTiendaComponentes: ProductoTiendaComponente[] = deepClone(PRODUCTOS_TIENDA_COMPONENTES)
  const catalogoAcabados: CatalogoAcabado[] = deepClone(CATALOGO_ACABADOS)
  const catalogoProductoAcabados: CatalogoProductoAcabado[] = deepClone(CATALOGO_PRODUCTO_ACABADOS)
  const acabadosMuestras: AcabadoMuestra[] = deepClone(ACABADOS_MUESTRAS)

  // t-147: taxonomía orgánica de espacios (independiente de las landings)
  const catalogoEspaciosArquitectonicos: CatalogoEspacioArquitectonico[] = deepClone(CATALOGO_ESPACIOS_ARQUITECTONICOS)

  // F-03 dominio (portafolio de proyectos)
  const portafolio: Portafolio[] = deepClone(PORTAFOLIO)
  const modulosArtefactos: ModuloArtefacto[] = deepClone(MODULOS_ARTEFACTOS)

  // F-15 dominio (Bitácora de Diseño)
  const bitacoraArticulos: BitacoraArticulo[] = deepClone(BITACORA_ARTICULOS)

  // Testimonios (DC-1 ACTIVA 2026-08-09)
  const testimonios: Testimonio[] = []
  const renders: RenderConceptual[] = []
  const atributosTecnicos: AtributoTecnico[] = []

  // F4 dominios (compras: recepción, herramientas — P-13/P-14/P-15)
  const itemsOrdenCompra: ItemOrdenCompra[] = deepClone(ITEMS_ORDEN_COMPRA)
  const recepcionesMaterial: RecepcionMaterial[] = deepClone(RECEPCIONES_MATERIAL)
  const herramientas: Herramienta[] = deepClone(HERRAMIENTAS)

  // F7 dominio (documentación del proyecto — P-26)
  const documentosProyecto: DocumentoProyecto[] = deepClone(DOCUMENTOS_PROYECTO)

  function parametroNumero(clave: string, fallback: number): number {
    const p = parametros.find(x => x.clave === clave)
    if (!p) return fallback
    const n = Number(p.valorNumeric ?? p.valorTexto ?? fallback)
    return Number.isFinite(n) ? n : fallback
  }

  function setProyectoEstado(id: string, estado: string): void {
    const idx = proyectos.findIndex(p => p.id === id)
    if (idx === -1) return
    const estadoAnterior = proyectos[idx].estado
        proyectos[idx] = { ...proyectos[idx], estado: estado as EstadoProyecto, updatedAt: new Date().toISOString() }
    proyectosEstadosHistorial.push({
      id: generateId('hist'),
      proyectoId: id,
      estadoAnterior,
      estadoNuevo: estado,
      cambiadoPor: usuario.id,
      razon: null,
      createdAt: new Date().toISOString(),
    })
  }

  /** Suma días a una fecha ISO y devuelve YYYY-MM-DD (solo fecha). */
  function addDays(iso: string, dias: number): string {
    const date = new Date(iso)
    date.setDate(date.getDate() + dias)
    return date.toISOString().slice(0, 10)
  }

  function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  /** Elimina en el arreglo todas las filas cuyo proyectoId === id (cascada de borrado). */
  function filterByProyecto<T extends { proyectoId: string | null }>(arr: T[], id: string): void {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].proyectoId === id) arr.splice(i, 1)
    }
  }

  // Contrato de reactividad (M-07): toda mutación llama notify() antes de retornar,
  // así ninguna pantalla necesita reinventar su propio trigger/refresh manual.
  let version = 0
  const listeners = new Set<() => void>()
  function notify(): void {
    version++
    listeners.forEach((l) => l())
  }

  return {
    proyectos: {
      listar(): Proyecto[] {
        return masRecientePrimero(proyectos)
      },
      obtenerPorId(id: string): Proyecto | undefined {
        return proyectos.find(p => p.id === id)
      },
      async actualizarEstado(id: string, estado: EstadoProyecto): Promise<Proyecto | null> {
        const idx = proyectos.findIndex(p => p.id === id)
        if (idx === -1) return null
        const estadoAnterior = proyectos[idx].estado

        // Validar transición según parámetro transiciones_proyecto
        const paramTransiciones = parametros.find(p => p.clave === 'transiciones_proyecto')
        let transiciones: Record<string, string[]> = {}
        if (paramTransiciones?.valorTexto) {
          try { transiciones = JSON.parse(paramTransiciones.valorTexto) }
          catch { /* fall through */ }
        }
        const estadosValidos = transiciones[estadoAnterior as keyof typeof transiciones]
        if (!estadosValidos || !estadosValidos.includes(estado)) {
          // Transición no válida: rechazar sin mutar ni notificar
          return null
        }

        proyectos[idx] = { ...proyectos[idx], estado: estado as EstadoProyecto, updatedAt: new Date().toISOString() }
        // Guardar en historial
        proyectosEstadosHistorial.push({
          id: generateId('hist'),
          proyectoId: id,
          estadoAnterior,
          estadoNuevo: estado,
          cambiadoPor: usuario.id,
          razon: null,
          createdAt: new Date().toISOString(),
        })
        notify()
        return proyectos[idx]
      },
      async actualizarParametrosFinancieros(id: string, partial: Partial<Pick<Proyecto, 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios'>>): Promise<Proyecto | null> {
        const idx = proyectos.findIndex(p => p.id === id)
        if (idx === -1) return null
        proyectos[idx] = { ...proyectos[idx], ...partial, updatedAt: new Date().toISOString() }
        notify()
        return proyectos[idx]
      },
      async actualizarVerificador(id: string, verificadorId: string): Promise<Proyecto | null> {
        const idx = proyectos.findIndex(p => p.id === id)
        if (idx === -1) return null
        proyectos[idx] = {
          ...proyectos[idx],
          verificadorId,
          // D3/I-035: verificador único del proyecto = comercial vendedor.
          comercialVendedorId: verificadorId,
          updatedAt: new Date().toISOString(),
        }
        notify()
        return proyectos[idx]
      },
      async actualizar(id: string, partial: Partial<Pick<Proyecto, 'nombreProyecto' | 'clienteId' | 'tipoProyecto' | 'direccionObra' | 'descripcionSemantica' | 'diasEntregaEstimados' | 'costosOperativos' | 'imprevistosInstalacion' | 'descuentoComercial' | 'ajusteArbitrario'>>): Promise<Proyecto | null> {
        const idx = proyectos.findIndex(p => p.id === id)
        if (idx === -1) return null
        proyectos[idx] = { ...proyectos[idx], ...partial, updatedAt: new Date().toISOString() }
        notify()
        return proyectos[idx]
      },
      historialEstado(proyectoId: string): ProyectosEstadosHistorial[] {
        return proyectosEstadosHistorial.filter(h => h.proyectoId === proyectoId)
      },
      async crear(data: Partial<Proyecto> & { nombreProyecto: string }): Promise<Proyecto> {
        const nuevo: Proyecto = {
          id: generateId('proj'),
          nombreProyecto: data.nombreProyecto,
          estado: (data.estado as EstadoProyecto ?? 'activa'),
          tipoProyecto: data.tipoProyecto ?? 'personalizado',
          direccionObra: data.direccionObra ?? null,
          costosOperativos: data.costosOperativos ?? '0',
          imprevistosInstalacion: data.imprevistosInstalacion ?? '0',
          descuentoComercial: data.descuentoComercial ?? '0',
          ajusteArbitrario: data.ajusteArbitrario ?? '0',
          aplicaIva: data.aplicaIva ?? false,
          porcentajeIva: data.porcentajeIva ?? '19',
          garantiaAnios: data.garantiaAnios ?? 2,
          diasEntregaEstimados: data.diasEntregaEstimados ?? null,
          descripcionSemantica: data.descripcionSemantica ?? null,
          clienteId: data.clienteId ?? null,
          comercialId: data.comercialId ?? null,
          verificadorId: data.verificadorId ?? null,
          fechaEntradaDesarrollo: data.fechaEntradaDesarrollo ?? null,
          comercialVendedorId: data.comercialVendedorId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        proyectos.push(nuevo)
        notify()
        return nuevo
      },
      async eliminar(id: string): Promise<boolean> {
        const proyecto = proyectos.find(p => p.id === id)
        if (!proyecto) return false
        // Solo se eliminan cotizaciones en estado lead (activa). Nunca las que ya
        // están en contrato ni las que tengan compromisos financieros/producción.
        if (proyecto.estado !== 'activa') return false
        if (contratos.some(c => c.proyectoId === id)) return false
        if (movimientosFinancieros.some(m => m.proyectoId === id)) return false
        if (obligacionesPendientes.some(o => o.proyectoId === id)) return false
        if (ordenesCompra.some(o => o.proyectoId === id)) return false

        // Espacios del proyecto (y sus ítems/artefactos) — cascada.
        const espacioIds = espacios.filter(e => e.proyectoId === id).map(e => e.id)
        if (espacioIds.length > 0) {
          for (let i = espacios.length - 1; i >= 0; i--) {
            if (espacioIds.includes(espacios[i].id)) espacios.splice(i, 1)
          }
          for (let i = items.length - 1; i >= 0; i--) {
            if (espacioIds.includes(items[i].varianteId)) items.splice(i, 1)
          }
          for (let i = artefactos.length - 1; i >= 0; i--) {
            if (espacioIds.includes(artefactos[i].espacioVarianteId)) artefactos.splice(i, 1)
          }
        }

        // Contrato e hitos (defensivo: el guard ya bloquea cuando existe).
        const contratoIds = contratos.filter(c => c.proyectoId === id).map(c => c.id)
        for (let i = hitos.length - 1; i >= 0; i--) {
          if (contratoIds.includes(hitos[i].contratoId)) hitos.splice(i, 1)
        }
        for (let i = contratos.length - 1; i >= 0; i--) {
          if (contratos[i].proyectoId === id) contratos.splice(i, 1)
        }

        // Historial de estados.
        for (let i = proyectosEstadosHistorial.length - 1; i >= 0; i--) {
          if (proyectosEstadosHistorial[i].proyectoId === id) proyectosEstadosHistorial.splice(i, 1)
        }

        // Cronograma y control.
        const cronogramaIds = cronogramas.filter(c => c.proyectoId === id).map(c => c.id)
        for (let i = cronogramaEtapas.length - 1; i >= 0; i--) {
          if (cronogramaIds.includes(cronogramaEtapas[i].cronogramaId)) cronogramaEtapas.splice(i, 1)
        }
        for (let i = cronogramas.length - 1; i >= 0; i--) {
          if (cronogramas[i].proyectoId === id) cronogramas.splice(i, 1)
        }
        filterByProyecto(desfases, id)
        filterByProyecto(checks, id)
        filterByProyecto(novedades, id)
        filterByProyecto(comunicaciones, id)

        // Schema y BOM.
        const schemaIds = schemas.filter(s => s.proyectoId === id).map(s => s.id)
        for (let i = bom.length - 1; i >= 0; i--) {
          if (schemaIds.includes(bom[i].schemaId)) bom.splice(i, 1)
        }
        for (let i = schemas.length - 1; i >= 0; i--) {
          if (schemas[i].proyectoId === id) schemas.splice(i, 1)
        }
        filterByProyecto(verificaciones, id)
        filterByProyecto(retomas, id)
        filterByProyecto(cambiosContrato, id)

        // Producción.
        const moduloIds = modulos.filter(m => m.proyectoId === id).map(m => m.id)
        for (let i = modulosArtefactos.length - 1; i >= 0; i--) {
          if (moduloIds.includes(modulosArtefactos[i].moduloId)) modulosArtefactos.splice(i, 1)
        }
        for (let i = modulos.length - 1; i >= 0; i--) {
          if (modulos[i].proyectoId === id) modulos.splice(i, 1)
        }
        filterByProyecto(estimaciones, id)
        filterByProyecto(ordenesTrabajo, id)

        // F5 (taller, calidad, instalación, entrega, garantía).
        filterByProyecto(citacionesCalidad, id)
        filterByProyecto(reprocesos, id)
        filterByProyecto(instalaciones, id)
        filterByProyecto(actasEntrega, id)
        filterByProyecto(casosGarantia, id)
        filterByProyecto(citasGarantia, id)

        // F6/F7/F4 (defensivo: el guard ya bloquea los comprometidos).
        filterByProyecto(movimientosFinancieros, id)
        filterByProyecto(obligacionesPendientes, id)
        filterByProyecto(ordenesCompra, id)
        filterByProyecto(recepcionesMaterial, id)
        filterByProyecto(documentosProyecto, id)
        filterByProyecto(portafolio, id)
        filterByProyecto(testimonios, id)

        // Referencias nulables que apuntan al proyecto.
        for (const pw of pedidosWeb) {
          if (pw.proyectoId === id) pw.proyectoId = null
        }
        for (const pc of catalogo) {
          if (pc.proyectoOrigenId === id) pc.proyectoOrigenId = null
        }
        for (const ba of bitacoraArticulos) {
          if (ba.proyectoRelacionadoId === id) ba.proyectoRelacionadoId = null
        }

        const idx = proyectos.findIndex(p => p.id === id)
        if (idx === -1) return false
        proyectos.splice(idx, 1)
        notify()
        return true
      },
    },

    clientes: {
      listar(): Cliente[] {
        return masRecientePrimero(clientes)
      },
      obtenerPorId(id: string): Cliente | undefined {
        return clientes.find(c => c.id === id)
      },
      async crear(data: Partial<Cliente> & { nombre: string }): Promise<Cliente> {
        const nuevo: Cliente = {
          id: generateId('cli'),
          nombre: data.nombre,
          documento: data.documento ?? null,
          telefono: data.telefono ?? null,
          email: data.email ?? null,
          domicilio: data.domicilio ?? null,
        }
        clientes.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Omit<Cliente, 'id'>>): Promise<Cliente | null> {
        const idx = clientes.findIndex(c => c.id === id)
        if (idx === -1) return null
        clientes[idx] = { ...clientes[idx], ...partial }
        notify()
        return clientes[idx]
      },
    },

    espacios: {
      porProyecto(proyectoId: string): EspacioVariante[] {
        return espacios.filter(e => e.proyectoId === proyectoId)
      },
      async crear(data: Partial<EspacioVariante> & { proyectoId: string; nombreEspacio: string }): Promise<EspacioVariante> {
        const nuevo: EspacioVariante = {
          id: generateId('esp'),
          proyectoId: data.proyectoId,
          nombreEspacio: data.nombreEspacio,
          nombreVariante: data.nombreVariante ?? 'Inicial',
          tipoEspacio: data.tipoEspacio ?? null,
          descripcion: data.descripcion ?? null,
          activa: data.activa ?? true,
          visibleEnPropuestaPublica: data.visibleEnPropuestaPublica ?? true,
          orden: data.orden ?? espacios.filter(e => e.proyectoId === data.proyectoId).length,
          jornadasDesarrolloTecnico: data.jornadasDesarrolloTecnico ?? '0',
          jornadasEnsamblajeTaller: data.jornadasEnsamblajeTaller ?? '0',
          jornadasInstalacionObra: data.jornadasInstalacionObra ?? '0',
          colores: data.colores ?? [],
          fotosEspacio: data.fotosEspacio ?? [],
          fotosDisenio: data.fotosDisenio ?? [],
          fotosReferencia: data.fotosReferencia ?? [],
        }
        espacios.push(nuevo)
        notify()
        return nuevo
      },
      async actualizarJornadas(id: string, jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string }): Promise<EspacioVariante | null> {
        const idx = espacios.findIndex(e => e.id === id)
        if (idx === -1) return null
        espacios[idx] = {
          ...espacios[idx],
          jornadasDesarrolloTecnico: jornadas.jornadasDesarrolloTecnico,
          jornadasEnsamblajeTaller: jornadas.jornadasEnsamblajeTaller,
          jornadasInstalacionObra: jornadas.jornadasInstalacionObra,
        }
        notify()
        return espacios[idx]
      },
      async actualizar(id: string, partial: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'tipoEspacio' | 'descripcion' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>>): Promise<EspacioVariante | null> {
        const idx = espacios.findIndex(e => e.id === id)
        if (idx === -1) return null
        espacios[idx] = { ...espacios[idx], ...partial }
        notify()
        return espacios[idx]
      },
      async duplicar(id: string, opciones: { vacio: boolean; nuevoNombreEspacio?: string }): Promise<EspacioVariante | null> {
        const origen = espacios.find(e => e.id === id)
        if (!origen) return null

        // Sin nuevoNombreEspacio: agrega una variante alternativa al mismo espacio
        // (la original sigue siendo la activa). Con nuevoNombreEspacio: duplica el
        // espacio completo como grupo nuevo e independiente (activa por defecto).
        const esGrupoNuevo = Boolean(opciones.nuevoNombreEspacio)
        const nombreEspacio = opciones.nuevoNombreEspacio ?? origen.nombreEspacio
        const nombreVariante = esGrupoNuevo ? origen.nombreVariante : `${origen.nombreVariante} (copia)`
        const nuevoOrden = espacios.filter(e => e.proyectoId === origen.proyectoId).length

        const nuevo: EspacioVariante = opciones.vacio
          ? {
              id: generateId('esp'),
              proyectoId: origen.proyectoId,
              nombreEspacio,
              nombreVariante,
              tipoEspacio: origen.tipoEspacio,
              descripcion: null,
              activa: esGrupoNuevo,
              visibleEnPropuestaPublica: true,
              orden: nuevoOrden,
              jornadasDesarrolloTecnico: '0',
              jornadasEnsamblajeTaller: '0',
              jornadasInstalacionObra: '0',
              colores: [],
              fotosEspacio: [],
              fotosDisenio: [],
              fotosReferencia: [],
            }
          : {
              ...deepClone(origen),
              id: generateId('esp'),
              nombreEspacio,
              nombreVariante,
              activa: esGrupoNuevo,
              orden: nuevoOrden,
            }

        espacios.push(nuevo)

        // Clonar (vacio=false) también arrastra los items y artefactos de la variante
        // origen — una "copia" sin ítems no sirve para comparar precio.
        if (!opciones.vacio) {
          items.filter(i => i.varianteId === id).forEach(i => {
            items.push({
              ...deepClone(i),
              id: generateId('it'),
              varianteId: nuevo.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          })
          artefactos.filter(a => a.espacioVarianteId === id).forEach(a => {
            artefactos.push({
              ...deepClone(a),
              id: generateId('art'),
              espacioVarianteId: nuevo.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          })
        }

        notify()
        return nuevo
      },
      async marcarActiva(id: string): Promise<EspacioVariante | null> {
        const objetivo = espacios.find(e => e.id === id)
        if (!objetivo) return null
        espacios.forEach((e, idx) => {
          if (e.nombreEspacio !== objetivo.nombreEspacio || e.proyectoId !== objetivo.proyectoId) return
          if (e.activa !== (e.id === id)) espacios[idx] = { ...e, activa: e.id === id }
        })
        notify()
        return espacios.find(e => e.id === id) ?? null
      },
      async eliminar(id: string): Promise<boolean> {
        const idxEsp = espacios.findIndex(e => e.id === id)
        if (idxEsp === -1) return false
        espacios.splice(idxEsp, 1)
        for (let i = items.length - 1; i >= 0; i--) {
          if (items[i].varianteId === id) items.splice(i, 1)
        }
        notify()
        return true
      },
    },

    items: {
      // D-09c: filtra anulado acá, no en cada pantalla — antes cada consumidor (Cotizador interno,
      // propuesta pública) leía porVariante() crudo, así que un ítem "eliminado" seguía sumando en
      // subtotales y, más grave, seguía apareciendo con precio completo en la propuesta que ve el cliente.
      porVariante(varianteId: string): ItemVariante[] {
        return items.filter(i => i.varianteId === varianteId && !i.anulado)
      },
      async crear(data: Partial<ItemVariante> & { varianteId: string; catalogoId: string | null; cantidad: string }): Promise<ItemVariante> {
        const precioUnitario = data.precioUnitario ?? '0'
        const nuevo: ItemVariante = {
          id: generateId('it'),
          varianteId: data.varianteId,
          catalogoId: data.catalogoId,
          nombrePersonalizado: data.nombrePersonalizado ?? null,
          cantidad: data.cantidad,
          precioUnitario,
          // Derivado, no aceptado del caller: evita que quede desincronizado de cantidad×precio.
          totalLinea: String(numDe(data.cantidad) * numDe(precioUnitario)),
          anulado: data.anulado ?? false,
          esReferencial: data.esReferencial ?? false,
          fuenteReferencial: data.fuenteReferencial ?? null,
          grupoReferencial: data.grupoReferencial ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        items.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Pick<ItemVariante, 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>>): Promise<ItemVariante | null> {
        const idx = items.findIndex(i => i.id === id)
        if (idx === -1) return null
        const actualizado = { ...items[idx], ...partial }
        // totalLinea siempre se re-deriva del estado final de cantidad/precioUnitario.
        actualizado.totalLinea = String(numDe(actualizado.cantidad) * numDe(actualizado.precioUnitario))
        actualizado.updatedAt = new Date().toISOString()
        items[idx] = actualizado
        notify()
        return items[idx]
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = items.findIndex(i => i.id === id)
        if (idx === -1) return false
        items[idx] = { ...items[idx], anulado: true, updatedAt: new Date().toISOString() }
        notify()
        return true
      },
    },

    artefactos: {
      porEspacio(espacioVarianteId: string): EspacioArtefacto[] {
        return artefactos.filter(a => a.espacioVarianteId === espacioVarianteId)
      },
      async crear(data: Partial<EspacioArtefacto> & { espacioVarianteId: string; categoria: EspacioArtefacto['categoria'] }): Promise<EspacioArtefacto> {
        const now = new Date().toISOString()
        const nuevo: EspacioArtefacto = {
          id: generateId('art'),
          espacioVarianteId: data.espacioVarianteId,
          categoria: data.categoria,
          dimensionesMm: data.dimensionesMm ?? null,
          tipoSpecifique: data.tipoSpecifique ?? null,
          ubicacion: data.ubicacion ?? null,
          fotoUrl: data.fotoUrl ?? null,
          requiereVerificacion: data.requiereVerificacion ?? true,
          validadoPor: data.validadoPor ?? null,
          validadoEn: data.validadoEn ?? null,
          createdAt: now,
          updatedAt: now,
        }
        artefactos.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>>): Promise<EspacioArtefacto | null> {
        const idx = artefactos.findIndex(a => a.id === id)
        if (idx === -1) return null
        artefactos[idx] = {
          ...artefactos[idx],
          ...partial,
          updatedAt: new Date().toISOString(),
        }
        notify()
        return artefactos[idx]
      },
    },

    catalogo: {
      listar(): ProductoCatalogo[] {
        return masRecientePrimero(catalogo)
      },
      buscar(query: string): ProductoCatalogo[] {
        // t-141: búsqueda resiliente (tildes, tokens AND, fuzzy Opción A) — mismo matcher que
        // consume el SmartSearch del ERP. Read-only: no dispara notify().
        return catalogo.filter(c => coincide(query, [c.descripcion, c.sku, c.categoriaComercial ?? '']))
      },
      obtenerPorId(id: string): ProductoCatalogo | undefined {
        return catalogo.find(c => c.id === id)
      },
      async crear(data: Partial<ProductoCatalogo> & { sku: string; descripcion: string; unidadMedida: string }): Promise<ProductoCatalogo | null> {
        // R1: sku único.
        if (catalogo.some(c => c.sku === data.sku)) return null
        const precioDirecto = data.precioDirecto ?? null
        const precioPublico = data.precioPublico ?? null
        // R3/R4: precios ≥0 y directo ≤ público (cuando ambos existen).
        if (precioDirecto !== null && numDe(precioDirecto) < 0) return null
        if (precioPublico !== null && numDe(precioPublico) < 0) return null
        if (precioDirecto !== null && precioPublico !== null && numDe(precioDirecto) > numDe(precioPublico)) return null
        const stockActual = data.stockActual ?? 0
        // R6: stock ≥0.
        if (stockActual < 0) return null
        const publicadoWeb = data.publicadoWeb ?? false
        const imagenUrl = data.imagenUrl ?? null
        const galeriaImagenesUrl = data.galeriaImagenesUrl ?? []
        // R5 (t-139): publicar exige precioPublico + (imagenUrl OR galería no vacía).
        if (publicadoWeb && (!precioPublico || !(imagenUrl || galeriaImagenesUrl.length > 0))) return null
        const now = new Date().toISOString()
        const nuevo: ProductoCatalogo = {
          id: generateId('cat'),
          sku: data.sku,
          descripcion: data.descripcion,
          tipo: data.tipo ?? null,
          unidadMedida: data.unidadMedida,
          precioDirecto,
          precioPublico,
          stockActual,
          proveedorId: data.proveedorId ?? null,
          imagenUrl,
          galeriaImagenesUrl,
          modelo3dUrl: data.modelo3dUrl ?? null,
          categoriaComercial: data.categoriaComercial ?? null,
          publicadoWeb,
          proyectoOrigenId: data.proyectoOrigenId ?? null,
          anulado: false,
          createdAt: now,
          updatedAt: now,
        }
        catalogo.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Omit<ProductoCatalogo, 'id' | 'createdAt'>>): Promise<ProductoCatalogo | null> {
        const idx = catalogo.findIndex(c => c.id === id)
        if (idx === -1) return null
        const actualizado = { ...catalogo[idx], ...partial }
        // R1: sku único (excluyendo el propio registro).
        if (catalogo.some(c => c.id !== id && c.sku === actualizado.sku)) return null
        if (actualizado.precioDirecto !== null && numDe(actualizado.precioDirecto) < 0) return null
        if (actualizado.precioPublico !== null && numDe(actualizado.precioPublico) < 0) return null
        if (actualizado.precioDirecto !== null && actualizado.precioPublico !== null && numDe(actualizado.precioDirecto) > numDe(actualizado.precioPublico)) return null
        if (actualizado.stockActual < 0) return null
        // R5 (t-139): publicar exige precioPublico + (imagenUrl OR galería no vacía).
        if (actualizado.publicadoWeb && (!actualizado.precioPublico || !(actualizado.imagenUrl || (actualizado.galeriaImagenesUrl?.length ?? 0) > 0))) return null
        actualizado.updatedAt = new Date().toISOString()
        catalogo[idx] = actualizado
        notify()
        return catalogo[idx]
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = catalogo.findIndex(c => c.id === id)
        if (idx === -1) return false
        // R8: soft-delete — los items_variante que ya referencian este producto guardan su propio
        // snapshot de precioUnitario/totalLinea, así que sus totales históricos quedan intactos.
        catalogo[idx] = { ...catalogo[idx], anulado: true, updatedAt: new Date().toISOString() }
        notify()
        return true
      },
    },

     parametros: {
        listar(): Parametro[] {
          return parametros
        },
        obtenerPorClave(clave: string): Parametro | undefined {
          return parametros.find(p => p.clave === clave)
        },
        transicionesProyecto(): TransicionesProyecto {
          const param = parametros.find(p => p.clave === 'transiciones_proyecto')
          if (param?.valorTexto) {
            try { return JSON.parse(param.valorTexto) }
            catch { /* fall through */ }
          }
          return {}
        },
        async actualizar(clave: string, datos: Partial<Parametro>): Promise<void> {
          const index = parametros.findIndex(p => p.clave === clave)
          if (index !== -1) {
            parametros[index] = { ...parametros[index], ...datos }
          } else {
            parametros.push({
              id: `par-${Date.now()}`,
              clave,
              grupo: 'finanzas',
              tipo: 'texto',
              valorNumeric: null,
              valorTexto: null,
              valorBooleano: null,
              unidad: null,
              descripcion: `Parámetro ${clave} (generado automáticamente)`,
              ...datos,
            })
          }
          notify()
        },
      },

    contratos: {
      porProyecto(proyectoId: string): Contrato | undefined {
        return contratos.find(c => c.proyectoId === proyectoId)
      },
       async crear(data: { proyectoId: string; codigoContrato: string; valorTotal: string; hitos: { tipo: 'percentage' | 'fixed'; monto: string; razon: string }[] }): Promise<Contrato> {
        const id = generateId('ctr')
         const nuevo: Contrato = {
           id,
           proyectoId: data.proyectoId,
           codigoContrato: data.codigoContrato,
           fechaContrato: new Date().toISOString().slice(0, 10),
           valorTotal: data.valorTotal,
           estado: 'borrador',
           garantiaAnios: 2,
           plazoEjecucionTexto: '4 a 5',
           holguraDias: 8,
           objetoItems: null,
           especificacionesEstructura: null,
           especificacionesHerrajes: null,
           especificacionesMesones: null,
           especificacionesDesmonte: null,
           contratanteDomicilio: null,
           emailAsunto: null,
           emailCuerpo: null,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
         }
        contratos.push(nuevo)
        data.hitos.forEach((h, i) => {
          hitos.push({
            id: generateId('hito'),
            contratoId: id,
            orden: i + 1,
            tipo: h.tipo,
            montoOPorcentaje: h.monto,
            razon: h.razon,
          })
        })
        notify()
        return nuevo
      },
    },

    hitos: {
      porContrato(contratoId: string): HitoPago[] {
        return hitos.filter(h => h.contratoId === contratoId)
      },
    },

    // --- F3: Cronograma y control ---
    cronogramas: {
      porProyecto(proyectoId: string): Cronograma | undefined {
        return cronogramas.find(c => c.proyectoId === proyectoId)
      },
      obtenerPorId(id: string): Cronograma | undefined {
        return cronogramas.find(c => c.id === id)
      },
      async crear(data: { proyectoId: string }): Promise<Cronograma> {
        const baseSemanas = parametroNumero('base_semanas_cronograma', 4)
        const holgura = parametroNumero('holgura_maxima_dias', 12)
        const promesa = parametroNumero('promesa_semanas', 7)
        const nuevo: Cronograma = {
          id: generateId('crog'),
          proyectoId: data.proyectoId,
          baseSemanas,
          holguraMaximaDias: holgura,
          promesaSemanas: promesa,
          fechaFijacion: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        cronogramas.push(nuevo)
        notify()
        return nuevo
      },
    },

    cronogramaEtapas: {
      porCronograma(cronogramaId: string): CronogramaEtapa[] {
        return cronogramaEtapas.filter(e => e.cronogramaId === cronogramaId)
      },
      async crear(data: { cronogramaId: string; linea: LineaCronograma; etapa: EtapaCronograma; fechaIdeal: string; fechaReal: string; estado: string }): Promise<CronogramaEtapa> {
        const nuevo: CronogramaEtapa = {
          id: generateId('cet'),
          cronogramaId: data.cronogramaId,
          linea: data.linea,
          etapa: data.etapa,
          fechaIdeal: data.fechaIdeal,
          fechaReal: data.fechaReal,
          estado: data.estado,
        }
        cronogramaEtapas.push(nuevo)
        notify()
        return nuevo
      },
    },

    desfases: {
      porProyecto(proyectoId: string): DesfaseCronograma[] {
        return desfases.filter(d => d.proyectoId === proyectoId)
      },
      async aplicar(proyectoId: string, data: { causa: CausaDesfase; composicionCausal: { origen: string; aporteDias: number }[]; motivo: string; diasDesfase: number }): Promise<DesfaseCronograma | null> {
        // P33: requiere causa válida + motivo + composición causal (R2).
        if (!P33({ causa: data.causa, motivo: data.motivo, composicionCausal: data.composicionCausal })) return null
        const nuevo: DesfaseCronograma = {
          id: generateId('des'),
          proyectoId,
          diasDesfase: data.diasDesfase,
          causa: data.causa,
          composicionCausal: data.composicionCausal,
          motivo: data.motivo,
          aplicado: true,
          decisionManual: null,
          autorizadoPor: null,
          resultadoRecalculo: 'Línea interna desplazada; contractual inmutable (I-034)',
          createdAt: new Date().toISOString(),
        }
        desfases.push(nuevo)
        // R3/R7 (I-034): recalcular SOLO la línea interna; la contractual queda inmutable.
        const cronograma = cronogramas.find(c => c.proyectoId === proyectoId)
        if (cronograma) {
          cronogramaEtapas.forEach((e, idx) => {
            if (e.cronogramaId !== cronograma.id || e.linea !== 'interna') return
            cronogramaEtapas[idx] = { ...e, fechaReal: addDays(e.fechaIdeal, data.diasDesfase) }
          })
        }
        notify()
        return nuevo
      },
      async decisionManual(desfaseId: string, data: { decisionManual: string; autorizadoPor: string }): Promise<DesfaseCronograma | null> {
        const idx = desfases.findIndex(d => d.id === desfaseId)
        if (idx === -1) return null
        if (data.decisionManual.trim().length === 0) return null
        desfases[idx] = { ...desfases[idx], decisionManual: data.decisionManual, autorizadoPor: data.autorizadoPor }
        notify()
        return desfases[idx]
      },
    },

    checks: {
      porProyecto(proyectoId: string): CheckProduccion[] {
        return checks.filter(c => c.proyectoId === proyectoId)
      },
      async crear(proyectoId: string, data: { ratioInsumos: number; ratioPagos: number; ratioProduccion: number }): Promise<CheckProduccion> {
        const umbralTodoBien = parametroNumero('umbral_todo_bien_pct', 0.95)
        const umbralExtremo = parametroNumero('umbral_extremo_pct', 0.70)
        // R9: el desenlace se DERIVA del mínimo de los 3 ratios, nunca se asienta a mano.
        const sugerido = derivarDesenlace(data, { umbralTodoBienPct: umbralTodoBien, umbralExtremoPct: umbralExtremo })
        const proyecto = proyectos.find(p => p.id === proyectoId)
        const nuevo: CheckProduccion = {
          id: generateId('chk'),
          proyectoId,
          fechaCheck: new Date().toISOString().slice(0, 10),
          ratioInsumos: data.ratioInsumos,
          ratioPagos: data.ratioPagos,
          ratioProduccion: data.ratioProduccion,
          desenlaceSugerido: sugerido,
          desenlaceFinal: null,
          overrideJustificacion: null,
          comisionesReducidasPct: null,
          verificadorId: proyecto?.verificadorId ?? null,
          createdAt: new Date().toISOString(),
        }
        checks.push(nuevo)
        notify()
        return nuevo
      },
      async confirmar(checkId: string, data: { desenlaceFinal: DesenlaceCheck; overrideJustificacion?: string }): Promise<CheckProduccion | null> {
        const idx = checks.findIndex(c => c.id === checkId)
        if (idx === -1) return null
        const check = checks[idx]
        // R10: anular la sugerencia exige justificación obligatoria antes de confirmar.
        if (data.desenlaceFinal !== check.desenlaceSugerido && !(data.overrideJustificacion && data.overrideJustificacion.trim().length > 0)) return null
        const reduccionNovedad = parametroNumero('reduccion_comision_novedad_pct', 0.50)
        const reduccionExtremo = parametroNumero('reduccion_comision_extremo_pct', 1.00)
        const comisiones = derivarReduccionComision(data.desenlaceFinal, { reduccionNovedadPct: reduccionNovedad, reduccionExtremoPct: reduccionExtremo })
        checks[idx] = {
          ...check,
          desenlaceFinal: data.desenlaceFinal,
          overrideJustificacion: data.overrideJustificacion ?? null,
          comisionesReducidasPct: comisiones,
        }
        notify()
        return checks[idx]
      },
    },

    novedades: {
      porProyecto(proyectoId: string): NovedadCritica[] {
        return novedades.filter(n => n.proyectoId === proyectoId)
      },
      async crear(proyectoId: string, data: { descripcion: string; fase: string; ventanaSlaHoras: number }): Promise<NovedadCritica> {
        const nuevo: NovedadCritica = {
          id: generateId('nov'),
          proyectoId,
          descripcion: data.descripcion,
          fase: data.fase,
          ventanaSlaHoras: data.ventanaSlaHoras,
          estado: 'abierta',
          escaladoA: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        novedades.push(nuevo)
        notify()
        return nuevo
      },
      async actualizarEstado(id: string, estado: EstadoNovedadCritica, escaladoA?: string): Promise<NovedadCritica | null> {
        const idx = novedades.findIndex(n => n.id === id)
        if (idx === -1) return null
        novedades[idx] = { ...novedades[idx], estado, escaladoA: escaladoA ?? novedades[idx].escaladoA, updatedAt: new Date().toISOString() }
        notify()
        return novedades[idx]
      },
    },

    comunicaciones: {
      porProyecto(proyectoId: string): ComunicacionProgreso[] {
        return comunicaciones.filter(c => c.proyectoId === proyectoId)
      },
      visiblesAlCliente(proyectoId: string): ComunicacionProgreso[] {
        return comunicaciones.filter(c => c.proyectoId === proyectoId && c.visibleAlCliente)
      },
      async crear(proyectoId: string, data: { contenido: string; visibleAlCliente?: boolean }): Promise<ComunicacionProgreso | null> {
        // R4: solo adelantos positivos (desenlace todo_bien → E-60), nunca atrasos.
        const checkBueno = checks.find(c => c.proyectoId === proyectoId && c.desenlaceFinal === 'todo_bien')
        if (!checkBueno) return null
        const nuevo: ComunicacionProgreso = {
          id: generateId('com'),
          proyectoId,
          tipo: 'adelanto',
          contenido: data.contenido,
          visibleAlCliente: data.visibleAlCliente ?? true,
          createdAt: new Date().toISOString(),
        }
        comunicaciones.push(nuevo)
        notify()
        return nuevo
      },
    },

    // --- F3: Desarrollo y schema ---
    schemas: {
      porProyecto(proyectoId: string): SchemaProyecto[] {
        return schemas.filter(s => s.proyectoId === proyectoId)
      },
      async crear(proyectoId: string): Promise<SchemaProyecto> {
        const existentes = schemas.filter(s => s.proyectoId === proyectoId)
        const version = existentes.length > 0 ? Math.max(...existentes.map(s => s.version)) + 1 : 1
        const nuevo: SchemaProyecto = {
          id: generateId('sch'),
          proyectoId,
          version,
          estado: 'borrador',
          createdAt: new Date().toISOString(),
          aprobadoEn: null,
        }
        schemas.push(nuevo)
        notify()
        return nuevo
      },
      async actualizarEstado(id: string, estado: EstadoSchema): Promise<SchemaProyecto | null> {
        const idx = schemas.findIndex(s => s.id === id)
        if (idx === -1) return null
        schemas[idx] = { ...schemas[idx], estado, aprobadoEn: estado === 'aprobado_compras' ? new Date().toISOString() : schemas[idx].aprobadoEn }
        notify()
        return schemas[idx]
      },
    },

    bom: {
      porSchema(schemaId: string): BomMaterial[] {
        return bom.filter(b => b.schemaId === schemaId)
      },
      async crear(data: { schemaId: string; productoId: string | null; cantidad: string; unidad: string; origen: OrigenBom; homologable: boolean; itemVarianteId?: string | null }): Promise<BomMaterial> {
        const nuevo: BomMaterial = {
          id: generateId('bom'),
          schemaId: data.schemaId,
          productoId: data.productoId,
          cantidad: data.cantidad,
          unidad: data.unidad,
          origen: data.origen,
          homologable: data.homologable,
          itemVarianteId: data.itemVarianteId ?? null,
        }
        bom.push(nuevo)
        notify()
        return nuevo
      },
    },

    verificaciones: {
      porProyecto(proyectoId: string): Verificacion[] {
        return verificaciones.filter(v => v.proyectoId === proyectoId)
      },
      async emitirVeredicto(data: { proyectoId: string; tipoGate: TipoGate; veredicto: VeredictoGate; verificadorId: string }): Promise<Verificacion | null> {
        const proyecto = proyectos.find(p => p.id === data.proyectoId)
        if (!proyecto) return null

        // P-17 R1/R2 (E-24): verificador único del proyecto + citación 'citada' pendiente.
        if (data.tipoGate === 'calidad') {
          const citaciones = citacionesCalidad.filter(c => c.proyectoId === data.proyectoId)
          if (!puedeEmitirVeredictoCalidad(proyecto, citaciones, data.verificadorId)) return null
        }

        const ahora = new Date().toISOString()
        const nuevo: Verificacion = {
          id: generateId('ver'),
          proyectoId: data.proyectoId,
          tipoGate: data.tipoGate,
          veredicto: data.veredicto,
          verificadorId: data.verificadorId,
          creadoEn: ahora,
        }
        verificaciones.push(nuevo)

        if (data.tipoGate === 'calidad' && data.veredicto === 'rechazado') {
          // P-17 R3 (E-54): rechazo dispara reproceso automático. R4: proyectos.estado NO cambia (ni aquí ni al aprobar).
          reprocesos.push({
            id: generateId('rep'),
            proyectoId: data.proyectoId,
            origen: 'calidad',
            moduloId: null,
            culpable: null,
            granularidad: null,
            descripcion: 'Rechazo de calidad (E-24)',
            estado: 'abierto',
            createdAt: ahora,
          })
        }

        if (data.tipoGate === 'schema') {
          if (data.veredicto === 'aprobado') {
            // R1 + R6: E-18 solo procede si P18 (verificador único, posterior al ingreso a desarrollo).
            if (!P18(proyecto, verificaciones.filter(v => v.proyectoId === data.proyectoId))) {
              return null
            }
            setProyectoEstado(data.proyectoId, 'aprobado_compras')
            const schema = schemas.filter(s => s.proyectoId === data.proyectoId).sort((a, b) => b.version - a.version)[0]
            if (schema) {
              const idx = schemas.findIndex(s => s.id === schema.id)
              schemas[idx] = { ...schema, estado: 'aprobado_compras' }
            }
          } else {
            // Rechazo → schema en reproceso; el proyecto permanece en desarrollo (E-18/E-54).
            const schema = schemas.filter(s => s.proyectoId === data.proyectoId).sort((a, b) => b.version - a.version)[0]
            if (schema) {
              const idx = schemas.findIndex(s => s.id === schema.id)
              schemas[idx] = { ...schema, estado: 'en_reproceso' }
            }
          }
        }
        notify()
        return nuevo
      },
    },

    retomas: {
      porProyecto(proyectoId: string): Retoma | undefined {
        return retomas.find(r => r.proyectoId === proyectoId)
      },
      async guardar(proyectoId: string, data: { medidas?: Record<string, unknown>; fotos?: string[]; anomaliaDetectada?: boolean }): Promise<Retoma> {
        const existente = retomas.find(r => r.proyectoId === proyectoId)
        const anomalia = data.anomaliaDetectada ?? existente?.anomaliaDetectada ?? false
        const ahora = new Date().toISOString()
        let retoma: Retoma
        if (existente) {
          const idx = retomas.findIndex(r => r.id === existente.id)
          retoma = { ...existente, medidas: data.medidas ?? existente.medidas, fotos: data.fotos ?? existente.fotos, anomaliaDetectada: anomalia, updatedAt: ahora }
          retomas[idx] = retoma
        } else {
          retoma = { id: generateId('ret'), proyectoId, medidas: data.medidas ?? null, fotos: data.fotos ?? [], anomaliaDetectada: anomalia, createdAt: ahora, updatedAt: ahora }
          retomas.push(retoma)
        }
        // E-16: la anomalía detectada en retoma dispara un cambio de contrato que puede desfasear.
        if (anomalia && !cambiosContrato.some(c => c.proyectoId === proyectoId && c.descripcion.includes('Retoma'))) {
          cambiosContrato.push({
            id: generateId('cam'),
            proyectoId,
            tipoCambio: 'cambio',
            descripcion: 'Anomalía detectada en retoma de medidas',
            disparaDesfase: true,
            createdAt: ahora,
          })
        }
        notify()
        return retoma
      },
    },

    cambiosContrato: {
      porProyecto(proyectoId: string): CambioContrato[] {
        return cambiosContrato.filter(c => c.proyectoId === proyectoId)
      },
      async crear(data: { proyectoId: string; tipoCambio: CambioContrato['tipoCambio']; descripcion: string; disparaDesfase: boolean }): Promise<CambioContrato> {
        const nuevo: CambioContrato = {
          id: generateId('cam'),
          proyectoId: data.proyectoId,
          tipoCambio: data.tipoCambio,
          descripcion: data.descripcion,
          disparaDesfase: data.disparaDesfase,
          createdAt: new Date().toISOString(),
        }
        cambiosContrato.push(nuevo)
        notify()
        return nuevo
      },
    },

    // --- F3: Equipo ---
    personas: {
      listar(): Persona[] {
        return masRecientePrimero(personas)
      },
      obtenerPorId(id: string): Persona | undefined {
        return personas.find(p => p.id === id)
      },
      async crear(data: Partial<Pick<Persona, 'documento' | 'telefono' | 'fotoUrl' | 'email' | 'direccion' | 'referencia1Nombre' | 'referencia1Relacion' | 'referencia1Telefono' | 'referencia2Nombre' | 'referencia2Relacion' | 'referencia2Telefono'>> & { nombre: string }): Promise<Persona> {
        if (data.documento && personas.some(p => p.documento === data.documento)) {
          throw new Error('documento_duplicado')
        }
        const nuevo: Persona = {
          id: generateId('p'),
          nombre: data.nombre,
          documento: data.documento ?? null,
          telefono: data.telefono ?? null,
          fotoUrl: data.fotoUrl ?? null,
          email: data.email ?? null,
          direccion: data.direccion ?? null,
          referencia1Nombre: data.referencia1Nombre ?? null,
          referencia1Relacion: data.referencia1Relacion ?? null,
          referencia1Telefono: data.referencia1Telefono ?? null,
          referencia2Nombre: data.referencia2Nombre ?? null,
          referencia2Relacion: data.referencia2Relacion ?? null,
          referencia2Telefono: data.referencia2Telefono ?? null,
          activo: true,
        }
        personas.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, data: Partial<Pick<Persona, 'nombre' | 'documento' | 'telefono' | 'fotoUrl' | 'email' | 'direccion' | 'referencia1Nombre' | 'referencia1Relacion' | 'referencia1Telefono' | 'referencia2Nombre' | 'referencia2Relacion' | 'referencia2Telefono'>>): Promise<Persona | null> {
        const idx = personas.findIndex(p => p.id === id)
        if (idx === -1) return null
        if (data.documento && personas.some(p => p.documento === data.documento && p.id !== id)) {
          throw new Error('documento_duplicado')
        }
        personas[idx] = { ...personas[idx], ...data }
        notify()
        return personas[idx]
      },
      async desactivar(id: string): Promise<Persona | null> {
        const idx = personas.findIndex(p => p.id === id)
        if (idx === -1) return null
        personas[idx] = { ...personas[idx], activo: false }
        for (let i = 0; i < personasRoles.length; i++) {
          if (personasRoles[i].personaId === id) personasRoles[i] = { ...personasRoles[i], activo: false }
        }
        notify()
        return personas[idx]
      },
      async reactivar(id: string): Promise<Persona | null> {
        const idx = personas.findIndex(p => p.id === id)
        if (idx === -1) return null
        personas[idx] = { ...personas[idx], activo: true }
        notify()
        return personas[idx]
      },
    },

    personasRoles: {
      activos(): PersonaRol[] {
        return personasRoles.filter(r => r.activo)
      },
      async asignar(personaId: string, rolId: RolCanonico): Promise<PersonaRol> {
        const yaExiste = personasRoles.find(r => r.personaId === personaId && r.rolId === rolId)
        if (yaExiste) {
          if (!yaExiste.activo) {
            const idx = personasRoles.findIndex(r => r.id === yaExiste.id)
            personasRoles[idx] = { ...yaExiste, activo: true }
            notify()
            return personasRoles[idx]
          }
          return yaExiste
        }
        const nuevo: PersonaRol = {
          id: generateId('pr'),
          personaId,
          rolId,
          activo: true,
          desde: new Date().toISOString(),
        }
        personasRoles.push(nuevo)
        notify()
        return nuevo
      },
      async desasignar(personaId: string, rolId: RolCanonico): Promise<PersonaRol | null> {
        const idx = personasRoles.findIndex(r => r.personaId === personaId && r.rolId === rolId && r.activo)
        if (idx === -1) return null
        personasRoles[idx] = { ...personasRoles[idx], activo: false }
        notify()
        return personasRoles[idx]
      },
    },

    // --- F3: Producción (mínimo para gates) ---
    modulos: {
      porProyecto(proyectoId: string): Modulo[] {
        return modulos.filter(m => m.proyectoId === proyectoId)
      },
      async actualizarEstado(id: string, estado: string): Promise<Modulo | null> {
        const idx = modulos.findIndex(m => m.id === id)
        if (idx === -1) return null
        // P-16 R2/CA-3: solo avanza un paso a la vez en por_armar→en_armado→armado→en_calidad.
        if (!transicionModuloValida(modulos[idx].estado, estado)) return null
        modulos[idx] = { ...modulos[idx], estado }
        notify()
        return modulos[idx]
      },
    },
    estimaciones: {
      porProyecto(proyectoId: string): Estimacion | undefined {
        return estimaciones.find(e => e.proyectoId === proyectoId)
      },
    },

    // --- F5: Taller, calidad, instalación, entrega, garantía ---
    ordenesTrabajo: {
      porProyecto(proyectoId: string): OrdenTrabajo[] {
        return ordenesTrabajo.filter(o => o.proyectoId === proyectoId)
      },
      async crear(data: { proyectoId: string; tipo: TipoOrdenTrabajo; pedidoWebId?: string | null }): Promise<OrdenTrabajo> {
        const nuevo: OrdenTrabajo = {
          id: generateId('ot'),
          proyectoId: data.proyectoId,
          pedidoWebId: data.pedidoWebId ?? null,
          tipo: data.tipo,
          estado: 'abierta',
          createdAt: new Date().toISOString(),
        }
        ordenesTrabajo.push(nuevo)
        notify()
        return nuevo
      },
    },

    pedidosWeb: {
      listar(): PedidoWeb[] {
        return masRecientePrimero(pedidosWeb)
      },
      porCliente(clienteId: string): PedidoWeb[] {
        return pedidosWeb.filter(p => p.clienteId === clienteId)
      },
      async crear(data: { clienteId: string; totalPedido: string }): Promise<PedidoWeb> {
        const nuevo: PedidoWeb = {
          id: generateId('pw'),
          clienteId: data.clienteId,
          proyectoId: null,
          estado: 'nuevo',
          totalPedido: data.totalPedido,
          createdAt: new Date().toISOString(),
        }
        pedidosWeb.push(nuevo)
        notify()
        return nuevo
      },
      async actualizarEstado(id: string, estado: string): Promise<PedidoWeb | null> {
        const idx = pedidosWeb.findIndex(p => p.id === id)
        if (idx === -1) return null
        pedidosWeb[idx] = { ...pedidosWeb[idx], estado }
        notify()
        return pedidosWeb[idx]
      },
      async enganchar(id: string, proyectoId: string): Promise<PedidoWeb | null> {
        if (!proyectoId) return null
        const idx = pedidosWeb.findIndex(p => p.id === id)
        if (idx === -1) return null
        // R2: reintentar sobre uno ya enganchado no duplica la orden de trabajo.
        if (pedidosWeb[idx].estado === 'enganchado') return pedidosWeb[idx]
        pedidosWeb[idx] = { ...pedidosWeb[idx], estado: 'enganchado', proyectoId }
        ordenesTrabajo.push({
          id: generateId('ot'),
          proyectoId,
          pedidoWebId: id,
          tipo: 'produccion',
          estado: 'abierta',
          createdAt: new Date().toISOString(),
        })
        notify()
        return pedidosWeb[idx]
      },
    },

    citacionesCalidad: {
      porProyecto(proyectoId: string): CitacionCalidad[] {
        return citacionesCalidad.filter(c => c.proyectoId === proyectoId)
      },
      async crear(data: { proyectoId: string; modulosIds: string[]; fecha: string }): Promise<CitacionCalidad> {
        const nuevo: CitacionCalidad = {
          id: generateId('cit'),
          proyectoId: data.proyectoId,
          modulosIds: data.modulosIds,
          estado: 'citada',
          fecha: data.fecha,
          createdAt: new Date().toISOString(),
        }
        citacionesCalidad.push(nuevo)
        notify()
        return nuevo
      },
    },

    reprocesos: {
      porProyecto(proyectoId: string): Reproceso[] {
        return reprocesos.filter(r => r.proyectoId === proyectoId)
      },
      async crear(data: { proyectoId: string; origen: OrigenReproceso; moduloId?: string | null; culpable?: string | null; granularidad?: 'modulo' | 'componente' | null; descripcion?: string | null }): Promise<Reproceso> {
        const nuevo: Reproceso = {
          id: generateId('rep'),
          proyectoId: data.proyectoId,
          origen: data.origen,
          moduloId: data.moduloId ?? null,
          culpable: data.culpable ?? null,
          granularidad: data.granularidad ?? null,
          descripcion: data.descripcion ?? null,
          estado: 'abierto',
          createdAt: new Date().toISOString(),
        }
        reprocesos.push(nuevo)
        notify()
        return nuevo
      },
    },

    instalaciones: {
      porProyecto(proyectoId: string): Instalacion[] {
        return instalaciones.filter(i => i.proyectoId === proyectoId)
      },
      async programar(data: { proyectoId: string; rangoFechaInicio: string; rangoFechaFin: string }): Promise<Instalacion | null> {
        // P-18 R1/R40/CA-2: rango ≤5 días.
        if (!rangoInstalacionValido(data.rangoFechaInicio, data.rangoFechaFin)) return null
        const now = new Date().toISOString()
        const nuevo: Instalacion = {
          id: generateId('ins'),
          proyectoId: data.proyectoId,
          rangoFechaInicio: data.rangoFechaInicio,
          rangoFechaFin: data.rangoFechaFin,
          estado: 'programada',
          adelantadaPor: null,
          createdAt: now,
          updatedAt: now,
        }
        instalaciones.push(nuevo)
        notify()
        return nuevo
      },
      async iniciar(id: string): Promise<Instalacion | null> {
        const idx = instalaciones.findIndex(i => i.id === id)
        if (idx === -1) return null
        const inst = instalaciones[idx]
        const proyecto = proyectos.find(p => p.id === inst.proyectoId)
        if (!proyecto) return null
        // P-18 R2: guard P24 (E-24 ya aprobado para este proyecto).
        const citaciones = citacionesCalidad.filter(c => c.proyectoId === inst.proyectoId)
        const verifsProyecto = verificaciones.filter(v => v.proyectoId === inst.proyectoId)
        if (!P24(proyecto, citaciones, verifsProyecto)) return null
        // P-18 R4: asignar adelantadaPor si existe un check con desenlaceFinal='todo_bien' (instalación adelantada por check positivo).
        const checkAdelanto = checks
          .filter(c => c.proyectoId === inst.proyectoId && c.desenlaceFinal === 'todo_bien')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        const adelantadaPor = checkAdelanto?.id ?? null
        instalaciones[idx] = { ...inst, estado: 'en_curso', adelantadaPor, updatedAt: new Date().toISOString() }
        setProyectoEstado(inst.proyectoId, 'en_instalacion')
        notify()
        return instalaciones[idx]
      },
      async marcarInstalada(id: string): Promise<Instalacion | null> {
        const idx = instalaciones.findIndex(i => i.id === id)
        if (idx === -1) return null
        instalaciones[idx] = { ...instalaciones[idx], estado: 'instalada', updatedAt: new Date().toISOString() }
        // R3: mueve el proyecto automáticamente.
        setProyectoEstado(instalaciones[idx].proyectoId, 'instalado')
        notify()
        return instalaciones[idx]
      },
      async marcarFallida(id: string, motivo: string): Promise<Instalacion | null> {
        const idx = instalaciones.findIndex(i => i.id === id)
        if (idx === -1) return null
        instalaciones[idx] = { ...instalaciones[idx], estado: 'fallida', updatedAt: new Date().toISOString() }
        reprocesos.push({
          id: generateId('rep'),
          proyectoId: instalaciones[idx].proyectoId,
          origen: 'instalacion',
          moduloId: null,
          culpable: null,
          granularidad: null,
          descripcion: motivo,
          estado: 'abierto',
          createdAt: new Date().toISOString(),
        })
        notify()
        return instalaciones[idx]
      },
    },

    actasEntrega: {
      porProyecto(proyectoId: string): ActaEntrega | undefined {
        return actasEntrega.find(a => a.proyectoId === proyectoId)
      },
      async generar(proyectoId: string, data?: { holguraOperativaDias?: number; fotos?: string[]; observaciones?: string | null }): Promise<ActaEntrega | null> {
        // R1: solo si hay una instalación 'instalada' para este proyecto.
        const instalada = instalaciones.find(i => i.proyectoId === proyectoId && i.estado === 'instalada')
        if (!instalada) return null
        const now = new Date().toISOString()
        const nuevo: ActaEntrega = {
          id: generateId('acta'),
          proyectoId,
          pdfUrl: `https://r2.mock/actas/${proyectoId}.pdf`,
          estado: 'generada',
          holguraOperativaDias: data?.holguraOperativaDias ?? 12,
          fotos: data?.fotos ?? [],
          observaciones: data?.observaciones ?? null,
          createdAt: now,
          updatedAt: now,
        }
        actasEntrega.push(nuevo)
        notify()
        return nuevo
      },
      async enviar(id: string): Promise<ActaEntrega | null> {
        const idx = actasEntrega.findIndex(a => a.id === id)
        if (idx === -1) return null
        if (!actasEntrega[idx].pdfUrl) return null
        actasEntrega[idx] = { ...actasEntrega[idx], estado: 'enviada', updatedAt: new Date().toISOString() }
        notify()
        return actasEntrega[idx]
      },
      async firmar(id: string): Promise<ActaEntrega | null> {
        const idx = actasEntrega.findIndex(a => a.id === id)
        if (idx === -1) return null
        actasEntrega[idx] = { ...actasEntrega[idx], estado: 'firmada', updatedAt: new Date().toISOString() }
        // R3: mueve el proyecto → entregado (E-26).
        setProyectoEstado(actasEntrega[idx].proyectoId, 'entregado')
        notify()
        return actasEntrega[idx]
      },
    },

    casosGarantia: {
      porProyecto(proyectoId: string): CasoGarantia[] {
        return casosGarantia.filter(c => c.proyectoId === proyectoId)
      },
      porCliente(clienteId: string): CasoGarantia[] {
        return casosGarantia.filter(c => c.clienteId === clienteId)
      },
      async reportar(data: { proyectoId: string; moduloId?: string | null; clienteId?: string | null; descripcion: string; fotos?: string[] }): Promise<CasoGarantia | null> {
        const proyecto = proyectos.find(p => p.id === data.proyectoId)
        // R1: solo proyectos entregados.
        if (!proyecto || proyecto.estado !== 'entregado') return null
        const fotos = data.fotos ?? []
        // R4: máx 5 fotos.
        if (fotos.length > 5) return null
        // R2: fecha de entrega = última transición a 'entregado' en el historial (fallback: updatedAt).
        const historialEntrega = proyectosEstadosHistorial
          .filter(h => h.proyectoId === data.proyectoId && h.estadoNuevo === 'entregado')
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        const fechaEntrega = historialEntrega?.createdAt ?? proyecto.updatedAt
        const now = new Date().toISOString()
        const nuevo: CasoGarantia = {
          id: generateId('gar'),
          proyectoId: data.proyectoId,
          moduloId: data.moduloId ?? null,
          clienteId: data.clienteId ?? proyecto.clienteId,
          descripcion: data.descripcion,
          fotos,
          estado: 'reportado',
          dentroGarantiaContractual: dentroGarantiaContractual(fechaEntrega, now, proyecto.garantiaAnios),
          fechaReporte: now,
          diagnostico: null,
          solucionAplicada: null,
          createdAt: now,
          updatedAt: now,
        }
        casosGarantia.push(nuevo)
        notify()
        return nuevo
      },
      async diagnosticar(id: string, diagnostico: string): Promise<CasoGarantia | null> {
        const idx = casosGarantia.findIndex(c => c.id === id)
        if (idx === -1) return null
        if (diagnostico.trim().length === 0) return null
        casosGarantia[idx] = { ...casosGarantia[idx], diagnostico, estado: 'diagnosticado', updatedAt: new Date().toISOString() }
        notify()
        return casosGarantia[idx]
      },
      async crearOrdenReparacion(id: string): Promise<CasoGarantia | null> {
        const idx = casosGarantia.findIndex(c => c.id === id)
        if (idx === -1) return null
        const caso = casosGarantia[idx]
        // R6: tipo='garantia'.
        ordenesTrabajo.push({ id: generateId('ot'), proyectoId: caso.proyectoId, pedidoWebId: null, tipo: 'garantia', estado: 'abierta', createdAt: new Date().toISOString() })
        casosGarantia[idx] = { ...caso, estado: 'en_reparacion', updatedAt: new Date().toISOString() }
        notify()
        return casosGarantia[idx]
      },
      async dispararReproceso(id: string): Promise<CasoGarantia | null> {
        const idx = casosGarantia.findIndex(c => c.id === id)
        if (idx === -1) return null
        const caso = casosGarantia[idx]
        if (!caso.dentroGarantiaContractual) return null
        reprocesos.push({
          id: generateId('rep'),
          proyectoId: caso.proyectoId,
          origen: 'garantia',
          moduloId: caso.moduloId,
          culpable: null,
          granularidad: caso.moduloId ? 'modulo' : null,
          descripcion: caso.descripcion,
          estado: 'abierto',
          createdAt: new Date().toISOString(),
        })
        casosGarantia[idx] = { ...caso, estado: 'en_reparacion', updatedAt: new Date().toISOString() }
        notify()
        return casosGarantia[idx]
      },
      async resolver(id: string, solucionAplicada: string): Promise<CasoGarantia | null> {
        const idx = casosGarantia.findIndex(c => c.id === id)
        if (idx === -1) return null
        if (solucionAplicada.trim().length === 0) return null
        casosGarantia[idx] = { ...casosGarantia[idx], solucionAplicada, estado: 'resuelto', updatedAt: new Date().toISOString() }
        notify()
        return casosGarantia[idx]
      },
      async cerrar(id: string): Promise<CasoGarantia | null> {
        const idx = casosGarantia.findIndex(c => c.id === id)
        if (idx === -1) return null
        casosGarantia[idx] = { ...casosGarantia[idx], estado: 'cerrado', updatedAt: new Date().toISOString() }
        notify()
        return casosGarantia[idx]
      },
    },

    citasGarantia: {
      porCaso(casoId: string): CitaGarantia[] {
        return citasGarantia.filter(c => c.casoId === casoId)
      },
      async agendar(data: { casoId: string; proyectoId: string; fecha: string }): Promise<CitaGarantia> {
        const nuevo: CitaGarantia = {
          id: generateId('citg'),
          casoId: data.casoId,
          proyectoId: data.proyectoId,
          fecha: data.fecha,
          diagnosticadoPor: null,
          resultado: null,
          createdAt: new Date().toISOString(),
        }
        citasGarantia.push(nuevo)
        notify()
        return nuevo
      },
    },

    // --- F6: Finanzas ---
    cuentasFinancieras: {
      listar(): CuentaFinanciera[] {
        return cuentasFinancieras
      },
      async crear(data: { nombre: string; tipo: string; saldoActual?: string }): Promise<CuentaFinanciera> {
        const nuevo: CuentaFinanciera = {
          id: generateId('cta'),
          nombre: data.nombre,
          tipo: data.tipo,
          saldoActual: data.saldoActual ?? '0',
          createdAt: new Date().toISOString(),
        }
        cuentasFinancieras.push(nuevo)
        notify()
        return nuevo
      },
      disponible(): number {
        // R4 P-21/E-20: recalculado siempre, nunca cacheado.
        return calcularCajaDisponible(cuentasFinancieras, obligacionesPendientes)
      },
    },

    movimientosFinancieros: {
      listar(): MovimientoFinanciero[] {
        return masRecientePrimero(movimientosFinancieros)
      },
      porCuenta(cuentaId: string): MovimientoFinanciero[] {
        return movimientosFinancieros.filter(m => m.cuentaOrigenId === cuentaId || m.cuentaDestinoId === cuentaId)
      },
      porProyecto(proyectoId: string): MovimientoFinanciero[] {
        return movimientosFinancieros.filter(m => m.proyectoId === proyectoId)
      },
    },

    obligacionesPendientes: {
      listar(): ObligacionPendiente[] {
        return obligacionesPendientes
      },
      porProyecto(proyectoId: string): ObligacionPendiente[] {
        return obligacionesPendientes.filter(o => o.proyectoId === proyectoId)
      },
      porPersona(personaId: string): ObligacionPendiente[] {
        return obligacionesPendientes.filter(o => o.personaId === personaId)
      },
      porProveedor(proveedorId: string): ObligacionPendiente[] {
        return obligacionesPendientes.filter(o => o.proveedorId === proveedorId)
      },
      async crear(data: Partial<ObligacionPendiente> & { descripcion: string; origen: OrigenObligacion; montoTotal: string; fechaVencimiento: string }): Promise<ObligacionPendiente> {
        const nuevo: ObligacionPendiente = {
          id: generateId('obl'),
          descripcion: data.descripcion,
          origen: data.origen,
          montoTotal: data.montoTotal,
          montoPagado: data.montoPagado ?? '0',
          fechaVencimiento: data.fechaVencimiento,
          estado: data.estado ?? 'pendiente',
          personaId: data.personaId ?? null,
          clienteId: data.clienteId ?? null,
          proveedorId: data.proveedorId ?? null,
          proyectoId: data.proyectoId ?? null,
          contratoId: data.contratoId ?? null,
          hitoId: data.hitoId ?? null,
          ordenCompraId: data.ordenCompraId ?? null,
          baseCalculo: data.baseCalculo ?? null,
          porcentaje: data.porcentaje ?? null,
          tipoComision: data.tipoComision ?? null,
          cantidadModulos: data.cantidadModulos ?? null,
          desfaseId: data.desfaseId ?? null,
          periodicidad: data.periodicidad ?? null,
          deduccionDiseno3d: data.deduccionDiseno3d ?? false,
          createdAt: new Date().toISOString(),
        }
        obligacionesPendientes.push(nuevo)
        notify()
        return nuevo
      },
      async registrarPago(id: string, data: { monto: string; cuentaId: string; medioPago?: string }): Promise<ObligacionPendiente | null> {
        const idx = obligacionesPendientes.findIndex(o => o.id === id)
        if (idx === -1) return null
        const obligacion = obligacionesPendientes[idx]
        const nuevoPagado = numDe(obligacion.montoPagado) + numDe(data.monto)
        if (nuevoPagado > numDe(obligacion.montoTotal)) return null
        const cuentaIdx = cuentasFinancieras.findIndex(c => c.id === data.cuentaId)
        if (cuentaIdx === -1) return null
        // R3: movimiento + monto_pagado en la misma "transacción" (mock, sin tx real).
        movimientosFinancieros.push({
          id: generateId('mov'),
          fecha: new Date().toISOString().slice(0, 10),
          descripcion: `Pago obligación: ${obligacion.descripcion}`,
          tipo: 'debito',
          monto: data.monto,
          cuentaOrigenId: cuentasFinancieras[cuentaIdx].id,
          cuentaDestinoId: null,
          obligacionId: id,
          ordenCompraId: null,
          proyectoId: obligacion.proyectoId,
          contratoId: obligacion.contratoId,
          socioId: obligacion.personaId,
          medioPago: data.medioPago ?? null,
          comprobanteUrl: null,
          prioridadPago: null,
          createdAt: new Date().toISOString(),
        })
        cuentasFinancieras[cuentaIdx] = { ...cuentasFinancieras[cuentaIdx], saldoActual: String(numDe(cuentasFinancieras[cuentaIdx].saldoActual) - numDe(data.monto)) }
        const estado: EstadoObligacion = nuevoPagado >= numDe(obligacion.montoTotal) ? 'pagado' : 'parcial'
        obligacionesPendientes[idx] = { ...obligacion, montoPagado: String(nuevoPagado), estado }
        notify()
        return obligacionesPendientes[idx]
      },
    },

    ordenesCompra: {
      listar(): OrdenCompra[] {
        return masRecientePrimero(ordenesCompra)
      },
      porProveedor(proveedorId: string): OrdenCompra[] {
        return ordenesCompra.filter(o => o.proveedorId === proveedorId)
      },
      async crear(data: Partial<OrdenCompra> & { proveedorId: string; montoTotal: string }): Promise<OrdenCompra> {
        const now = new Date().toISOString()
        const nuevo: OrdenCompra = {
          id: generateId('oc'),
          codigoOrden: data.codigoOrden ?? `OC-${Date.now()}`,
          proyectoId: data.proyectoId ?? null,
          proveedorId: data.proveedorId,
          montoTotal: data.montoTotal,
          anticipoMonto: data.anticipoMonto ?? null,
          estado: data.estado ?? 'solicitada',
          mecanicaPago: data.mecanicaPago ?? 'unico',
          fechaRecepcionEsperada: data.fechaRecepcionEsperada ?? null,
          tiempoEntregaDias: data.tiempoEntregaDias ?? null,
          createdAt: now,
          updatedAt: now,
        }
        ordenesCompra.push(nuevo)
        // C-01 (auditoría 2026-08-10): crea la obligación de pago al proveedor automáticamente,
        // en la misma operación — mismo patrón que cuentasCobroProveedor.crear(), aplicado acá
        // porque faltaba: sin esto, una OC en curso no aparecía en Obligaciones ni se descontaba
        // del saldo disponible de Caja (cuentasFinancieras.disponible() sí resta obligaciones).
        // P-21 Fix: asignar ordenCompraId para vincular la obligación a su OC de origen.
        obligacionesPendientes.push({
          id: generateId('obl'),
          descripcion: `Orden de compra: ${nuevo.codigoOrden}`,
          origen: 'proveedor',
          montoTotal: nuevo.montoTotal,
          montoPagado: '0',
          fechaVencimiento: nuevo.fechaRecepcionEsperada ?? now.slice(0, 10),
          estado: 'pendiente',
          personaId: null,
          clienteId: null,
          proveedorId: nuevo.proveedorId,
          proyectoId: nuevo.proyectoId,
          contratoId: null,
          hitoId: null,
          ordenCompraId: nuevo.id,
          baseCalculo: null,
          porcentaje: null,
          tipoComision: null,
          cantidadModulos: null,
          desfaseId: null,
          periodicidad: null,
          deduccionDiseno3d: false,
          createdAt: now,
        })
        notify()
        return nuevo
      },
      async actualizarEstado(id: string, estado: EstadoOrdenCompra): Promise<OrdenCompra | null> {
        const idx = ordenesCompra.findIndex(o => o.id === id)
        if (idx === -1) return null
        ordenesCompra[idx] = { ...ordenesCompra[idx], estado, updatedAt: new Date().toISOString() }
        notify()
        return ordenesCompra[idx]
      },
    },

    registrosGateCaja: {
      listar(): RegistroGateCaja[] {
        return registrosGateCaja
      },
      porOrdenCompra(ordenCompraId: string): RegistroGateCaja[] {
        return registrosGateCaja.filter(r => r.ordenCompraId === ordenCompraId)
      },
    },

    caja: {
      async autorizarPago(data: { ordenCompraId: string; cuentaId: string; medioPago?: string }): Promise<MovimientoFinanciero | null> {
        const idx = ordenesCompra.findIndex(o => o.id === data.ordenCompraId)
        if (idx === -1) return null
        const oc = ordenesCompra[idx]
        if (oc.estado !== 'en_pago') return null
        // Predicado E-20: caja_disponible = Σcuentas − Σobligaciones pendientes.
        const disponible = calcularCajaDisponible(cuentasFinancieras, obligacionesPendientes)
        const monto = numDe(oc.montoTotal)
        const ahora = new Date().toISOString()
        if (monto > disponible) {
          // R2: rama negativa — bloqueo, la OC permanece en_pago.
          registrosGateCaja.push({
            id: generateId('rgc'),
            ordenCompraId: oc.id,
            fecha: ahora,
            montoSolicitado: oc.montoTotal,
            saldoDisponible: String(disponible),
            bloqueado: true,
            decision: null,
            resolucion: null,
            createdAt: ahora,
          })
          notify()
          return null
        }
        const cuentaIdx = cuentasFinancieras.findIndex(c => c.id === data.cuentaId)
        if (cuentaIdx === -1) return null
        // R1: movimiento + OC→pagada en la misma "transacción" (mock, sin tx real).
        // P-21 Fix: encontrar la ObligacionPendiente vinculada a esta OC y actualizar su montoPagado.
        const obligacionIdx = obligacionesPendientes.findIndex(o => o.ordenCompraId === oc.id)
        const movimiento: MovimientoFinanciero = {
          id: generateId('mov'),
          fecha: ahora.slice(0, 10),
          descripcion: `Pago OC ${oc.codigoOrden}`,
          tipo: 'debito',
          monto: oc.montoTotal,
          cuentaOrigenId: cuentasFinancieras[cuentaIdx].id,
          cuentaDestinoId: null,
          obligacionId: obligacionIdx >= 0 ? obligacionesPendientes[obligacionIdx].id : null,
          ordenCompraId: oc.id,
          proyectoId: oc.proyectoId,
          contratoId: null,
          socioId: null,
          medioPago: data.medioPago ?? null,
          comprobanteUrl: null,
          prioridadPago: null,
          createdAt: ahora,
        }
        movimientosFinancieros.push(movimiento)
        cuentasFinancieras[cuentaIdx] = { ...cuentasFinancieras[cuentaIdx], saldoActual: String(numDe(cuentasFinancieras[cuentaIdx].saldoActual) - monto) }
        ordenesCompra[idx] = { ...oc, estado: 'pagada', updatedAt: ahora }
        // P-21 Fix: actualizar la obligación vinculada: incrementar montoPagado y, si es necesario, cambiar estado a 'pagado'.
        if (obligacionIdx >= 0) {
          const obligacion = obligacionesPendientes[obligacionIdx]
          const nuevoPagado = numDe(obligacion.montoPagado) + monto
          const estado: EstadoObligacion = nuevoPagado >= numDe(obligacion.montoTotal) ? 'pagado' : 'parcial'
          obligacionesPendientes[obligacionIdx] = { ...obligacion, montoPagado: String(nuevoPagado), estado }
        }
        notify()
        return movimiento
      },
    },

    proveedores: {
      listar(): Proveedor[] {
        return masRecientePrimero(proveedores)
      },
      obtenerPorId(id: string): Proveedor | undefined {
        return proveedores.find(p => p.id === id)
      },
      async crear(data: Partial<Proveedor> & { nombre: string }): Promise<Proveedor> {
        const nuevo: Proveedor = {
          id: generateId('prov'),
          nombre: data.nombre,
          nit: data.nit ?? null,
          telefonoComercial: data.telefonoComercial ?? null,
          direccionDespacho: data.direccionDespacho ?? null,
          ciudad: data.ciudad ?? null,
          medioPago: data.medioPago ?? null,
          diasEntregaDefault: data.diasEntregaDefault ?? null,
          transportadora: data.transportadora ?? null,
          tarifaFlete: data.tarifaFlete ?? null,
          createdAt: new Date().toISOString(),
        }
        proveedores.push(nuevo)
        notify()
        return nuevo
      },
    },

    itemsOrdenCompra: {
      porOrdenCompra(ordenCompraId: string): ItemOrdenCompra[] {
        return itemsOrdenCompra.filter(i => i.ordenCompraId === ordenCompraId)
      },
      async crear(data: { ordenCompraId: string; productoCatalogoId?: string | null; especificacion?: string | null; cantidadEsperada: number }): Promise<ItemOrdenCompra | null> {
        const tieneProducto = !!data.productoCatalogoId
        const tieneEspecificacion = !!data.especificacion && data.especificacion.trim().length > 0
        // D-04: exactamente una vía — catálogo (1) o a pedido (2), nunca ambas ni ninguna.
        if (tieneProducto === tieneEspecificacion) return null
        const nuevo: ItemOrdenCompra = {
          id: generateId('ioc'),
          ordenCompraId: data.ordenCompraId,
          productoCatalogoId: data.productoCatalogoId ?? null,
          especificacion: data.especificacion ?? null,
          cantidadEsperada: data.cantidadEsperada,
          recibidoCantidad: 0,
          sinDefectos: false,
        }
        itemsOrdenCompra.push(nuevo)
        notify()
        return nuevo
      },
      async crearDesdeSugeridos(ordenCompraId: string, sugeridos: { productoCatalogoId: string; cantidad: number }[]): Promise<ItemOrdenCompra[]> {
        const nuevos: ItemOrdenCompra[] = sugeridos.map((s) => ({
          id: generateId('ioc'),
          ordenCompraId,
          productoCatalogoId: s.productoCatalogoId,
          especificacion: null,
          cantidadEsperada: s.cantidad,
          recibidoCantidad: 0,
          sinDefectos: false,
        }))
        itemsOrdenCompra.push(...nuevos)
        notify()
        return nuevos
      },
    },

    recepcionesMaterial: {
      porOrdenCompra(ordenCompraId: string): RecepcionMaterial[] {
        return recepcionesMaterial.filter(r => r.ordenCompraId === ordenCompraId)
      },
      porProyecto(proyectoId: string): RecepcionMaterial[] {
        return recepcionesMaterial.filter(r => r.proyectoId === proyectoId)
      },
      async crear(data: { ordenCompraId: string; proyectoId?: string | null }): Promise<RecepcionMaterial> {
        const nuevo: RecepcionMaterial = {
          id: generateId('recm'),
          ordenCompraId: data.ordenCompraId,
          proyectoId: data.proyectoId ?? null,
          checkPedidoBien: false,
          checkDespachoBien: false,
          checkMaterial: false,
          estado: 'pendiente',
          descripcionDefecto: null,
          createdAt: new Date().toISOString(),
        }
        recepcionesMaterial.push(nuevo)
        notify()
        return nuevo
      },
      async actualizarChecks(id: string, data: { checkPedidoBien: boolean; checkDespachoBien: boolean; checkMaterial: boolean; descripcionDefecto?: string | null }): Promise<RecepcionMaterial | null> {
        const idx = recepcionesMaterial.findIndex(r => r.id === id)
        if (idx === -1) return null
        const completa = data.checkPedidoBien && data.checkDespachoBien && data.checkMaterial
        // R3: si algún check falla, exige descripción del defecto no vacía.
        if (!completa && (!data.descripcionDefecto || data.descripcionDefecto.trim().length === 0)) return null
        const estado: EstadoRecepcionMaterial = completa ? 'recibido_verificado' : 'recibido_defectuoso'
        recepcionesMaterial[idx] = {
          ...recepcionesMaterial[idx],
          checkPedidoBien: data.checkPedidoBien,
          checkDespachoBien: data.checkDespachoBien,
          checkMaterial: data.checkMaterial,
          descripcionDefecto: data.descripcionDefecto ?? null,
          estado,
        }
        // E-21: 3/3 checks → la OC pasa a recibida_verificada, misma operación.
        if (completa) {
          const ocIdx = ordenesCompra.findIndex(o => o.id === recepcionesMaterial[idx].ordenCompraId)
          if (ocIdx !== -1) {
            ordenesCompra[ocIdx] = { ...ordenesCompra[ocIdx], estado: 'recibida_verificada', updatedAt: new Date().toISOString() }
          }
          // D-04 (re-auditoría 2026-08-10): recibidoCantidad/sinDefectos se creaban en 0/false y
          // ningún código los actualizaba nunca -- la tabla "Ítems esperados" de la recepción mostraba
          // "0"/"No" para siempre, incluso tras una recepción verificada 3/3. Sin granularidad por ítem
          // en esta UI (el check es agregado por OC), la única lectura consistente de "3/3 correcto" es
          // que todos los ítems llegaron completos y sin defecto.
          itemsOrdenCompra.forEach((it, i) => {
            if (it.ordenCompraId === recepcionesMaterial[idx].ordenCompraId) {
              itemsOrdenCompra[i] = { ...it, recibidoCantidad: it.cantidadEsperada, sinDefectos: true }
            }
          })
        }
        notify()
        return recepcionesMaterial[idx]
      },
    },

    herramientas: {
      listar(): Herramienta[] {
        return masRecientePrimero(herramientas)
      },
      async crear(data: { nombre: string; valor: string; fotoUrl?: string | null; proveedorId?: string | null }): Promise<Herramienta> {
        const nuevo: Herramienta = {
          id: generateId('herr'),
          nombre: data.nombre,
          estadoOperativo: 'operativa',
          valor: data.valor,
          fotoUrl: data.fotoUrl ?? null,
          proveedorId: data.proveedorId ?? null,
          ordenCompraReposicionId: null,
          createdAt: new Date().toISOString(),
        }
        herramientas.push(nuevo)
        notify()
        return nuevo
      },
      async actualizarEstado(id: string, estado: EstadoOperativoHerramienta): Promise<Herramienta | null> {
        const idx = herramientas.findIndex(h => h.id === id)
        if (idx === -1) return null
        herramientas[idx] = { ...herramientas[idx], estadoOperativo: estado }
        notify()
        return herramientas[idx]
      },
      async reponer(id: string): Promise<{ herramienta: Herramienta; ordenCompra: OrdenCompra } | null> {
        const idx = herramientas.findIndex(h => h.id === id)
        if (idx === -1) return null
        // R2: no duplica si ya hay una OC de reposición abierta para esta herramienta.
        const existente = herramientas[idx].ordenCompraReposicionId
          ? ordenesCompra.find(o => o.id === herramientas[idx].ordenCompraReposicionId && o.estado !== 'cancelada' && o.estado !== 'rechazada' && o.estado !== 'pagada')
          : undefined
        if (existente) return { herramienta: herramientas[idx], ordenCompra: existente }
        // D-05 (re-auditoría 2026-08-10): antes usaba `?? ''` acá -- una herramienta sin proveedor
        // asignado generaba una OrdenCompra con proveedorId: '' (string vacío), pese a que el tipo
        // declara proveedorId: string no-nullable y el formulario manual de "Nueva orden de compra"
        // (compras/page.tsx) exige proveedor como campo obligatorio. Guardia explícita en vez de
        // fabricar una OC sin proveedor real.
        if (!herramientas[idx].proveedorId) return null
        const now = new Date().toISOString()
        const nuevaOC: OrdenCompra = {
          id: generateId('oc'),
          codigoOrden: `OC-${Date.now()}`,
          proyectoId: null,
          proveedorId: herramientas[idx].proveedorId,
          montoTotal: herramientas[idx].valor,
          anticipoMonto: null,
          estado: 'solicitada',
          mecanicaPago: 'unico',
          fechaRecepcionEsperada: null,
          tiempoEntregaDias: null,
          createdAt: now,
          updatedAt: now,
        }
        ordenesCompra.push(nuevaOC)
        herramientas[idx] = { ...herramientas[idx], estadoOperativo: 'necesita_reposicion', ordenCompraReposicionId: nuevaOC.id }
        notify()
        return { herramienta: herramientas[idx], ordenCompra: nuevaOC }
      },
    },

    documentosProyecto: {
      porProyecto(proyectoId: string): DocumentoProyecto[] {
        return documentosProyecto.filter(d => d.proyectoId === proyectoId)
      },
      async crear(data: { proyectoId: string; etapa: MacroFaseProyecto; alojador: AlojadorDocumento; url: string; nombre: string }): Promise<DocumentoProyecto | null> {
        if (!data.url || data.url.trim().length === 0) return null
        const nuevo: DocumentoProyecto = {
          id: generateId('doc'),
          proyectoId: data.proyectoId,
          etapa: data.etapa,
          alojador: data.alojador,
          url: data.url,
          nombre: data.nombre,
          createdAt: new Date().toISOString(),
        }
        documentosProyecto.push(nuevo)
        notify()
        return nuevo
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = documentosProyecto.findIndex(d => d.id === id)
        if (idx === -1) return false
        documentosProyecto.splice(idx, 1)
        notify()
        return true
      },
    },

    cuentasCobroProveedor: {
      listar(): CuentaCobroProveedor[] {
        return masRecientePrimero(cuentasCobroProveedor)
      },
      porProveedor(proveedorId: string): CuentaCobroProveedor[] {
        return cuentasCobroProveedor.filter(c => c.proveedorId === proveedorId)
      },
      async crear(data: { proveedorId: string; concepto: string; valor: string; firmaDigital: string; fechaEmision: string; fechaVencimiento?: string | null }): Promise<CuentaCobroProveedor | null> {
        // R4: firma digital requerida.
        if (!data.firmaDigital || data.firmaDigital.trim().length === 0) return null
        const now = new Date().toISOString()
        // R2: crea la obligación de pago al proveedor automáticamente, en la misma operación.
        // P-23 Fix: capturar el ID de la obligación para vincularla.
        const obligacionId = generateId('obl')
        const nuevo: CuentaCobroProveedor = {
          id: generateId('ccp'),
          proveedorId: data.proveedorId,
          ordenCompraId: null,
          obligacionId,
          concepto: data.concepto,
          valor: data.valor,
          estado: 'emitida',
          firmaDigital: data.firmaDigital,
          urlDocumento: null,
          fechaEmision: data.fechaEmision,
          fechaVencimiento: data.fechaVencimiento ?? null,
          createdAt: now,
        }
        cuentasCobroProveedor.push(nuevo)
        obligacionesPendientes.push({
          id: obligacionId,
          descripcion: `Cuenta de cobro: ${data.concepto}`,
          origen: 'proveedor',
          montoTotal: data.valor,
          montoPagado: '0',
          fechaVencimiento: data.fechaVencimiento ?? data.fechaEmision,
          estado: 'pendiente',
          personaId: null,
          clienteId: null,
          proveedorId: data.proveedorId,
          proyectoId: null,
          contratoId: null,
          hitoId: null,
          ordenCompraId: null,
          baseCalculo: null,
          porcentaje: null,
          tipoComision: null,
          cantidadModulos: null,
          desfaseId: null,
          periodicidad: null,
          deduccionDiseno3d: false,
          createdAt: now,
        })
        notify()
        return nuevo
      },
      async vincularOC(id: string, ordenCompraId: string): Promise<CuentaCobroProveedor | null> {
        const idx = cuentasCobroProveedor.findIndex(c => c.id === id)
        if (idx === -1) return null
        const oc = ordenesCompra.find(o => o.id === ordenCompraId)
        if (!oc) return null
        // R3: el proveedor de la cuenta debe coincidir con el de la OC.
        if (oc.proveedorId !== cuentasCobroProveedor[idx].proveedorId) return null
        cuentasCobroProveedor[idx] = { ...cuentasCobroProveedor[idx], ordenCompraId, estado: 'vinculada' }
        notify()
        return cuentasCobroProveedor[idx]
      },
      async adjuntarFactura(id: string, urlDocumento: string): Promise<CuentaCobroProveedor | null> {
        const idx = cuentasCobroProveedor.findIndex(c => c.id === id)
        if (idx === -1) return null
        cuentasCobroProveedor[idx] = { ...cuentasCobroProveedor[idx], urlDocumento }
        notify()
        return cuentasCobroProveedor[idx]
      },
      async marcarPagada(id: string): Promise<CuentaCobroProveedor | null> {
        const idx = cuentasCobroProveedor.findIndex(c => c.id === id)
        if (idx === -1) return null
        const cuenta = cuentasCobroProveedor[idx]
        // P-23 Fix: validar que existe un movimiento financiero asociado a la obligación específica.
        // Si no hay obligacionId (data legacy), rechazar para mantener integridad.
        if (!cuenta.obligacionId) return null
        // Buscar si hay algún movimiento que haya pagado esta obligación específica.
        const tieneMovimientoPago = movimientosFinancieros.some(
          m => m.obligacionId === cuenta.obligacionId && m.tipo === 'debito'
        )
        if (!tieneMovimientoPago) return null
        cuentasCobroProveedor[idx] = { ...cuentasCobroProveedor[idx], estado: 'pagada' }
        notify()
        return cuentasCobroProveedor[idx]
      },
      /** R18 (disenio P-23): anular es válida desde cualquier estado. */
      async anular(id: string): Promise<CuentaCobroProveedor | null> {
        const idx = cuentasCobroProveedor.findIndex(c => c.id === id)
        if (idx === -1) return null
        cuentasCobroProveedor[idx] = { ...cuentasCobroProveedor[idx], estado: 'anulada' }
        notify()
        return cuentasCobroProveedor[idx]
      },
    },

    // --- F-02: Tienda web ---
    categorias: {
      listar(): Categoria[] {
        return categorias
      },
      porTipo(tipo: string): Categoria[] {
        return categorias.filter(c => c.tipo === tipo)
      },
      async crear(data: { nombre: string; tipo: string; padreId?: string | null }): Promise<Categoria> {
        const nuevo: Categoria = {
          id: generateId('catg'),
          nombre: data.nombre,
          tipo: data.tipo,
          padreId: data.padreId ?? null,
          activo: true,
        }
        categorias.push(nuevo)
        notify()
        return nuevo
      },
    },

    productosTienda: {
      listar(): ProductoTienda[] {
        return productosTienda
      },
      visibles(): ProductoTienda[] {
        // R1 F-02: solo visibleEnTienda=true.
        return productosTienda.filter(p => p.visibleEnTienda)
      },
      obtenerPorId(id: string): ProductoTienda | undefined {
        return productosTienda.find(p => p.id === id)
      },
      async crear(data: Partial<ProductoTienda> & { catalogoId: string; valorTienda: string }): Promise<ProductoTienda> {
        const now = new Date().toISOString()
        const nuevo: ProductoTienda = {
          id: generateId('pt'),
          catalogoId: data.catalogoId,
          descripcionDiseno: data.descripcionDiseno ?? null,
          imagenPrincipalUrl: data.imagenPrincipalUrl ?? null,
          categoria: data.categoria ?? SHOP_CATEGORIAS.COCINAS,
          visibleEnTienda: data.visibleEnTienda ?? false,
          valorTienda: data.valorTienda,
          inventarioDisponible: data.inventarioDisponible ?? 0,
          calificacionPromedio: data.calificacionPromedio ?? null,
          createdAt: now,
          updatedAt: now,
        }
        productosTienda.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Pick<ProductoTienda, 'descripcionDiseno' | 'imagenPrincipalUrl' | 'categoria' | 'visibleEnTienda' | 'valorTienda' | 'inventarioDisponible'>>): Promise<ProductoTienda | null> {
        const idx = productosTienda.findIndex(p => p.id === id)
        if (idx === -1) return null
        productosTienda[idx] = { ...productosTienda[idx], ...partial, updatedAt: new Date().toISOString() }
        notify()
        return productosTienda[idx]
      },
    },

    productosTiendaComponentes: {
      porProductoTienda(productoTiendaId: string): ProductoTiendaComponente[] {
        return productosTiendaComponentes.filter(c => c.productoTiendaId === productoTiendaId)
      },
      async crear(data: { productoTiendaId: string; catalogoId: string; cantidad: string }): Promise<ProductoTiendaComponente> {
        const now = new Date().toISOString()
        const nuevo: ProductoTiendaComponente = {
          id: generateId('ptc'),
          productoTiendaId: data.productoTiendaId,
          catalogoId: data.catalogoId,
          cantidad: data.cantidad,
          createdAt: now,
          updatedAt: now,
        }
        productosTiendaComponentes.push(nuevo)
        notify()
        return nuevo
      },
      async eliminar(id: string): Promise<void> {
        const idx = productosTiendaComponentes.findIndex(c => c.id === id)
        if (idx === -1) return
        productosTiendaComponentes.splice(idx, 1)
        notify()
      },
    },

    catalogoAcabados: {
      listar(): CatalogoAcabado[] {
        return catalogoAcabados
      },
      async crear(data: Partial<CatalogoAcabado> & { nombre: string }): Promise<CatalogoAcabado> {
        const nuevo: CatalogoAcabado = {
          id: generateId('aca'),
          nombre: data.nombre,
          familia: data.familia ?? null,
          color: data.color ?? null,
          colorHex: data.colorHex ?? null,
          textura: data.textura ?? null,
          precioDiferencial: data.precioDiferencial ?? null,
          imagenTexturaUrl: data.imagenTexturaUrl ?? null,
        }
        catalogoAcabados.push(nuevo)
        notify()
        return nuevo
      },
    },

    catalogoProductoAcabados: {
      porProducto(productoCatalogoId: string): CatalogoProductoAcabado[] {
        return catalogoProductoAcabados.filter(c => c.productoCatalogoId === productoCatalogoId)
      },
      async crear(data: { productoCatalogoId: string; acabadoId: string; esDefault?: boolean }): Promise<CatalogoProductoAcabado> {
        const nuevo: CatalogoProductoAcabado = {
          id: generateId('cpa'),
          productoCatalogoId: data.productoCatalogoId,
          acabadoId: data.acabadoId,
          esDefault: data.esDefault ?? false,
        }
        catalogoProductoAcabados.push(nuevo)
        notify()
        return nuevo
      },
    },

    acabadosMuestras: {
      porAcabado(acabadoId: string): AcabadoMuestra[] {
        return acabadosMuestras.filter(a => a.acabadoId === acabadoId)
      },
      async crear(data: { acabadoId: string; imagenMuestraUrl?: string | null; disponibleWeb?: boolean }): Promise<AcabadoMuestra> {
        const nuevo: AcabadoMuestra = {
          id: generateId('am'),
          acabadoId: data.acabadoId,
          imagenMuestraUrl: data.imagenMuestraUrl ?? null,
          disponibleWeb: data.disponibleWeb ?? true,
        }
        acabadosMuestras.push(nuevo)
        notify()
        return nuevo
      },
    },

    // --- t-147: Taxonomía orgánica de espacios (independiente de las landings) ---
    catalogosEspaciosArquitectonicos: {
      listar(): CatalogoEspacioArquitectonico[] {
        return catalogoEspaciosArquitectonicos
      },
      async crear(data: Partial<CatalogoEspacioArquitectonico> & { codigo: string; nombre: string }): Promise<CatalogoEspacioArquitectonico> {
        const nuevo: CatalogoEspacioArquitectonico = {
          id: generateId('espcat'),
          codigo: data.codigo,
          nombre: data.nombre,
          descripcion: data.descripcion ?? null,
          unidadBase: data.unidadBase ?? null,
          rangoMinimo: data.rangoMinimo ?? null,
          rangoMaximo: data.rangoMaximo ?? null,
          ejemploTamanio: data.ejemploTamanio ?? null,
          modulosTipicosJson: data.modulosTipicosJson ?? null,
          createdAt: new Date().toISOString(),
        }
        catalogoEspaciosArquitectonicos.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Pick<CatalogoEspacioArquitectonico, 'codigo' | 'nombre' | 'descripcion' | 'unidadBase' | 'rangoMinimo' | 'rangoMaximo' | 'ejemploTamanio' | 'modulosTipicosJson'>>): Promise<CatalogoEspacioArquitectonico | null> {
        const idx = catalogoEspaciosArquitectonicos.findIndex(c => c.id === id)
        if (idx === -1) return null
        catalogoEspaciosArquitectonicos[idx] = { ...catalogoEspaciosArquitectonicos[idx], ...partial }
        notify()
        return catalogoEspaciosArquitectonicos[idx]
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = catalogoEspaciosArquitectonicos.findIndex(c => c.id === id)
        if (idx === -1) return false
        catalogoEspaciosArquitectonicos.splice(idx, 1)
        notify()
        return true
      },
    },

    // --- F-03: Portafolio de proyectos ---
    portafolio: {
      listar(): Portafolio[] {
        return masRecientePrimero(portafolio)
      },
      publicados(): Portafolio[] {
        // R1/R4: solo publicado=true, ordenado destacado DESC, luego orden ASC.
        return portafolio
          .filter(p => p.publicado)
          .slice()
          .sort((a, b) => (a.destacado === b.destacado ? a.orden - b.orden : (a.destacado ? -1 : 1)))
      },
      porSlug(slug: string): Portafolio | undefined {
        return portafolio.find(p => p.slug === slug)
      },
      async crear(data: Partial<Portafolio> & { titulo: string; categoriaEspacio: string }): Promise<Portafolio> {
        const now = new Date().toISOString()
        const base = generarSlugPortafolioBase(data.categoriaEspacio, data.barrio ?? null)
        let slug = base
        let sufijo = 2
        while (portafolio.some(p => p.slug === slug)) { slug = `${base}-${sufijo}`; sufijo++ }
         const nuevo: Portafolio = {
           id: generateId('port'),
           proyectoId: data.proyectoId ?? null,
           titulo: data.titulo,
           descripcionComercial: data.descripcionComercial ?? null,
           categoriaEspacio: data.categoriaEspacio,
           espacioVarianteId: data.espacioVarianteId ?? null,
           materialesDestacados: data.materialesDestacados ?? [],
           precioReferencial: data.precioReferencial ?? null,
           imagenPortafolioUrl: data.imagenPortafolioUrl ?? null,
           galeriaPortafolioUrl: data.galeriaPortafolioUrl ?? [],
           barrio: data.barrio ?? null,
           tipoProyecto: data.tipoProyecto ?? null,
           publicado: data.publicado ?? false,
           destacado: data.destacado ?? false,
           orden: data.orden ?? portafolio.length,
           slug,
           createdAt: now,
           updatedAt: now,
         }
        portafolio.push(nuevo)
        notify()
        return nuevo
      },
       async actualizar(id: string, partial: Partial<Pick<Portafolio, 'titulo' | 'descripcionComercial' | 'categoriaEspacio' | 'espacioVarianteId' | 'materialesDestacados' | 'precioReferencial' | 'imagenPortafolioUrl' | 'galeriaPortafolioUrl' | 'barrio' | 'tipoProyecto' | 'destacado' | 'orden'>>): Promise<Portafolio | null> {
        const idx = portafolio.findIndex(p => p.id === id)
        if (idx === -1) return null
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { slug: _slugIgnorado, ...seguro } = partial as typeof partial & { slug?: string }
        portafolio[idx] = { ...portafolio[idx], ...seguro, updatedAt: new Date().toISOString() }
        notify()
        return portafolio[idx]
      },
      async publicar(id: string): Promise<Portafolio | null> {
        const idx = portafolio.findIndex(p => p.id === id)
        if (idx === -1) return null
        portafolio[idx] = { ...portafolio[idx], publicado: true, updatedAt: new Date().toISOString() }
        notify()
        return portafolio[idx]
      },
      async despublicar(id: string): Promise<Portafolio | null> {
        const idx = portafolio.findIndex(p => p.id === id)
        if (idx === -1) return null
        portafolio[idx] = { ...portafolio[idx], publicado: false, updatedAt: new Date().toISOString() }
        notify()
        return portafolio[idx]
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = portafolio.findIndex(p => p.id === id)
        if (idx === -1) return false
        portafolio.splice(idx, 1)
        notify()
        return true
      },
    },

    renderesConceptuales: {
      listar(): RenderConceptual[] {
        return masRecientePrimero(renders)
      },
      porTipoEspacio(tipoEspacio: string): RenderConceptual[] {
        return renders
          .filter(r => r.tipoEspacio === tipoEspacio && r.visible)
          .slice()
          .sort((a, b) => a.orden - b.orden)
      },
      async crear(data: { tipoEspacio: string; imagenUrl: string; titulo?: string | null }): Promise<RenderConceptual> {
        const nuevo: RenderConceptual = {
          id: generateId('render'),
          tipoEspacio: data.tipoEspacio,
          imagenUrl: data.imagenUrl,
          titulo: data.titulo ?? null,
          visible: true,
          orden: renders.length,
          createdAt: new Date().toISOString(),
        }
        renders.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Pick<RenderConceptual, 'tipoEspacio' | 'imagenUrl' | 'titulo' | 'visible' | 'orden'>>): Promise<RenderConceptual | null> {
        const idx = renders.findIndex(r => r.id === id)
        if (idx === -1) return null
        renders[idx] = { ...renders[idx], ...partial }
        notify()
        return renders[idx]
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = renders.findIndex(r => r.id === id)
        if (idx === -1) return false
        renders.splice(idx, 1)
        notify()
        return true
      },
    },

    atributosTecnicos: {
      listar(): AtributoTecnico[] {
        return masRecientePrimero(atributosTecnicos)
      },
      porTipoEspacio(tipoEspacio: string): AtributoTecnico[] {
        return atributosTecnicos
          .filter(a => a.tipoEspacio === tipoEspacio && a.visible)
          .slice()
          .sort((a, b) => a.orden - b.orden)
      },
      async crear(data: { tipoEspacio: string; titulo: string; cuerpo: string; badge?: string | null; imagenUrl?: string | null }): Promise<AtributoTecnico> {
        const nuevo: AtributoTecnico = {
          id: generateId('atrtec'),
          tipoEspacio: data.tipoEspacio,
          titulo: data.titulo,
          cuerpo: data.cuerpo,
          badge: data.badge ?? null,
          imagenUrl: data.imagenUrl ?? null,
          visible: true,
          orden: atributosTecnicos.length,
          createdAt: new Date().toISOString(),
        }
        atributosTecnicos.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Pick<AtributoTecnico, 'tipoEspacio' | 'titulo' | 'cuerpo' | 'badge' | 'imagenUrl' | 'visible' | 'orden'>>): Promise<AtributoTecnico | null> {
        const idx = atributosTecnicos.findIndex(a => a.id === id)
        if (idx === -1) return null
        atributosTecnicos[idx] = { ...atributosTecnicos[idx], ...partial }
        notify()
        return atributosTecnicos[idx]
      },
      async eliminar(id: string): Promise<boolean> {
        const idx = atributosTecnicos.findIndex(a => a.id === id)
        if (idx === -1) return false
        atributosTecnicos.splice(idx, 1)
        notify()
        return true
      },
    },

    testimonios: {
      listar(): Testimonio[] {
        return masRecientePrimero(testimonios)
      },
      porId(id: string): Testimonio | undefined {
        return testimonios.find(t => t.id === id)
      },
      porProyecto(proyectoId: string): Testimonio[] {
        return testimonios.filter(t => t.proyectoId === proyectoId && t.publicado)
      },
      publicados(): Testimonio[] {
        return testimonios.filter(t => t.publicado)
      },
      async crear(data: Partial<Testimonio> & { contenido: string }): Promise<Testimonio> {
        const now = new Date().toISOString()
        const nuevo: Testimonio = {
          id: generateId('test'),
          contenido: data.contenido,
          nombreAutor: data.nombreAutor ?? null,
          rating: data.rating ?? null,
          curado: data.curado ?? false,
          aprobado: data.aprobado ?? false,
          publicado: data.publicado ?? false,
          fuente: data.fuente ?? 'GBP',
          barrio: data.barrio ?? null,
          tipoProyecto: data.tipoProyecto ?? null,
          urlFuente: data.urlFuente ?? null,
          fechaPublicacion: data.fechaPublicacion ?? null,
          clienteId: data.clienteId ?? null,
          proyectoId: data.proyectoId ?? null,
          createdAt: now,
          updatedAt: now,
        }
        testimonios.push(nuevo)
        notify()
        return nuevo
      },
      async actualizar(id: string, partial: Partial<Testimonio>): Promise<Testimonio | null> {
        const idx = testimonios.findIndex(t => t.id === id)
        if (idx === -1) return null
        testimonios[idx] = { ...testimonios[idx], ...partial, updatedAt: new Date().toISOString() }
        notify()
        return testimonios[idx]
      },
      async publicar(id: string): Promise<Testimonio | null> {
        const idx = testimonios.findIndex(t => t.id === id)
        if (idx === -1) return null
        testimonios[idx] = { ...testimonios[idx], publicado: true, aprobado: true, curado: true, updatedAt: new Date().toISOString() }
        notify()
        return testimonios[idx]
      },
      async despublicar(id: string): Promise<Testimonio | null> {
        const idx = testimonios.findIndex(t => t.id === id)
        if (idx === -1) return null
        testimonios[idx] = { ...testimonios[idx], publicado: false, updatedAt: new Date().toISOString() }
        notify()
        return testimonios[idx]
      },
    },

    modulosArtefactos: {
      porModulo(moduloId: string): ModuloArtefacto[] {
        return modulosArtefactos.filter(m => m.moduloId === moduloId)
      },
      async crear(data: { moduloId: string; tipo: TipoModuloArtefacto; fuente: FuenteModuloArtefacto; url: string }): Promise<ModuloArtefacto> {
        const nuevo: ModuloArtefacto = {
          id: generateId('ma'),
          moduloId: data.moduloId,
          tipo: data.tipo,
          fuente: data.fuente,
          url: data.url,
          createdAt: new Date().toISOString(),
        }
        modulosArtefactos.push(nuevo)
        notify()
        return nuevo
      },
    },

    bitacoraArticulos: {
      listar(): BitacoraArticulo[] {
        return masRecientePrimero(bitacoraArticulos)
      },
      publicados(): BitacoraArticulo[] {
        // R1 disenio_F15 §4: solo publicado=true, más reciente primero.
        return bitacoraArticulos
          .filter(a => a.publicado)
          .sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion))
      },
      porSlug(slug: string): BitacoraArticulo | undefined {
        return bitacoraArticulos.find(a => a.slug === slug)
      },
      async crear(data: Partial<BitacoraArticulo> & { slug: string; titulo: string; contenidoLargo: string }): Promise<BitacoraArticulo> {
        const now = new Date().toISOString()
        const nuevo: BitacoraArticulo = {
          id: generateId('ba'),
          slug: data.slug,
          titulo: data.titulo,
          extracto: data.extracto ?? '',
          contenidoLargo: data.contenidoLargo,
          categoria: data.categoria ?? 'casos_estudio',
          imagenPortada: data.imagenPortada ?? null,
          fechaPublicacion: data.fechaPublicacion ?? now,
          autorId: data.autorId ?? null,
          proyectoRelacionadoId: data.proyectoRelacionadoId ?? null,
          publicado: data.publicado ?? false,
          createdAt: now,
          updatedAt: now,
        }
        bitacoraArticulos.push(nuevo)
        notify()
        return nuevo
      },
    },

    // --- F-08-ext: Notas de reunión comercial (ZN-004) ---
    notasReunion: {
      porProyecto(_proyectoId: string): NotaReunion[] {
        return []
      },
      async crear(data): Promise<NotaReunion> {
        return {
          id: `mock-nota-${Date.now()}`,
          proyectoId: data.proyectoId,
          espacioVarianteId: data.espacioVarianteId ?? null,
          categoria: data.categoria,
          contenido: data.contenido,
          creadoPor: data.creadoPor ?? null,
          createdAt: new Date().toISOString(),
        }
      },
    },

    auth: {
      usuarioActual(): UsuarioMock {
        return usuario
      },
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    getVersion(): number {
      return version
    },
  }
}
