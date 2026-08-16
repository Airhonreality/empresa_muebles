'use server'
// Server Actions del cluster F6: finanzas (cuentas, obligaciones, órdenes de compra, caja, proveedores).
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { calcularCajaDisponible } from '@/lib/modules/f4f5f6/gates'
import { num } from './mappers'
import type {
  CuentaFinanciera, ObligacionPendiente, OrigenObligacion, EstadoObligacion,
  OrdenCompra, EstadoOrdenCompra, MovimientoFinanciero, Proveedor,
} from '../contracts'

export async function crearCuentaFinancieraAction(data: { nombre: string; tipo: string; saldoActual?: string }): Promise<CuentaFinanciera> {
  const [nuevo] = await db.insert(s.cuentasFinancieras).values({
    nombre: data.nombre, tipo: data.tipo, saldoActual: data.saldoActual ?? '0',
  }).returning()
  return nuevo as unknown as CuentaFinanciera
}

export async function crearObligacionAction(data: Partial<ObligacionPendiente> & { descripcion: string; origen: OrigenObligacion; montoTotal: string; fechaVencimiento: string }): Promise<ObligacionPendiente> {
  const [nuevo] = await db.insert(s.obligacionesPendientes).values({
    descripcion: data.descripcion, origen: data.origen, montoTotal: data.montoTotal,
    montoPagado: data.montoPagado ?? '0', fechaVencimiento: data.fechaVencimiento, estado: data.estado ?? 'pendiente',
    personaId: data.personaId ?? null, clienteId: data.clienteId ?? null, proveedorId: data.proveedorId ?? null,
    proyectoId: data.proyectoId ?? null, contratoId: data.contratoId ?? null, hitoId: data.hitoId ?? null,
    ordenCompraId: data.ordenCompraId ?? null, baseCalculo: data.baseCalculo ?? null, porcentaje: data.porcentaje ?? null,
    tipoComision: data.tipoComision ?? null, cantidadModulos: data.cantidadModulos ?? null, desfaseId: data.desfaseId ?? null,
    periodicidad: data.periodicidad ?? null, deduccionDiseno3d: data.deduccionDiseno3d ?? false,
  }).returning()
  return nuevo as unknown as ObligacionPendiente
}

export async function registrarPagoObligacionAction(id: string, data: { monto: string; cuentaId: string; medioPago?: string }): Promise<ObligacionPendiente | null> {
  return db.transaction(async (tx) => {
    const [obligacion] = await tx.select().from(s.obligacionesPendientes).where(eq(s.obligacionesPendientes.id, id))
    if (!obligacion) return null
    const nuevoPagado = num(obligacion.montoPagado) + num(data.monto)
    if (nuevoPagado > num(obligacion.montoTotal)) return null
    const [cuenta] = await tx.select().from(s.cuentasFinancieras).where(eq(s.cuentasFinancieras.id, data.cuentaId))
    if (!cuenta) return null
    await tx.insert(s.movimientosFinancieros).values({
      fecha: new Date().toISOString().slice(0, 10), descripcion: `Pago obligación: ${obligacion.descripcion}`,
      tipo: 'debito', monto: data.monto, cuentaOrigenId: cuenta.id, obligacionId: id,
      proyectoId: obligacion.proyectoId, contratoId: obligacion.contratoId, socioId: obligacion.personaId,
      medioPago: data.medioPago ?? null,
    })
    await tx.update(s.cuentasFinancieras).set({ saldoActual: String(num(cuenta.saldoActual) - num(data.monto)) }).where(eq(s.cuentasFinancieras.id, cuenta.id))
    const estado: EstadoObligacion = nuevoPagado >= num(obligacion.montoTotal) ? 'pagado' : 'parcial'
    const [actualizado] = await tx.update(s.obligacionesPendientes).set({ montoPagado: String(nuevoPagado), estado }).where(eq(s.obligacionesPendientes.id, id)).returning()
    return actualizado as unknown as ObligacionPendiente
  })
}

