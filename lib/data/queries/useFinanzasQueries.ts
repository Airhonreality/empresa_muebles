'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarMovimientoManualAction,
  anularMovimientoManualAction,
  autorizarPagoCajaAction,
  crearCuentaFinancieraAction,
  crearMovimientoManualAction,
  crearProveedorAction,
} from '@/lib/data/actions/f6'
import { crearProyectoAction } from '@/lib/data/actions/core'
import { obtenerSnapshotFinanzasAction } from '@/lib/data/actions/lecturas-finanzas'
import type { CuentaFinanciera, MovimientoFinanciero } from '../contracts'
import { useMutationOptGenerico } from './factory'
import {
  actualizarMovimiento,
  agregarCuenta,
  agregarMovimiento,
  anularMovimiento,
  reconciliarCuenta,
  reconciliarMovimiento,
  revertirActualizarMovimiento,
  revertirAgregarCuenta,
  revertirAgregarMovimiento,
  revertirAnularMovimiento,
  type VarsCuentaNueva,
  type VarsMovimientoEdicion,
  type VarsMovimientoNuevo,
} from './finanzas-optimistic'
import type { FinanzasSnapshot } from './finanzas-types'
import { finanzasKeys } from './queryKeys'

export function useFinanzasSnapshot() {
  return useQuery<FinanzasSnapshot>({
    queryKey: finanzasKeys.snapshot,
    queryFn: obtenerSnapshotFinanzasAction,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}

export function useCrearMovimientoMutation() {
  return useMutationOptGenerico<FinanzasSnapshot, VarsMovimientoNuevo, MovimientoFinanciero>(
    finanzasKeys.snapshot,
    (vars) => crearMovimientoManualAction({ ...vars.values, id: vars.id }),
    (snap, vars) => agregarMovimiento(snap, vars),
    (snap, row) => reconciliarMovimiento(snap, row),
    { revertirOptimista: (actual, vars) => revertirAgregarMovimiento(actual, vars) },
  )
}

export function useActualizarMovimientoMutation() {
  return useMutationOptGenerico<FinanzasSnapshot, VarsMovimientoEdicion, MovimientoFinanciero | null>(
    finanzasKeys.snapshot,
    (vars) => actualizarMovimientoManualAction(vars.id, vars.values),
    (snap, vars) => actualizarMovimiento(snap, vars),
    (snap, row) => (row ? reconciliarMovimiento(snap, row) : snap),
    { revertirOptimista: (actual, vars, previo) => revertirActualizarMovimiento(actual, vars, previo) },
  )
}

export function useAnularMovimientoMutation() {
  return useMutationOptGenerico<FinanzasSnapshot, string, MovimientoFinanciero | null>(
    finanzasKeys.snapshot,
    (id) => anularMovimientoManualAction(id),
    (snap, id) => anularMovimiento(snap, id),
    (snap, row) => (row ? reconciliarMovimiento(snap, row) : snap),
    { revertirOptimista: (actual, id, previo) => revertirAnularMovimiento(actual, id, previo) },
  )
}

export function useCrearCuentaMutation() {
  return useMutationOptGenerico<FinanzasSnapshot, VarsCuentaNueva, CuentaFinanciera>(
    finanzasKeys.snapshot,
    (vars) => crearCuentaFinancieraAction({ ...vars.values, id: vars.id }),
    (snap, vars) => agregarCuenta(snap, vars),
    (snap, row) => reconciliarCuenta(snap, row),
    { revertirOptimista: (actual, vars) => revertirAgregarCuenta(actual, vars.id) },
  )
}

export function useCrearProveedorFinanzasMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof crearProveedorAction>[0]) => crearProveedorAction(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: finanzasKeys.all }) },
  })
}

export function useCrearProyectoFinanzasMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof crearProyectoAction>[0]) => crearProyectoAction(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: finanzasKeys.all }) },
  })
}

export function useAutorizarPagoCajaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { ordenCompraId: string; cuentaId: string; medioPago?: string }) =>
      autorizarPagoCajaAction(data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: finanzasKeys.all }) },
  })
}
