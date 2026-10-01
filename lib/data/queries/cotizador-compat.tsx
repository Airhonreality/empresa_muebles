// cotizador-compat.tsx (B1, plan_cotizador_tanstack_query.md): proveedor de contexto que
// expone a la pantalla [proyectoId] un objeto "tipo-DataStore" (la API que ya consume el
// page) respaldado EXCLUSIVAMENTE por el server-state TanStack query:
//   - Lecturas → useCotizadorSnapshot(proyectoId) (una sola action escopada de ~10 SELECTs).
//   - Escrituras → mutations optimistas (client uuid + idempotencia DEC-1/DEC-7/DEC-8).
// CERO useDataStore, CERO getVersion(), CERO `fetchSnapshotAction()` en esta pantalla.
// Las únicas escrituras fuera del snapshot que quedan en el page (eliminarProyectoAction,
// crearNotaReunionAction) van directo a su Server Action, sin pasar por aquí.
'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  useActualizarArtefactoMutation,
  useActualizarEspacioMutation,
  useActualizarItemMutation,
  useActualizarJornadasMutation,
  useActualizarParametrosFinancierosMutation,
  useActualizarEstadoProyectoMutation,
  useCotizadorSnapshot,
  useCrearArtefactoMutation,
  useCrearEspacioMutation,
  useCrearItemMutation,
  useDuplicarEspacioMutation,
  useEliminarEspacioMutation,
  useEliminarItemMutation,
  useMarcarEspacioActivaMutation,
  useCrearGrupoItemMutation,
  useActualizarGrupoItemMutation,
  useEliminarGrupoItemMutation,
  useReemplazarAcabadosEspacioMutation,
  useCrearAcabadoCatalogoMutation,
  useActualizarClienteMutation,
  useCrearClienteMutation,
  useVincularClienteProyectoMutation,
  useCrearContratoMutation,
  useActualizarContratoMutation,
} from './useCotizadorQueries'
import type { InputArtefactoOptimista, InputEspacioOptimista, InputItemOptimista } from './optimistic'
import { registrarAccionDeshacer, patchInverso } from './historial-deshacer'
import type {
  CatalogoAcabado, Cliente, Contrato, EspacioArtefacto, EspacioVariante,
  GrupoItem, HitoPago, ItemVariante, Parametro, ProductoCatalogo, Proyecto,
  DatosContratoNuevo, DatosContratoEdicion, EspacioVarianteAcabado,
} from '../contracts'

/** API consumible por la pantalla (cliente de `useDataStore()` devenido en TanStack Query).
 *  Solo expone los cortes que la pantalla usa; las escrituras son mutations optimistas. */