export async function crearOrdenCompraAction(data: Partial<OrdenCompra> & { proveedorId: string; montoTotal: string }): Promise<OrdenCompra> {
  return db.transaction(async (tx) => {
    const codigoOrden = data.codigoOrden ?? `OC-${Date.now()}`
    const [nuevo] = await tx.insert(s.ordenesCompra).values({
      codigoOrden, proyectoId: data.proyectoId ?? null, proveedorId: data.proveedorId, montoTotal: data.montoTotal,
      anticipoMonto: data.anticipoMonto ?? null, estado: data.estado ?? 'solicitada',
      mecanicaPago: data.mecanicaPago ?? 'unico', fechaRecepcionEsperada: data.fechaRecepcionEsperada ?? null,
      tiempoEntregaDias: data.tiempoEntregaDias ?? null,
    }).returning()
    // C-01: crea la obligación de pago al proveedor automáticamente, en la misma operación.
    await tx.insert(s.obligacionesPendientes).values({
      descripcion: `Orden de compra: ${nuevo.codigoOrden}`, origen: 'proveedor', montoTotal: nuevo.montoTotal,
      montoPagado: '0', fechaVencimiento: nuevo.fechaRecepcionEsperada ?? new Date().toISOString().slice(0, 10),
      estado: 'pendiente', proveedorId: nuevo.proveedorId, proyectoId: nuevo.proyectoId, ordenCompraId: nuevo.id,
      deduccionDiseno3d: false,
    })
    return nuevo as unknown as OrdenCompra
  })
}

export async function actualizarEstadoOrdenCompraAction(id: string, estado: EstadoOrdenCompra): Promise<OrdenCompra | null> {
  const [actualizado] = await db.update(s.ordenesCompra).set({ estado, updatedAt: new Date().toISOString() }).where(eq(s.ordenesCompra.id, id)).returning()
  return (actualizado as unknown as OrdenCompra) ?? null
}

export async function autorizarPagoCajaAction(data: { ordenCompraId: string; cuentaId: string; medioPago?: string }): Promise<MovimientoFinanciero | null> {
  return db.transaction(async (tx) => {
    const [oc] = await tx.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.id, data.ordenCompraId))
    if (!oc || oc.estado !== 'en_pago') return null

    const cuentas = await tx.select().from(s.cuentasFinancieras)
    const obligaciones = await tx.select().from(s.obligacionesPendientes)
    const disponible = calcularCajaDisponible(cuentas, obligaciones)
    const monto = num(oc.montoTotal)
    const ahora = new Date().toISOString()

    if (monto > disponible) {
      await tx.insert(s.registrosGateCaja).values({
        ordenCompraId: oc.id, fecha: ahora, montoSolicitado: oc.montoTotal, saldoDisponible: String(disponible), bloqueado: true,
      })
      return null
    }

    const [cuenta] = await tx.select().from(s.cuentasFinancieras).where(eq(s.cuentasFinancieras.id, data.cuentaId))
    if (!cuenta) return null
    const obligacionVinculada = obligaciones.find(o => o.ordenCompraId === oc.id)

    const [movimiento] = await tx.insert(s.movimientosFinancieros).values({
      fecha: ahora.slice(0, 10), descripcion: `Pago OC ${oc.codigoOrden}`, tipo: 'debito', monto: oc.montoTotal,
      cuentaOrigenId: cuenta.id, obligacionId: obligacionVinculada?.id ?? null, ordenCompraId: oc.id,
      proyectoId: oc.proyectoId, medioPago: data.medioPago ?? null,
    }).returning()

    await tx.update(s.cuentasFinancieras).set({ saldoActual: String(num(cuenta.saldoActual) - monto) }).where(eq(s.cuentasFinancieras.id, cuenta.id))
    await tx.update(s.ordenesCompra).set({ estado: 'pagada', updatedAt: ahora }).where(eq(s.ordenesCompra.id, oc.id))

    if (obligacionVinculada) {
      const nuevoPagado = num(obligacionVinculada.montoPagado) + monto
      const estado: EstadoObligacion = nuevoPagado >= num(obligacionVinculada.montoTotal) ? 'pagado' : 'parcial'
      await tx.update(s.obligacionesPendientes).set({ montoPagado: String(nuevoPagado), estado }).where(eq(s.obligacionesPendientes.id, obligacionVinculada.id))
    }

    return movimiento as unknown as MovimientoFinanciero
  })
}

export async function crearProveedorAction(data: Partial<Proveedor> & { nombre: string }): Promise<Proveedor> {
  const [nuevo] = await db.insert(s.proveedores).values({
    nombre: data.nombre, nit: data.nit ?? null, telefonoComercial: data.telefonoComercial ?? null,
    direccionDespacho: data.direccionDespacho ?? null, ciudad: data.ciudad ?? null, medioPago: data.medioPago ?? null,
    diasEntregaDefault: data.diasEntregaDefault ?? null, transportadora: data.transportadora ?? null,
    tarifaFlete: data.tarifaFlete ?? null,
  }).returning()
  return nuevo as unknown as Proveedor
}
