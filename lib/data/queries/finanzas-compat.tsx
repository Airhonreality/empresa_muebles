'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { calcularCajaDisponible } from '@/lib/modules/f4f5f6/gates'
import { masRecientePrimero } from '../orden'
import type {
  CuentaCobroProveedor,
  CuentaFinanciera,
  MovimientoFinanciero,
  MovimientoManualEdicionInput,
  MovimientoManualInput,
  ObligacionPendiente,
  OrdenCompra,
  Proveedor,
  Proyecto,
  RegistroGateCaja,
} from '../contracts'
import type { FinanzasSnapshot, ProveedorLite, ProyectoLite } from './finanzas-types'
import {
  useActualizarMovimientoMutation,
  useAnularMovimientoMutation,
  useAutorizarPagoCajaMutation,
  useCrearCuentaMutation,
  useCrearMovimientoMutation,
  useCrearProveedorFinanzasMutation,
  useCrearProyectoFinanzasMutation,
  useFinanzasSnapshot,
} from './useFinanzasQueries'

export interface FinanzasCompatStore {
  cuentasFinancieras: {
    listar(): CuentaFinanciera[]
    disponible(): number
    crear(data: { id?: string; nombre: string; tipo: string; saldoInicial?: string; saldoActual?: string }): Promise<CuentaFinanciera>
  }
  movimientosFinancieros: {
    listar(): MovimientoFinanciero[]
    crear(data: MovimientoManualInput): Promise<MovimientoFinanciero>
    actualizar(id: string, data: MovimientoManualEdicionInput): Promise<MovimientoFinanciero | null>
    anular(id: string): Promise<MovimientoFinanciero | null>
  }
  obligacionesPendientes: { listar(): ObligacionPendiente[] }
  cuentasCobroProveedor: { listar(): CuentaCobroProveedor[] }
  ordenesCompra: { listar(): OrdenCompra[] }
  proveedores: {
    listar(): ProveedorLite[]
    crear(data: Partial<Proveedor> & { nombre: string }): Promise<Proveedor>
  }
  proyectos: {
    listar(): ProyectoLite[]
    crear(data: Partial<Proyecto> & { nombreProyecto: string }): Promise<Proyecto>
  }
  registrosGateCaja: { listar(): RegistroGateCaja[] }
  caja: {
    autorizarPago(data: { ordenCompraId: string; cuentaId: string; medioPago?: string }): Promise<MovimientoFinanciero | null>
  }
}

const VACIO: FinanzasSnapshot = {
  cuentas: [],
  movimientos: [],
  obligaciones: [],
  cuentasCobro: [],
  ordenesCompra: [],
  proveedores: [],
  proyectos: [],
  registrosGate: [],
}

interface FinanzasCompatContexto {
  store: FinanzasCompatStore
  cargando: boolean
}

const FinanzasCompatContext = createContext<FinanzasCompatContexto | null>(null)

export function FinanzasCompatProvider({ children }: { children: ReactNode }) {
  const snapshot = useFinanzasSnapshot()
  const crearMovimiento = useCrearMovimientoMutation()
  const actualizarMovimiento = useActualizarMovimientoMutation()
  const anularMovimiento = useAnularMovimientoMutation()
  const crearCuenta = useCrearCuentaMutation()
  const crearProveedor = useCrearProveedorFinanzasMutation()
  const crearProyecto = useCrearProyectoFinanzasMutation()
  const autorizarPago = useAutorizarPagoCajaMutation()

  const value = useMemo<FinanzasCompatContexto>(() => {
    const data = snapshot.data ?? VACIO
    return {
      cargando: snapshot.isLoading && !snapshot.data,
      store: {
        cuentasFinancieras: {
          listar: () => data.cuentas,
          disponible: () => calcularCajaDisponible(data.cuentas, data.obligaciones),
          crear: (values) =>
            crearCuenta.mutateAsync({ id: values.id ?? crypto.randomUUID(), values }),
        },
        movimientosFinancieros: {
          listar: () => masRecientePrimero(data.movimientos),
          crear: (values) =>
            crearMovimiento.mutateAsync({ id: values.id ?? crypto.randomUUID(), values }),
          actualizar: (id, values) => actualizarMovimiento.mutateAsync({ id, values }),
          anular: (id) => anularMovimiento.mutateAsync(id),
        },
        obligacionesPendientes: { listar: () => data.obligaciones },
        cuentasCobroProveedor: { listar: () => data.cuentasCobro },
        ordenesCompra: { listar: () => data.ordenesCompra },
        proveedores: {
          listar: () => data.proveedores,
          crear: (values) => crearProveedor.mutateAsync(values),
        },
        proyectos: {
          listar: () => data.proyectos,
          crear: (values) => crearProyecto.mutateAsync(values),
        },
        registrosGateCaja: { listar: () => data.registrosGate },
        caja: {
          autorizarPago: (values) => autorizarPago.mutateAsync(values),
        },
      },
    }
  }, [
    snapshot.data,
    snapshot.isLoading,
    crearMovimiento,
    actualizarMovimiento,
    anularMovimiento,
    crearCuenta,
    crearProveedor,
    crearProyecto,
    autorizarPago,
  ])

  return <FinanzasCompatContext.Provider value={value}>{children}</FinanzasCompatContext.Provider>
}

export function useFinanzasCompat(): FinanzasCompatContexto {
  const ctx = useContext(FinanzasCompatContext)
  if (!ctx) throw new Error('useFinanzasCompat debe usarse dentro de <FinanzasCompatProvider>')
  return ctx
}