export interface CotizadorCompatStore {
  proyectos: {
    obtenerPorId(id: string): Proyecto | undefined
    actualizarParametrosFinancieros(
      id: string,
      partial: Partial<Pick<Proyecto, 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios' | 'costosOperativos' | 'imprevistosInstalacion' | 'descuentoComercial' | 'ajusteArbitrario'>>,
    ): Promise<Proyecto | null>
    /** t-169: vincula un cliente al proyecto. Sin esto el modal de contrato no podía resolver
     *  un proyecto que llegaba sin `clienteId`. */
    vincularCliente(id: string, clienteId: string): Promise<Proyecto | null>
    /** Selector de estado del header (2026-10-01): valida transiciones server-side contra
     *  el parámetro `transiciones_proyecto` (mismo criterio que el Kanban comercial). */
    actualizarEstado(id: string, estado: string): Promise<Proyecto | null>
  }
  clientes: {
    obtenerPorId(id: string): Cliente | undefined
    listar(): Cliente[]
    /** t-166: el modal de contrato editaba el cliente por el DataStore global mientras esta
     *  pantalla lee por el snapshot — el cambio tardaba hasta ≤4s en verse. Ahora escribe por
     *  el mismo layer que lee. */
    actualizar(id: string, partial: Partial<Pick<Cliente, 'nombre' | 'documento' | 'telefono' | 'email' | 'domicilio'>>): Promise<Cliente | null>
    /** t-169: alta de cliente. Antes el modal solo sabía editar uno que ya venía vinculado, así
     *  que un proyecto sin cliente no tenía salida desde el cotizador. */
    crear(values: { nombre: string; documento: string | null; telefono: string | null; email: string | null; domicilio: string | null }): Promise<Cliente>
  }
  espacios: {
    porProyecto(proyectoId: string): EspacioVariante[]
    crear(input: Omit<InputEspacioOptimista, 'id'>): Promise<EspacioVariante>
    actualizar(id: string, patch: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'tipoEspacio' | 'descripcion' | 'activa' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>>): Promise<EspacioVariante | null>
    eliminar(id: string): Promise<boolean>
    duplicar(id: string, opciones: { vacio: boolean; nuevoNombreEspacio?: string }): Promise<EspacioVariante | null>
    marcarActiva(id: string): Promise<EspacioVariante | null>
    actualizarJornadas(id: string, jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string }): Promise<EspacioVariante | null>
  }
  items: {
    porVariante(varianteId: string): ItemVariante[]
    // 2026-10-01 (diagnóstico UX): `id` opcional -- el caller puede generarlo ANTES de disparar
    // la creación para engancharse al mismo id que usará la actualización optimista de caché
    // (onMutate corre síncrono, antes de cualquier round-trip de red). Sin esto, cualquier
    // feedback visual atado al id resuelto de la promesa (ej. resaltar la fila nueva) queda
    // esperando al servidor aunque la fila ya esté en pantalla -- el bug real reportado por
    // Javier ("el feedback de agregación tarda mucho en salir").
    crear(input: Omit<InputItemOptimista, 'id'> & { id?: string }): Promise<ItemVariante>
    actualizar(id: string, patch: Partial<Pick<ItemVariante, 'catalogoId' | 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial' | 'comentario' | 'grupoItemId' | 'fotoUrl' | 'marca' | 'referencia' | 'color' | 'dimensiones' | 'acabado' | 'espesor' | 'camposPersonalizados'>>): Promise<ItemVariante | null>
    eliminar(id: string): Promise<boolean>
  }
  // --- Grupos de ítems de cotización (t-157, 2026-09-10) — árbol Espacio → Grupo → Subgrupo → Ítems ---
  gruposItem: {
    porEspacio(espacioVarianteId: string): GrupoItem[]
    crear(espacioVarianteId: string, nombre: string, padreId?: string | null): Promise<GrupoItem>
    actualizar(id: string, cambios: Partial<Pick<GrupoItem, 'nombre' | 'padreId' | 'orden'>>): Promise<GrupoItem | null>
    eliminar(id: string): Promise<boolean>
  }
  // --- Acabados asociados a un espacio de cotización (t-172, 2026-09-30) ---
  espacioVarianteAcabados: {
    porEspacio(espacioVarianteId: string): EspacioVarianteAcabado[]
    reemplazarTodos(espacioVarianteId: string, items: { acabadoId: string; descripcionUso: string }[]): Promise<EspacioVarianteAcabado[]>
  }
  artefactos: {
    porEspacio(espacioId: string): EspacioArtefacto[]
    crear(input: Omit<InputArtefactoOptimista, 'id'>): Promise<EspacioArtefacto>
    actualizar(id: string, patch: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'descripcion' | 'fotoUrls' | 'archivosUrls'>>): Promise<EspacioArtefacto | null>
  }
  catalogo: { listar(): ProductoCatalogo[] }
  catalogoAcabados: {
    listar(): CatalogoAcabado[]
    /** Alta rápida sin salir del cotizador ("+ Nuevo acabado", t-172/t-174). */
    crear(values: Partial<CatalogoAcabado> & { nombre: string }): Promise<CatalogoAcabado>
  }
  parametros: { obtenerPorClave(clave: string): Parametro | undefined }
  contratos: {
    porProyecto(proyectoId: string): Contrato | undefined
    /** t-166: alta y edición. Antes solo existía `crear`, con lo que una segunda emisión
     *  chocaba contra el UNIQUE de `codigo_contrato` sin forma de corregir el contrato. */
    crear(data: DatosContratoNuevo): Promise<Contrato>
    actualizar(id: string, data: DatosContratoEdicion): Promise<Contrato | null>
  }
  hitos: { porContrato(contratoId: string): HitoPago[] }
}

interface CotizadorCompatContexto {
  store: CotizadorCompatStore
  cargando: boolean
  proyectoId: string
}

const CotizadorCompatContext = createContext<CotizadorCompatContexto | null>(null)

