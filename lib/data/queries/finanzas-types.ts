import type {
  CuentaCobroProveedor,
  CuentaFinanciera,
  MovimientoFinanciero,
  ObligacionPendiente,
  OrdenCompra,
  Proyecto,
  Proveedor,
  RegistroGateCaja,
} from '../contracts'

export type ProyectoLite = Pick<Proyecto, 'id' | 'codigo' | 'nombreProyecto'>
export type ProveedorLite = Pick<Proveedor, 'id' | 'nombre'>

export interface FinanzasSnapshot {
  cuentas: CuentaFinanciera[]
  movimientos: MovimientoFinanciero[]
  obligaciones: ObligacionPendiente[]
  cuentasCobro: CuentaCobroProveedor[]
  ordenesCompra: OrdenCompra[]
  proveedores: ProveedorLite[]
  proyectos: ProyectoLite[]
  registrosGate: RegistroGateCaja[]
}
