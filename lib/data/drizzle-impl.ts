// Store del navegador para DATA_IMPL=drizzle (§3.1d del plan F10). Arquitectura:
// - Lecturas: síncronas contra la caché en memoria (arrays hidratados desde el snapshot inicial
//   servido por el layout raíz, y refrescados por el polling del Provider) — idéntico patrón a
//   mock-store.ts, cero cambios en las 43 pantallas de lectura.
// - Escrituras: llaman al Server Action real (Postgres real, con transacciones donde hace falta),
//   esperan la confirmación, y solo entonces aplican el resultado a la caché local + notify().
//   Sin fire-and-forget: si el Server Action falla o tira excepción, la escritura nunca se refleja.
// - applySnapshot(): usado por el Provider cuando el polling detecta cambios de otro usuario —
//   reemplaza la caché completa y notifica una sola vez.
//
// Nota de alcance: unas pocas escrituras crean un registro secundario en la misma transacción del
// servidor (ej. contratos.crear también inserta hitos; ordenesCompra.crear también crea una
// obligación; espacios.duplicar con vacio=false también clona items/artefactos). Esta caché aplica
// de inmediato el registro PRINCIPAL devuelto por el Action; los registros secundarios llegan con
// el siguiente ciclo de polling (≤4s), no instantáneamente. Es una degradación aceptada explícita,
// no un bug — ver plan_f10_migracion.md §3.1d.
import type { DataStore, Proyecto } from './contracts'
import type { StoreSnapshot } from './snapshot'
import { coincide } from '../search/normalizar'
import { masRecientePrimero } from './orden'
import * as core from './actions/core'
import * as f3 from './actions/f3'
import * as f4 from './actions/f4'
import * as f5 from './actions/f5'
import * as f6 from './actions/f6'
import * as f7 from './actions/f7-tienda'
import * as pf from './actions/portafolio'
import * as renders from './actions/renders'

export interface DrizzleStoreHandle {
  store: DataStore
  applySnapshot: (snapshot: StoreSnapshot) => void
}

