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
} from './useCotizadorQueries'
import type { InputArtefactoOptimista, InputEspacioOptimista, InputItemOptimista } from './optimistic'
import type {
  CatalogoAcabado, Cliente, Contrato, EspacioArtefacto, EspacioVariante,
  GrupoItem, HitoPago, ItemVariante, Parametro, ProductoCatalogo, Proyecto,
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
  }
  clientes: {
    obtenerPorId(id: string): Cliente | undefined
    listar(): Cliente[]
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
    crear(input: Omit<InputItemOptimista, 'id'>): Promise<ItemVariante>
    actualizar(id: string, patch: Partial<Pick<ItemVariante, 'catalogoId' | 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial' | 'comentario' | 'grupoItemId'>>): Promise<ItemVariante | null>
    eliminar(id: string): Promise<boolean>
  }
  // --- Grupos de ítems de cotización (t-157, 2026-09-10) — árbol Espacio → Grupo → Subgrupo → Ítems ---
  gruposItem: {
    porEspacio(espacioVarianteId: string): GrupoItem[]
    crear(espacioVarianteId: string, nombre: string, padreId?: string | null): Promise<GrupoItem>
    actualizar(id: string, cambios: Partial<Pick<GrupoItem, 'nombre' | 'padreId' | 'orden'>>): Promise<GrupoItem | null>
    eliminar(id: string): Promise<boolean>
  }
  artefactos: {
    porEspacio(espacioId: string): EspacioArtefacto[]
    crear(input: Omit<InputArtefactoOptimista, 'id'>): Promise<EspacioArtefacto>
    actualizar(id: string, patch: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>>): Promise<EspacioArtefacto | null>
  }
  catalogo: { listar(): ProductoCatalogo[] }
  catalogoAcabados: { listar(): CatalogoAcabado[] }
  parametros: { obtenerPorClave(clave: string): Parametro | undefined }
  contratos: { porProyecto(proyectoId: string): Contrato | undefined }
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
  const crearArtefacto = useCrearArtefactoMutation(proyectoId)
  const actualizarArtefacto = useActualizarArtefactoMutation(proyectoId)
  const crearGrupoItem = useCrearGrupoItemMutation(proyectoId)
  const actualizarGrupoItem = useActualizarGrupoItemMutation(proyectoId)
  const eliminarGrupoItem = useEliminarGrupoItemMutation(proyectoId)

  const value = useMemo<CotizadorCompatContexto>(() => {
    const d = data ?? {
      proyecto: null, clientes: [] as Cliente[], parametros: [] as Parametro[],
      espacios: [] as EspacioVariante[], items: [] as ItemVariante[],
      artefactos: [] as EspacioArtefacto[], catalogo: [] as ProductoCatalogo[],
      catalogoAcabados: [] as CatalogoAcabado[], contrato: null, hitos: [] as HitoPago[],
      gruposItem: [] as GrupoItem[],
    }
    return {
      proyectoId,
      cargando: snapshot.isLoading,
      store: {
        proyectos: {
          obtenerPorId: (id) => (d.proyecto && d.proyecto.id === id ? d.proyecto : undefined),
          actualizarParametrosFinancieros: (id, partial) =>
            actualizarParametrosFinancieros.mutateAsync({ id, partial }),
        },
        clientes: {
          obtenerPorId: (id) => d.clientes.find((c) => c.id === id),
          listar: () => d.clientes,
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
          crear: (input) => crearItem.mutateAsync({ ...input, id: crypto.randomUUID() }),
          actualizar: (id, patch) => actualizarItem.mutateAsync({ id, patch }),
          eliminar: (id) => eliminarItem.mutateAsync({ id }),
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
        catalogo: { listar: () => d.catalogo },
        catalogoAcabados: { listar: () => d.catalogoAcabados },
        parametros: { obtenerPorClave: (clave) => d.parametros.find((p) => p.clave === clave) },
        contratos: { porProyecto: (pid) => (d.contrato && d.contrato.proyectoId === pid ? d.contrato : undefined) },
        hitos: { porContrato: (contratoId) => d.hitos.filter((h) => h.contratoId === contratoId) },
      },
    }
  }, [
    data, snapshot.isLoading, proyectoId,
    crearItem, actualizarItem, eliminarItem,
    crearEspacio, actualizarEspacio, eliminarEspacio, marcarEspacioActiva,
    actualizarJornadas, duplicarEspacio, actualizarParametrosFinancieros,
    crearArtefacto, actualizarArtefacto,
    crearGrupoItem, actualizarGrupoItem, eliminarGrupoItem,
  ])

  return <CotizadorCompatContext.Provider value={value}>{children}</CotizadorCompatContext.Provider>
}

export function useCotizadorCompat(): CotizadorCompatContexto {
  const ctx = useContext(CotizadorCompatContext)
  if (!ctx) throw new Error('useCotizadorCompat debe usarse dentro de <CotizadorCompatProvider>')
  return ctx
}