export function CotizadorCompatProvider({ proyectoId, children }: { proyectoId: string; children: ReactNode }) {
  const snapshot = useCotizadorSnapshot(proyectoId)
  const data = snapshot.data

  const crearItem = useCrearItemMutation(proyectoId)
  const actualizarItem = useActualizarItemMutation(proyectoId)
  const eliminarItem = useEliminarItemMutation(proyectoId)
  const crearEspacio = useCrearEspacioMutation(proyectoId)
  const actualizarEspacio = useActualizarEspacioMutation(proyectoId)
  const eliminarEspacio = useEliminarEspacioMutation(proyectoId)
  const marcarEspacioActiva = useMarcarEspacioActivaMutation(proyectoId)
  const actualizarJornadas = useActualizarJornadasMutation(proyectoId)
  const duplicarEspacio = useDuplicarEspacioMutation(proyectoId)
  const actualizarParametrosFinancieros = useActualizarParametrosFinancierosMutation(proyectoId)
  const actualizarEstadoProyecto = useActualizarEstadoProyectoMutation(proyectoId)
  const crearArtefacto = useCrearArtefactoMutation(proyectoId)
  const actualizarArtefacto = useActualizarArtefactoMutation(proyectoId)
  const crearGrupoItem = useCrearGrupoItemMutation(proyectoId)
  const actualizarGrupoItem = useActualizarGrupoItemMutation(proyectoId)
  const eliminarGrupoItem = useEliminarGrupoItemMutation(proyectoId)
  const reemplazarAcabadosEspacio = useReemplazarAcabadosEspacioMutation(proyectoId)
  const crearAcabadoCatalogo = useCrearAcabadoCatalogoMutation(proyectoId)
  const actualizarCliente = useActualizarClienteMutation(proyectoId)
  const crearCliente = useCrearClienteMutation(proyectoId)
  const vincularClienteProyecto = useVincularClienteProyectoMutation(proyectoId)
  const crearContrato = useCrearContratoMutation(proyectoId)
  const actualizarContrato = useActualizarContratoMutation(proyectoId)

  const value = useMemo<CotizadorCompatContexto>(() => {
    const d = data ?? {
      proyecto: null, clientes: [] as Cliente[], parametros: [] as Parametro[],
      espacios: [] as EspacioVariante[], items: [] as ItemVariante[],
      artefactos: [] as EspacioArtefacto[], catalogo: [] as ProductoCatalogo[],
      catalogoAcabados: [] as CatalogoAcabado[], contrato: null, hitos: [] as HitoPago[],
      gruposItem: [] as GrupoItem[], espacioVarianteAcabados: [] as EspacioVarianteAcabado[],
    }
    return {
      proyectoId,
      cargando: snapshot.isLoading,
      store: {
        proyectos: {
          obtenerPorId: (id) => (d.proyecto && d.proyecto.id === id ? d.proyecto : undefined),
          actualizarParametrosFinancieros: (id, partial) =>
            actualizarParametrosFinancieros.mutateAsync({ id, partial }),
          vincularCliente: (id, clienteId) => vincularClienteProyecto.mutateAsync({ id, clienteId }),
          actualizarEstado: (id, estado) => actualizarEstadoProyecto.mutateAsync({ id, estado }),
        },
        clientes: {
          obtenerPorId: (id) => d.clientes.find((c) => c.id === id),
          listar: () => d.clientes,
          actualizar: (id, partial) => actualizarCliente.mutateAsync({ id, partial }),
          crear: (values) => crearCliente.mutateAsync(values),
        },
        espacios: {
          porProyecto: (pid) => d.espacios.filter((e) => e.proyectoId === pid),
          crear: (input) => crearEspacio.mutateAsync({ ...input, id: crypto.randomUUID() }),
          actualizar: (id, patch) => actualizarEspacio.mutateAsync({ id, patch }),
          eliminar: (id) => eliminarEspacio.mutateAsync({ id }),
          duplicar: (id, opciones) => duplicarEspacio.mutateAsync({ id, opciones }),
          marcarActiva: (id) => marcarEspacioActiva.mutateAsync({ id }),
          actualizarJornadas: (id, jornadas) => actualizarJornadas.mutateAsync({ id, jornadas }),
        },
        items: {
          porVariante: (varianteId) => d.items.filter((i) => i.varianteId === varianteId && !i.anulado),
          // t-179: cada escritura de ítem que llega a confirmarse en la DB queda registrada en el
          // historial de deshacer (Ctrl+Z global, components/veta/historial-deshacer-listener.tsx).
          // Deshacer una acción ya guardada vuelve a llamar al servidor con los valores
          // anteriores -- no alcanza con tocar el caché local, porque lo que se revierte ya quedó
          // escrito en Neon.
          crear: async (input) => {
            const id = input.id ?? crypto.randomUUID()
            const nuevo = await crearItem.mutateAsync({ ...input, id })
            registrarAccionDeshacer(proyectoId, {
              descripcion: 'Crear ítem',
              deshacer: async () => { await eliminarItem.mutateAsync({ id }) },
            })
            return nuevo
          },
          actualizar: async (id, patch) => {
            const anterior = d.items.find((i) => i.id === id)
            const actualizado = await actualizarItem.mutateAsync({ id, patch })
            if (anterior) {
              const inverso = patchInverso(anterior, patch)
              registrarAccionDeshacer(proyectoId, {
                descripcion: 'Editar ítem',
                deshacer: async () => { await actualizarItem.mutateAsync({ id, patch: inverso }) },
              })
            }
            return actualizado
          },
          eliminar: async (id) => {
            const anterior = d.items.find((i) => i.id === id)
            const exito = await eliminarItem.mutateAsync({ id })
            if (exito && anterior) {
              registrarAccionDeshacer(proyectoId, {
                descripcion: 'Eliminar ítem',
                deshacer: async () => {
                  // Si el servidor hizo soft-delete (fila sigue existiendo con anulado=true),
                  // crearItemAction detecta el conflicto de id y no hace nada -- el update de
                  // abajo es el que de verdad restaura el ítem en ese caso. Si fue hard-delete
                  // (fila ya no existe), el create la recrea y el update queda de más pero no
                  // hace daño: mismos valores.
                  await crearItem.mutateAsync({ ...anterior, id: anterior.id })
                  await actualizarItem.mutateAsync({ id: anterior.id, patch: { anulado: false } })
                },
              })
            }
            return exito
          },
        },
        artefactos: {
          porEspacio: (espacioId) => d.artefactos.filter((a) => a.espacioVarianteId === espacioId),
          crear: (input) => crearArtefacto.mutateAsync({ ...input, id: crypto.randomUUID() }),
          actualizar: (id, patch) => actualizarArtefacto.mutateAsync({ id, patch }),
        },
        gruposItem: {
          porEspacio: (espacioVarianteId) => d.gruposItem.filter((g) => g.espacioVarianteId === espacioVarianteId),
          crear: (espacioVarianteId, nombre, padreId) => crearGrupoItem.mutateAsync({ espacioVarianteId, nombre, padreId: padreId ?? null }),
          actualizar: (id, cambios) => actualizarGrupoItem.mutateAsync({ id, cambios }),
          eliminar: (id) => eliminarGrupoItem.mutateAsync({ id }),
        },
        espacioVarianteAcabados: {
          porEspacio: (espacioVarianteId) => d.espacioVarianteAcabados.filter((a) => a.espacioVarianteId === espacioVarianteId),
          reemplazarTodos: (espacioVarianteId, items) => reemplazarAcabadosEspacio.mutateAsync({ espacioVarianteId, items }),
        },
        catalogo: { listar: () => d.catalogo },
        catalogoAcabados: {
          listar: () => d.catalogoAcabados,
          crear: (values) => crearAcabadoCatalogo.mutateAsync(values),
        },
        parametros: { obtenerPorClave: (clave) => d.parametros.find((p) => p.clave === clave) },
        contratos: {
          porProyecto: (pid) => (d.contrato && d.contrato.proyectoId === pid ? d.contrato : undefined),
          crear: (data) => crearContrato.mutateAsync(data),
          actualizar: (id, data) => actualizarContrato.mutateAsync({ id, data }),
        },
        hitos: { porContrato: (contratoId) => d.hitos.filter((h) => h.contratoId === contratoId) },
      },
    }
  }, [
    data, snapshot.isLoading, proyectoId,
    crearItem, actualizarItem, eliminarItem,
    crearEspacio, actualizarEspacio, eliminarEspacio, marcarEspacioActiva,
    actualizarJornadas, duplicarEspacio, actualizarParametrosFinancieros, actualizarEstadoProyecto,
    crearArtefacto, actualizarArtefacto,
    crearGrupoItem, actualizarGrupoItem, eliminarGrupoItem,
    reemplazarAcabadosEspacio, crearAcabadoCatalogo,
    actualizarCliente, crearCliente, vincularClienteProyecto, crearContrato, actualizarContrato,
  ])

  return <CotizadorCompatContext.Provider value={value}>{children}</CotizadorCompatContext.Provider>
}

export function useCotizadorCompat(): CotizadorCompatContexto {
  const ctx = useContext(CotizadorCompatContext)
  if (!ctx) throw new Error('useCotizadorCompat debe usarse dentro de <CotizadorCompatProvider>')
  return ctx
}