export function createDrizzleStore(initial: StoreSnapshot): DrizzleStoreHandle {
  let data = initial

  let version = 0
  const listeners = new Set<() => void>()
  function notify(): void {
    version++
    listeners.forEach((l) => l())
  }

  // Piloto "optimistic create" (2026-08-20, plan proyectos.crear): ids de filas insertadas
  // localmente antes de que el servidor confirme. applySnapshot() reemplaza `data` por completo
  // (no hace merge) -- si un snapshot llega mientras una fila optimista todavía no aterrizó en
  // Postgres, sin este registro la borraría en silencio. Se re-inserta cualquier pendiente que el
  // snapshot fresco todavía no traiga; se limpia del registro cuando el propio crear() resuelve.
  const pendientesOptimistas = {
    proyectos: new Set<string>(),
  }

  function applySnapshot(snap: StoreSnapshot): void {
    let siguiente = snap
    for (const id of pendientesOptimistas.proyectos) {
      if (!siguiente.proyectos.some((p) => p.id === id)) {
        const enCurso = data.proyectos.find((p) => p.id === id)
        if (enCurso) siguiente = { ...siguiente, proyectos: [...siguiente.proyectos, enCurso] }
      }
    }
    data = siguiente
    notify()
  }

  // Espeja los defaults de crearProyectoAction (lib/data/actions/core.ts) para que la fila
  // optimista se vea igual a lo que el servidor va a devolver. Si un default cambia en el
  // server, hay que recordar espejarlo acá -- es el costo conocido de optimistic UI.
  function construirProyectoOptimista(values: Partial<Proyecto> & { nombreProyecto: string }, id: string): Proyecto {
    const ahora = new Date().toISOString()
    return {
      id,
      nombreProyecto: values.nombreProyecto,
      estado: values.estado ?? 'activa',
      tipoProyecto: values.tipoProyecto ?? 'personalizado',
      direccionObra: values.direccionObra ?? null,
      costosOperativos: values.costosOperativos ?? '0',
      imprevistosInstalacion: values.imprevistosInstalacion ?? '0',
      descuentoComercial: values.descuentoComercial ?? '0',
      ajusteArbitrario: values.ajusteArbitrario ?? '0',
      aplicaIva: values.aplicaIva ?? false,
      porcentajeIva: values.porcentajeIva ?? '19',
      garantiaAnios: values.garantiaAnios ?? 2,
      diasEntregaEstimados: values.diasEntregaEstimados ?? null,
      descripcionSemantica: values.descripcionSemantica ?? null,
      clienteId: values.clienteId ?? null,
      comercialId: values.comercialId ?? null,
      verificadorId: values.verificadorId ?? null,
      fechaEntradaDesarrollo: values.fechaEntradaDesarrollo ?? null,
      comercialVendedorId: values.comercialVendedorId ?? null,
      createdAt: ahora,
      updatedAt: ahora,
    }
  }

  function upsert<T extends { id: string }>(arr: T[], row: T): T[] {
    const idx = arr.findIndex((x) => x.id === row.id)
    if (idx === -1) return [...arr, row]
    const copy = arr.slice()
    copy[idx] = row
    return copy
  }

  function removeById<T extends { id: string }>(arr: T[], id: string): T[] {
    return arr.filter((x) => x.id !== id)
  }

  /** Elimina de un arreglo todas las filas cuyo proyectoId === id. */
  function dropByProyecto<T extends { proyectoId: string | null }>(arr: T[], id: string): T[] {
    return arr.filter((x) => x.proyectoId !== id)
  }

  const store: DataStore = {
    proyectos: {
      listar: () => masRecientePrimero(data.proyectos),
      obtenerPorId: (id) => data.proyectos.find((p) => p.id === id),
      actualizarEstado: async (id, estado) => {
        const r = await core.actualizarEstadoProyectoAction(id, estado)
        if (r) { data = { ...data, proyectos: upsert(data.proyectos, r) }; notify() }
        return r
      },
      actualizarParametrosFinancieros: async (id, partial) => {
        const r = await core.actualizarParametrosFinancierosAction(id, partial)
        if (r) { data = { ...data, proyectos: upsert(data.proyectos, r) }; notify() }
        return r
      },
      actualizarVerificador: async (id, verificadorId) => {
        const r = await core.actualizarVerificadorAction(id, verificadorId)
        if (r) { data = { ...data, proyectos: upsert(data.proyectos, r) }; notify() }
        return r
      },
      actualizar: async (id, partial) => {
        const r = await core.actualizarProyectoAction(id, partial)
        if (r) { data = { ...data, proyectos: upsert(data.proyectos, r) }; notify() }
        return r
      },
      crear: async (values) => {
        // Optimistic create (piloto 2026-08-20): el id lo genera el llamador (crypto.randomUUID())
        // o, si no vino, se genera acá mismo -- en ambos casos es el id PERMANENTE, no uno
        // temporal a reconciliar después (mismo patrón que usa Linear en su sync engine). Se
        // inserta en el store local y se notifica ANTES de esperar al servidor, para que la UI
        // (y una navegación inmediata a /erp/cotizador/{id}) no tenga que esperar la red.
        const id = values.id ?? crypto.randomUUID()
        const optimista = construirProyectoOptimista(values, id)
        data = { ...data, proyectos: upsert(data.proyectos, optimista) }
        pendientesOptimistas.proyectos.add(id)
        notify()
        try {
          const r = await core.crearProyectoAction({ ...values, id })
          data = { ...data, proyectos: upsert(data.proyectos, r) }
          return r
        } catch (err) {
          data = { ...data, proyectos: removeById(data.proyectos, id) }
          notify()
          throw err
        } finally {
          pendientesOptimistas.proyectos.delete(id)
          notify()
        }
      },
      eliminar: async (id) => {
        const ok = await core.eliminarProyectoAction(id)
        if (!ok) return false
        // Cascada local: refleja en la caché lo que el server action borró en Postgres.
        const espacioIds = data.espacios.filter((e) => e.proyectoId === id).map((e) => e.id)
        const contratoIds = data.contratos.filter((c) => c.proyectoId === id).map((c) => c.id)
        const cronogramaIds = data.cronogramas.filter((c) => c.proyectoId === id).map((c) => c.id)
        const schemaIds = data.schemas.filter((s) => s.proyectoId === id).map((s) => s.id)
        const moduloIds = data.modulos.filter((m) => m.proyectoId === id).map((m) => m.id)
        const inIds = (arr: string[], value: string) => arr.includes(value)
        data = {
          ...data,
          proyectos: removeById(data.proyectos, id),
          espacios: data.espacios.filter((e) => e.proyectoId !== id),
          items: data.items.filter((i) => !inIds(espacioIds, i.varianteId)),
          artefactos: data.artefactos.filter((a) => !inIds(espacioIds, a.espacioVarianteId)),
          proyectosEstadosHistorial: data.proyectosEstadosHistorial.filter((h) => h.proyectoId !== id),
          contratos: data.contratos.filter((c) => c.proyectoId !== id),
          hitos: data.hitos.filter((h) => !inIds(contratoIds, h.contratoId)),
          cronogramas: data.cronogramas.filter((c) => c.proyectoId !== id),
          cronogramaEtapas: data.cronogramaEtapas.filter((e) => !inIds(cronogramaIds, e.cronogramaId)),
          desfases: dropByProyecto(data.desfases, id),
          checks: dropByProyecto(data.checks, id),
          novedades: dropByProyecto(data.novedades, id),
          comunicaciones: dropByProyecto(data.comunicaciones, id),
          schemas: data.schemas.filter((s) => s.proyectoId !== id),
          bom: data.bom.filter((b) => !inIds(schemaIds, b.schemaId)),
          verificaciones: dropByProyecto(data.verificaciones, id),
          retomas: dropByProyecto(data.retomas, id),
          cambiosContrato: dropByProyecto(data.cambiosContrato, id),
          modulos: data.modulos.filter((m) => m.proyectoId !== id),
          modulosArtefactos: data.modulosArtefactos.filter((a) => !inIds(moduloIds, a.moduloId)),
          estimaciones: dropByProyecto(data.estimaciones, id),
          ordenesTrabajo: data.ordenesTrabajo.filter((o) => o.proyectoId !== id),
          citacionesCalidad: dropByProyecto(data.citacionesCalidad, id),
          reprocesos: dropByProyecto(data.reprocesos, id),
          instalaciones: dropByProyecto(data.instalaciones, id),
          actasEntrega: dropByProyecto(data.actasEntrega, id),
          casosGarantia: dropByProyecto(data.casosGarantia, id),
          citasGarantia: dropByProyecto(data.citasGarantia, id),
          movimientosFinancieros: data.movimientosFinancieros.filter((m) => m.proyectoId !== id),
          obligacionesPendientes: data.obligacionesPendientes.filter((o) => o.proyectoId !== id),
          ordenesCompra: data.ordenesCompra.filter((o) => o.proyectoId !== id),
          recepcionesMaterial: data.recepcionesMaterial.filter((r) => r.proyectoId !== id),
          documentosProyecto: dropByProyecto(data.documentosProyecto, id),
          portafolio: dropByProyecto(data.portafolio, id),
          testimonios: data.testimonios.filter((t) => t.proyectoId !== id),
          pedidosWeb: data.pedidosWeb.map((p) => (p.proyectoId === id ? { ...p, proyectoId: null } : p)),
          catalogo: data.catalogo.map((c) => (c.proyectoOrigenId === id ? { ...c, proyectoOrigenId: null } : c)),
          bitacoraArticulos: data.bitacoraArticulos.map((b) => (b.proyectoRelacionadoId === id ? { ...b, proyectoRelacionadoId: null } : b)),
        }
        notify()
        return true
      },
      historialEstado: (proyectoId) => data.proyectosEstadosHistorial.filter((h) => h.proyectoId === proyectoId),
    },

    clientes: {
      listar: () => masRecientePrimero(data.clientes),
      obtenerPorId: (id) => data.clientes.find((c) => c.id === id),
      crear: async (values) => {
        const r = await core.crearClienteAction(values)
        data = { ...data, clientes: upsert(data.clientes, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await core.actualizarClienteAction(id, partial)
        if (r) { data = { ...data, clientes: upsert(data.clientes, r) }; notify() }
        return r
      },
    },

    espacios: {
      porProyecto: (proyectoId) => data.espacios.filter((e) => e.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await core.crearEspacioAction(values)
        data = { ...data, espacios: upsert(data.espacios, r) }
        notify()
        return r
      },
      actualizarJornadas: async (id, jornadas) => {
        const r = await core.actualizarJornadasAction(id, jornadas)
        if (r) { data = { ...data, espacios: upsert(data.espacios, r) }; notify() }
        return r
      },
      actualizar: async (id, partial) => {
        const r = await core.actualizarEspacioAction(id, partial)
        if (r) { data = { ...data, espacios: upsert(data.espacios, r) }; notify() }
        return r
      },
      duplicar: async (id, opciones) => {
        const r = await core.duplicarEspacioAction(id, opciones)
        if (r) { data = { ...data, espacios: upsert(data.espacios, r) }; notify() }
        return r
      },
      marcarActiva: async (id) => {
        const r = await core.marcarActivaEspacioAction(id)
        if (r) {
          // El servidor puede haber desactivado a los hermanos también; el detalle exacto de
          // esos hermanos llega en el próximo poll — acá aplicamos al menos el objetivo.
          data = { ...data, espacios: upsert(data.espacios, r) }
          notify()
        }
        return r
      },
    },

    items: {
      porVariante: (varianteId) => data.items.filter((i) => i.varianteId === varianteId && !i.anulado),
      crear: async (values) => {
        const r = await core.crearItemAction(values)
        data = { ...data, items: upsert(data.items, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await core.actualizarItemAction(id, partial)
        if (r) { data = { ...data, items: upsert(data.items, r) }; notify() }
        return r
      },
      eliminar: async (id) => {
        const ok = await core.eliminarItemAction(id)
        if (ok) {
          data = { ...data, items: data.items.map((i) => (i.id === id ? { ...i, anulado: true, updatedAt: new Date().toISOString() } : i)) }
          notify()
        }
        return ok
      },
    },

    artefactos: {
      porEspacio: (espacioVarianteId) => data.artefactos.filter((a) => a.espacioVarianteId === espacioVarianteId),
      crear: async (values) => {
        const r = await core.crearArtefactoAction(values)
        data = { ...data, artefactos: upsert(data.artefactos, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await core.actualizarArtefactoAction(id, partial)
        if (r) { data = { ...data, artefactos: upsert(data.artefactos, r) }; notify() }
        return r
      },
    },

    catalogo: {
      listar: () => masRecientePrimero(data.catalogo),
      buscar: (query) => data.catalogo.filter((c) => coincide(query, [c.descripcion, c.sku, c.categoriaComercial ?? ''])),
      obtenerPorId: (id) => data.catalogo.find((c) => c.id === id),
      crear: async (values) => {
        const r = await core.crearProductoCatalogoAction(values)
        if (r) { data = { ...data, catalogo: upsert(data.catalogo, r) }; notify() }
        return r
      },
      actualizar: async (id, partial) => {
        const r = await core.actualizarProductoCatalogoAction(id, partial)
        if (r) { data = { ...data, catalogo: upsert(data.catalogo, r) }; notify() }
        return r
      },
      eliminar: async (id) => {
        const ok = await core.eliminarProductoCatalogoAction(id)
        if (ok) {
          data = { ...data, catalogo: data.catalogo.map((c) => (c.id === id ? { ...c, anulado: true, updatedAt: new Date().toISOString() } : c)) }
          notify()
        }
        return ok
      },
    },

    parametros: {
      listar: () => data.parametros,
      obtenerPorClave: (clave) => data.parametros.find((p) => p.clave === clave),
      transicionesProyecto: () => {
        const param = data.parametros.find((p) => p.clave === 'transiciones_proyecto')
        if (param?.valorTexto) {
          try { return JSON.parse(param.valorTexto) } catch { /* fall through */ }
        }
        return {}
      },
      actualizar: async (clave, datos) => {
        await core.actualizarParametroAction(clave, datos)
        const idx = data.parametros.findIndex((p) => p.clave === clave)
        if (idx === -1) {
          data = { ...data, parametros: [...data.parametros, {
            id: `par-${Date.now()}`, clave, grupo: datos.grupo ?? 'finanzas', tipo: datos.tipo ?? 'texto',
            valorNumeric: datos.valorNumeric ?? null, valorTexto: datos.valorTexto ?? null, valorBooleano: datos.valorBooleano ?? null,
            unidad: datos.unidad ?? null, descripcion: datos.descripcion ?? `Parámetro ${clave} (generado automáticamente)`,
          }] }
        } else {
          const copy = data.parametros.slice()
          copy[idx] = { ...copy[idx], ...datos }
          data = { ...data, parametros: copy }
        }
        notify()
      },
    },

    contratos: {
      porProyecto: (proyectoId) => data.contratos.find((c) => c.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await core.crearContratoAction(values)
        data = { ...data, contratos: upsert(data.contratos, r) }
        notify()
        return r
      },
    },

    hitos: {
      porContrato: (contratoId) => data.hitos.filter((h) => h.contratoId === contratoId),
    },

    // --- F3: Cronograma y control ---
    cronogramas: {
      porProyecto: (proyectoId) => data.cronogramas.find((c) => c.proyectoId === proyectoId),
      obtenerPorId: (id) => data.cronogramas.find((c) => c.id === id),
      crear: async (values) => {
        const r = await f3.crearCronogramaAction(values)
        data = { ...data, cronogramas: upsert(data.cronogramas, r) }
        notify()
        return r
      },
    },
    cronogramaEtapas: {
      porCronograma: (cronogramaId) => data.cronogramaEtapas.filter((e) => e.cronogramaId === cronogramaId),
      crear: async (values) => {
        const r = await f3.crearCronogramaEtapaAction(values)
        data = { ...data, cronogramaEtapas: upsert(data.cronogramaEtapas, r) }
        notify()
        return r
      },
    },
    desfases: {
      porProyecto: (proyectoId) => data.desfases.filter((d) => d.proyectoId === proyectoId),
      aplicar: async (proyectoId, values) => {
        const r = await f3.aplicarDesfaseAction(proyectoId, values)
        if (r) { data = { ...data, desfases: upsert(data.desfases, r) }; notify() }
        return r
      },
      decisionManual: async (desfaseId, values) => {
        const r = await f3.decisionManualDesfaseAction(desfaseId, values)
        if (r) { data = { ...data, desfases: upsert(data.desfases, r) }; notify() }
        return r
      },
    },
    checks: {
      porProyecto: (proyectoId) => data.checks.filter((c) => c.proyectoId === proyectoId),
      crear: async (proyectoId, values) => {
        const r = await f3.crearCheckAction(proyectoId, values)
        data = { ...data, checks: upsert(data.checks, r) }
        notify()
        return r
      },
      confirmar: async (checkId, values) => {
        const r = await f3.confirmarCheckAction(checkId, values)
        if (r) { data = { ...data, checks: upsert(data.checks, r) }; notify() }
        return r
      },
    },
    novedades: {
      porProyecto: (proyectoId) => data.novedades.filter((n) => n.proyectoId === proyectoId),
      crear: async (proyectoId, values) => {
        const r = await f3.crearNovedadAction(proyectoId, values)
        data = { ...data, novedades: upsert(data.novedades, r) }
        notify()
        return r
      },
      actualizarEstado: async (id, estado, escaladoA) => {
        const r = await f3.actualizarEstadoNovedadAction(id, estado, escaladoA)
        if (r) { data = { ...data, novedades: upsert(data.novedades, r) }; notify() }
        return r
      },
    },
    comunicaciones: {
      porProyecto: (proyectoId) => data.comunicaciones.filter((c) => c.proyectoId === proyectoId),
      visiblesAlCliente: (proyectoId) => data.comunicaciones.filter((c) => c.proyectoId === proyectoId && c.visibleAlCliente),
      crear: async (proyectoId, values) => {
        const r = await f3.crearComunicacionAction(proyectoId, values)
        if (r) { data = { ...data, comunicaciones: upsert(data.comunicaciones, r) }; notify() }
        return r
      },
    },

    // --- F3: Desarrollo y schema ---
    schemas: {
      porProyecto: (proyectoId) => data.schemas.filter((s) => s.proyectoId === proyectoId),
      crear: async (proyectoId) => {
        const r = await f3.crearSchemaAction(proyectoId)
        data = { ...data, schemas: upsert(data.schemas, r) }
        notify()
        return r
      },
      actualizarEstado: async (id, estado) => {
        const r = await f3.actualizarEstadoSchemaAction(id, estado)
        if (r) { data = { ...data, schemas: upsert(data.schemas, r) }; notify() }
        return r
      },
    },
    bom: {
      porSchema: (schemaId) => data.bom.filter((b) => b.schemaId === schemaId),
      crear: async (values) => {
        const r = await f3.crearBomAction(values)
        data = { ...data, bom: upsert(data.bom, r) }
        notify()
        return r
      },
    },
    verificaciones: {
      porProyecto: (proyectoId) => data.verificaciones.filter((v) => v.proyectoId === proyectoId),
      emitirVeredicto: async (values) => {
        const r = await f3.emitirVeredictoAction(values)
        if (r) {
          data = { ...data, verificaciones: upsert(data.verificaciones, r) }
          notify()
        }
        return r
      },
    },
    retomas: {
      porProyecto: (proyectoId) => data.retomas.find((r) => r.proyectoId === proyectoId),
      guardar: async (proyectoId, values) => {
        const r = await f3.guardarRetomaAction(proyectoId, values)
        data = { ...data, retomas: upsert(data.retomas, r) }
        notify()
        return r
      },
    },
    cambiosContrato: {
      porProyecto: (proyectoId) => data.cambiosContrato.filter((c) => c.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await f3.crearCambioContratoAction(values)
        data = { ...data, cambiosContrato: upsert(data.cambiosContrato, r) }
        notify()
        return r
      },
    },

    // --- F3: Equipo ---
    personas: {
      listar: () => masRecientePrimero(data.personas),
      obtenerPorId: (id) => data.personas.find((p) => p.id === id),
      crear: async (values) => {
        const r = await f3.crearPersonaAction(values)
        data = { ...data, personas: upsert(data.personas, r) }
        notify()
        return r
      },
      actualizar: async (id, values) => {
        const r = await f3.actualizarPersonaAction(id, values)
        if (r) { data = { ...data, personas: upsert(data.personas, r) }; notify() }
        return r
      },
      desactivar: async (id) => {
        const r = await f3.desactivarPersonaAction(id)
        if (r) {
          data = {
            ...data,
            personas: upsert(data.personas, r),
            personasRoles: data.personasRoles.map((pr) => pr.personaId === id ? { ...pr, activo: false } : pr),
          }
          notify()
        }
        return r
      },
      reactivar: async (id) => {
        const r = await f3.reactivarPersonaAction(id)
        if (r) { data = { ...data, personas: upsert(data.personas, r) }; notify() }
        return r
      },
    },
    personasRoles: {
      activos: () => data.personasRoles.filter((r) => r.activo),
      asignar: async (personaId, rolId) => {
        const r = await f3.asignarRolAction(personaId, rolId)
        data = { ...data, personasRoles: upsert(data.personasRoles, r) }
        notify()
        return r
      },
      desasignar: async (personaId, rolId) => {
        const r = await f3.desasignarRolAction(personaId, rolId)
        if (r) { data = { ...data, personasRoles: upsert(data.personasRoles, r) }; notify() }
        return r
      },
    },

    // --- F3: Producción (mínimo para gates) ---
    modulos: {
      porProyecto: (proyectoId) => data.modulos.filter((m) => m.proyectoId === proyectoId),
      actualizarEstado: async (id, estado) => {
        const r = await f3.actualizarEstadoModuloAction(id, estado)
        if (r) { data = { ...data, modulos: upsert(data.modulos, r) }; notify() }
        return r
      },
    },
    estimaciones: {
      porProyecto: (proyectoId) => data.estimaciones.find((e) => e.proyectoId === proyectoId),
    },

    // --- F5: Taller, calidad, instalación, entrega, garantía ---
    ordenesTrabajo: {
      porProyecto: (proyectoId) => data.ordenesTrabajo.filter((o) => o.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await f5.crearOrdenTrabajoAction(values)
        data = { ...data, ordenesTrabajo: upsert(data.ordenesTrabajo, r) }
        notify()
        return r
      },
    },
    pedidosWeb: {
      listar: () => masRecientePrimero(data.pedidosWeb),
      porCliente: (clienteId) => data.pedidosWeb.filter((p) => p.clienteId === clienteId),
      crear: async (values) => {
        const r = await f5.crearPedidoWebAction(values)
        data = { ...data, pedidosWeb: upsert(data.pedidosWeb, r) }
        notify()
        return r
      },
      actualizarEstado: async (id, estado) => {
        const r = await f5.actualizarEstadoPedidoWebAction(id, estado)
        if (r) { data = { ...data, pedidosWeb: upsert(data.pedidosWeb, r) }; notify() }
        return r
      },
      enganchar: async (id, proyectoId) => {
        const r = await f5.engancharPedidoWebAction(id, proyectoId)
        if (r) { data = { ...data, pedidosWeb: upsert(data.pedidosWeb, r) }; notify() }
        return r
      },
    },
    citacionesCalidad: {
      porProyecto: (proyectoId) => data.citacionesCalidad.filter((c) => c.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await f5.crearCitacionCalidadAction(values)
        data = { ...data, citacionesCalidad: upsert(data.citacionesCalidad, r) }
        notify()
        return r
      },
    },
    reprocesos: {
      porProyecto: (proyectoId) => data.reprocesos.filter((r) => r.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await f5.crearReprocesoAction(values)
        data = { ...data, reprocesos: upsert(data.reprocesos, r) }
        notify()
        return r
      },
    },
    instalaciones: {
      porProyecto: (proyectoId) => data.instalaciones.filter((i) => i.proyectoId === proyectoId),
      programar: async (values) => {
        const r = await f5.programarInstalacionAction(values)
        if (r) { data = { ...data, instalaciones: upsert(data.instalaciones, r) }; notify() }
        return r
      },
      iniciar: async (id) => {
        const r = await f5.iniciarInstalacionAction(id)
        if (r) { data = { ...data, instalaciones: upsert(data.instalaciones, r) }; notify() }
        return r
      },
      marcarInstalada: async (id) => {
        const r = await f5.marcarInstaladaAction(id)
        if (r) { data = { ...data, instalaciones: upsert(data.instalaciones, r) }; notify() }
        return r
      },
      marcarFallida: async (id, motivo) => {
        const r = await f5.marcarFallidaInstalacionAction(id, motivo)
        if (r) { data = { ...data, instalaciones: upsert(data.instalaciones, r) }; notify() }
        return r
      },
    },
    actasEntrega: {
      porProyecto: (proyectoId) => data.actasEntrega.find((a) => a.proyectoId === proyectoId),
      generar: async (proyectoId, values) => {
        const r = await f5.generarActaEntregaAction(proyectoId, values)
        if (r) { data = { ...data, actasEntrega: upsert(data.actasEntrega, r) }; notify() }
        return r
      },
      enviar: async (id) => {
        const r = await f5.enviarActaEntregaAction(id)
        if (r) { data = { ...data, actasEntrega: upsert(data.actasEntrega, r) }; notify() }
        return r
      },
      firmar: async (id) => {
        const r = await f5.firmarActaEntregaAction(id)
        if (r) { data = { ...data, actasEntrega: upsert(data.actasEntrega, r) }; notify() }
        return r
      },
    },
    casosGarantia: {
      porProyecto: (proyectoId) => data.casosGarantia.filter((c) => c.proyectoId === proyectoId),
      porCliente: (clienteId) => data.casosGarantia.filter((c) => c.clienteId === clienteId),
      reportar: async (values) => {
        const r = await f5.reportarCasoGarantiaAction(values)
        if (r) { data = { ...data, casosGarantia: upsert(data.casosGarantia, r) }; notify() }
        return r
      },
      diagnosticar: async (id, diagnostico) => {
        const r = await f5.diagnosticarCasoGarantiaAction(id, diagnostico)
        if (r) { data = { ...data, casosGarantia: upsert(data.casosGarantia, r) }; notify() }
        return r
      },
      crearOrdenReparacion: async (id) => {
        const r = await f5.crearOrdenReparacionAction(id)
        if (r) { data = { ...data, casosGarantia: upsert(data.casosGarantia, r) }; notify() }
        return r
      },
      dispararReproceso: async (id) => {
        const r = await f5.dispararReprocesoGarantiaAction(id)
        if (r) { data = { ...data, casosGarantia: upsert(data.casosGarantia, r) }; notify() }
        return r
      },
      resolver: async (id, solucionAplicada) => {
        const r = await f5.resolverCasoGarantiaAction(id, solucionAplicada)
        if (r) { data = { ...data, casosGarantia: upsert(data.casosGarantia, r) }; notify() }
        return r
      },
      cerrar: async (id) => {
        const r = await f5.cerrarCasoGarantiaAction(id)
        if (r) { data = { ...data, casosGarantia: upsert(data.casosGarantia, r) }; notify() }
        return r
      },
    },
    citasGarantia: {
      porCaso: (casoId) => data.citasGarantia.filter((c) => c.casoId === casoId),
      agendar: async (values) => {
        const r = await f5.agendarCitaGarantiaAction(values)
        data = { ...data, citasGarantia: upsert(data.citasGarantia, r) }
        notify()
        return r
      },
    },

    // --- F6: Finanzas ---
    cuentasFinancieras: {
      listar: () => data.cuentasFinancieras,
      crear: async (values) => {
        const r = await f6.crearCuentaFinancieraAction(values)
        data = { ...data, cuentasFinancieras: upsert(data.cuentasFinancieras, r) }
        notify()
        return r
      },
      disponible: () => {
        const sumaCuentas = data.cuentasFinancieras.reduce((acc, c) => acc + Number(c.saldoActual || 0), 0)
        const sumaPendientes = data.obligacionesPendientes.reduce((acc, o) => acc + Math.max(0, Number(o.montoTotal || 0) - Number(o.montoPagado || 0)), 0)
        return sumaCuentas - sumaPendientes
      },
    },
    movimientosFinancieros: {
      listar: () => masRecientePrimero(data.movimientosFinancieros),
      porCuenta: (cuentaId) => data.movimientosFinancieros.filter((m) => m.cuentaOrigenId === cuentaId || m.cuentaDestinoId === cuentaId),
      porProyecto: (proyectoId) => data.movimientosFinancieros.filter((m) => m.proyectoId === proyectoId),
    },
    obligacionesPendientes: {
      listar: () => data.obligacionesPendientes,
      porProyecto: (proyectoId) => data.obligacionesPendientes.filter((o) => o.proyectoId === proyectoId),
      porPersona: (personaId) => data.obligacionesPendientes.filter((o) => o.personaId === personaId),
      porProveedor: (proveedorId) => data.obligacionesPendientes.filter((o) => o.proveedorId === proveedorId),
      crear: async (values) => {
        const r = await f6.crearObligacionAction(values)
        data = { ...data, obligacionesPendientes: upsert(data.obligacionesPendientes, r) }
        notify()
        return r
      },
      registrarPago: async (id, values) => {
        const r = await f6.registrarPagoObligacionAction(id, values)
        if (r) { data = { ...data, obligacionesPendientes: upsert(data.obligacionesPendientes, r) }; notify() }
        return r
      },
    },
    ordenesCompra: {
      listar: () => masRecientePrimero(data.ordenesCompra),
      porProveedor: (proveedorId) => data.ordenesCompra.filter((o) => o.proveedorId === proveedorId),
      crear: async (values) => {
        const r = await f6.crearOrdenCompraAction(values)
        data = { ...data, ordenesCompra: upsert(data.ordenesCompra, r) }
        notify()
        return r
      },
      actualizarEstado: async (id, estado) => {
        const r = await f6.actualizarEstadoOrdenCompraAction(id, estado)
        if (r) { data = { ...data, ordenesCompra: upsert(data.ordenesCompra, r) }; notify() }
        return r
      },
    },
    registrosGateCaja: {
      listar: () => data.registrosGateCaja,
      porOrdenCompra: (ordenCompraId) => data.registrosGateCaja.filter((r) => r.ordenCompraId === ordenCompraId),
    },
    caja: {
      autorizarPago: async (values) => {
        const r = await f6.autorizarPagoCajaAction(values)
        if (r) {
          data = { ...data, movimientosFinancieros: upsert(data.movimientosFinancieros, r) }
          notify()
        }
        return r
      },
    },
    proveedores: {
      listar: () => masRecientePrimero(data.proveedores),
      obtenerPorId: (id) => data.proveedores.find((p) => p.id === id),
      crear: async (values) => {
        const r = await f6.crearProveedorAction(values)
        data = { ...data, proveedores: upsert(data.proveedores, r) }
        notify()
        return r
      },
    },

    // --- F4: Compras ---
    itemsOrdenCompra: {
      porOrdenCompra: (ordenCompraId) => data.itemsOrdenCompra.filter((i) => i.ordenCompraId === ordenCompraId),
      crear: async (values) => {
        const r = await f4.crearItemOrdenCompraAction(values)
        if (r) { data = { ...data, itemsOrdenCompra: upsert(data.itemsOrdenCompra, r) }; notify() }
        return r
      },
      crearDesdeSugeridos: async (ordenCompraId, sugeridos) => {
        const rows = await f4.crearItemsOrdenCompraDesdeSugeridosAction(ordenCompraId, sugeridos)
        if (rows.length > 0) {
          let items = data.itemsOrdenCompra
          for (const r of rows) items = upsert(items, r)
          data = { ...data, itemsOrdenCompra: items }
          notify()
        }
        return rows
      },
    },
    recepcionesMaterial: {
      porOrdenCompra: (ordenCompraId) => data.recepcionesMaterial.filter((r) => r.ordenCompraId === ordenCompraId),
      porProyecto: (proyectoId) => data.recepcionesMaterial.filter((r) => r.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await f4.crearRecepcionMaterialAction(values)
        data = { ...data, recepcionesMaterial: upsert(data.recepcionesMaterial, r) }
        notify()
        return r
      },
      actualizarChecks: async (id, values) => {
        const r = await f4.actualizarChecksRecepcionAction(id, values)
        if (r) { data = { ...data, recepcionesMaterial: upsert(data.recepcionesMaterial, r) }; notify() }
        return r
      },
    },
    herramientas: {
      listar: () => masRecientePrimero(data.herramientas),
      crear: async (values) => {
        const r = await f4.crearHerramientaAction(values)
        data = { ...data, herramientas: upsert(data.herramientas, r) }
        notify()
        return r
      },
      actualizarEstado: async (id, estado) => {
        const r = await f4.actualizarEstadoHerramientaAction(id, estado)
        if (r) { data = { ...data, herramientas: upsert(data.herramientas, r) }; notify() }
        return r
      },
      reponer: async (id) => {
        const r = await f4.reponerHerramientaAction(id)
        if (r) {
          data = { ...data, herramientas: upsert(data.herramientas, r.herramienta), ordenesCompra: upsert(data.ordenesCompra, r.ordenCompra) }
          notify()
        }
        return r
      },
    },

    // --- F7: Documentación del proyecto ---
    documentosProyecto: {
      porProyecto: (proyectoId) => data.documentosProyecto.filter((d) => d.proyectoId === proyectoId),
      crear: async (values) => {
        const r = await f7.crearDocumentoProyectoAction(values)
        if (r) { data = { ...data, documentosProyecto: upsert(data.documentosProyecto, r) }; notify() }
        return r
      },
      eliminar: async (id) => {
        const ok = await f7.eliminarDocumentoProyectoAction(id)
        if (ok) { data = { ...data, documentosProyecto: removeById(data.documentosProyecto, id) }; notify() }
        return ok
      },
    },

    cuentasCobroProveedor: {
      listar: () => masRecientePrimero(data.cuentasCobroProveedor),
      porProveedor: (proveedorId) => data.cuentasCobroProveedor.filter((c) => c.proveedorId === proveedorId),
      crear: async (values) => {
        const r = await f7.crearCuentaCobroProveedorAction(values)
        if (r) { data = { ...data, cuentasCobroProveedor: upsert(data.cuentasCobroProveedor, r) }; notify() }
        return r
      },
      vincularOC: async (id, ordenCompraId) => {
        const r = await f7.vincularOcCuentaCobroAction(id, ordenCompraId)
        if (r) { data = { ...data, cuentasCobroProveedor: upsert(data.cuentasCobroProveedor, r) }; notify() }
        return r
      },
      adjuntarFactura: async (id, urlDocumento) => {
        const r = await f7.adjuntarFacturaCuentaCobroAction(id, urlDocumento)
        if (r) { data = { ...data, cuentasCobroProveedor: upsert(data.cuentasCobroProveedor, r) }; notify() }
        return r
      },
      marcarPagada: async (id) => {
        const r = await f7.marcarPagadaCuentaCobroAction(id)
        if (r) { data = { ...data, cuentasCobroProveedor: upsert(data.cuentasCobroProveedor, r) }; notify() }
        return r
      },
      anular: async (id) => {
        const r = await f7.anularCuentaCobroAction(id)
        if (r) { data = { ...data, cuentasCobroProveedor: upsert(data.cuentasCobroProveedor, r) }; notify() }
        return r
      },
    },

    // --- F-02: Tienda web ---
    categorias: {
      listar: () => data.categorias,
      porTipo: (tipo) => data.categorias.filter((c) => c.tipo === tipo),
      crear: async (values) => {
        const r = await f7.crearCategoriaAction(values)
        data = { ...data, categorias: upsert(data.categorias, r) }
        notify()
        return r
      },
    },
    productosTienda: {
      listar: () => data.productosTienda,
      visibles: () => data.productosTienda.filter((p) => p.visibleEnTienda),
      obtenerPorId: (id) => data.productosTienda.find((p) => p.id === id),
      crear: async (values) => {
        const r = await f7.crearProductoTiendaAction(values)
        data = { ...data, productosTienda: upsert(data.productosTienda, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await f7.actualizarProductoTiendaAction(id, partial)
        if (r) { data = { ...data, productosTienda: upsert(data.productosTienda, r) }; notify() }
        return r
      },
    },
    productosTiendaComponentes: {
      porProductoTienda: (productoTiendaId) => data.productosTiendaComponentes.filter((c) => c.productoTiendaId === productoTiendaId),
      crear: async (values) => {
        const r = await f7.crearProductoTiendaComponenteAction(values)
        data = { ...data, productosTiendaComponentes: upsert(data.productosTiendaComponentes, r) }
        notify()
        return r
      },
      eliminar: async (id) => {
        await f7.eliminarProductoTiendaComponenteAction(id)
        data = { ...data, productosTiendaComponentes: removeById(data.productosTiendaComponentes, id) }
        notify()
      },
    },
    catalogoAcabados: {
      listar: () => data.catalogoAcabados,
      crear: async (values) => {
        const r = await f7.crearCatalogoAcabadoAction(values)
        data = { ...data, catalogoAcabados: upsert(data.catalogoAcabados, r) }
        notify()
        return r
      },
    },
    catalogoProductoAcabados: {
      porProducto: (productoCatalogoId) => data.catalogoProductoAcabados.filter((c) => c.productoCatalogoId === productoCatalogoId),
      crear: async (values) => {
        const r = await f7.crearCatalogoProductoAcabadoAction(values)
        data = { ...data, catalogoProductoAcabados: upsert(data.catalogoProductoAcabados, r) }
        notify()
        return r
      },
    },
    acabadosMuestras: {
      porAcabado: (acabadoId) => data.acabadosMuestras.filter((a) => a.acabadoId === acabadoId),
      crear: async (values) => {
        const r = await f7.crearAcabadoMuestraAction(values)
        data = { ...data, acabadosMuestras: upsert(data.acabadosMuestras, r) }
        notify()
        return r
      },
    },

    // --- F-03: Portafolio de proyectos ---
    portafolio: {
      listar: () => masRecientePrimero(data.portafolio),
      publicados: () => data.portafolio.filter((p) => p.publicado).slice().sort((a, b) => (a.destacado === b.destacado ? a.orden - b.orden : (a.destacado ? -1 : 1))),
      porSlug: (slug) => data.portafolio.find((p) => p.slug === slug),
      crear: async (values) => {
        const r = await pf.crearPortafolioAction(values)
        data = { ...data, portafolio: upsert(data.portafolio, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await pf.actualizarPortafolioAction(id, partial)
        if (r) { data = { ...data, portafolio: upsert(data.portafolio, r) }; notify() }
        return r
      },
      publicar: async (id) => {
        const r = await pf.publicarPortafolioAction(id)
        if (r) { data = { ...data, portafolio: upsert(data.portafolio, r) }; notify() }
        return r
      },
      despublicar: async (id) => {
        const r = await pf.despublicarPortafolioAction(id)
        if (r) { data = { ...data, portafolio: upsert(data.portafolio, r) }; notify() }
        return r
      },
    },
    renderesConceptuales: {
      listar: () => masRecientePrimero(data.rendersConceptuales),
      porTipoEspacio: (tipoEspacio) => data.rendersConceptuales
        .filter((r) => r.tipoEspacio === tipoEspacio && r.visible)
        .slice()
        .sort((a, b) => a.orden - b.orden),
      crear: async (values) => {
        const r = await renders.crearRenderConceptualAction(values)
        data = { ...data, rendersConceptuales: upsert(data.rendersConceptuales, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await renders.actualizarRenderConceptualAction(id, partial)
        if (r) { data = { ...data, rendersConceptuales: upsert(data.rendersConceptuales, r) }; notify() }
        return r
      },
      eliminar: async (id) => {
        const ok = await renders.eliminarRenderConceptualAction(id)
        if (ok) { data = { ...data, rendersConceptuales: data.rendersConceptuales.filter((r) => r.id !== id) }; notify() }
        return ok
      },
    },
    testimonios: {
      listar: () => masRecientePrimero(data.testimonios),
      porId: (id) => data.testimonios.find((t) => t.id === id),
      porProyecto: (proyectoId) => data.testimonios.filter((t) => t.proyectoId === proyectoId && t.publicado),
      publicados: () => data.testimonios.filter((t) => t.publicado),
      crear: async (values) => {
        const r = await pf.crearTestimonioAction(values)
        data = { ...data, testimonios: upsert(data.testimonios, r) }
        notify()
        return r
      },
      actualizar: async (id, partial) => {
        const r = await pf.actualizarTestimonioAction(id, partial)
        if (r) { data = { ...data, testimonios: upsert(data.testimonios, r) }; notify() }
        return r
      },
      publicar: async (id) => {
        const r = await pf.publicarTestimonioAction(id)
        if (r) { data = { ...data, testimonios: upsert(data.testimonios, r) }; notify() }
        return r
      },
      despublicar: async (id) => {
        const r = await pf.despublicarTestimonioAction(id)
        if (r) { data = { ...data, testimonios: upsert(data.testimonios, r) }; notify() }
        return r
      },
    },
    modulosArtefactos: {
      porModulo: (moduloId) => data.modulosArtefactos.filter((m) => m.moduloId === moduloId),
      crear: async (values) => {
        const r = await pf.crearModuloArtefactoAction(values)
        data = { ...data, modulosArtefactos: upsert(data.modulosArtefactos, r) }
        notify()
        return r
      },
    },

    // --- F-15: Bitácora de Diseño ---
    bitacoraArticulos: {
      listar: () => masRecientePrimero(data.bitacoraArticulos),
      publicados: () => data.bitacoraArticulos.filter((a) => a.publicado).slice().sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion)),
      porSlug: (slug) => data.bitacoraArticulos.find((a) => a.slug === slug),
      crear: async (values) => {
        const r = await pf.crearBitacoraArticuloAction(values)
        data = { ...data, bitacoraArticulos: upsert(data.bitacoraArticulos, r) }
        notify()
        return r
      },
    },

    auth: {
      usuarioActual: () => data.usuario,
    },

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getVersion: () => version,
  }

  return { store, applySnapshot }
}
