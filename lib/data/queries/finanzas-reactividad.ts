export const TABLAS_FINANZAS = new Set<string>([
  'cuentas_financieras',
  'movimientos_financieros',
  'obligaciones_pendientes',
  'cuentas_cobro_proveedor',
  'ordenes_compra',
  'registros_gate_caja',
  'proveedores',
  'proyectos',
  'contratos',
  'hitos_pago',
])

export function esCambioDeFinanzas(tablas: string[]): boolean {
  if (tablas.length === 0) return true
  return tablas.some((tabla) => TABLAS_FINANZAS.has(tabla))
}
