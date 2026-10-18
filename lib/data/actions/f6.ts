'use server'
// Server Actions del cluster F6: finanzas (cuentas, obligaciones, órdenes de compra, caja, proveedores).
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { calcularCajaDisponible } from '@/lib/modules/f4f5f6/gates'
import { validarEntrada } from '@/lib/validacion/validar'
import { cuentaFinancieraCrearSchema, movimientoManualSchema } from '@/lib/validacion/finanzas'
import { num } from './mappers'
import type {
  CuentaFinanciera, ObligacionPendiente, OrigenObligacion, EstadoObligacion,
  OrdenCompra, EstadoOrdenCompra, MovimientoFinanciero, MovimientoManualInput,
  Proveedor, ProveedorCuentaBancaria, Banco,
} from '../contracts'

export async function crearCuentaFinancieraAction(
  data: { nombre: string; tipo: string; saldoInicial?: string; saldoActual?: string },
): Promise<CuentaFinanciera> {
  const validado = validarEntrada(cuentaFinancieraCrearSchema, data)
  const saldo = validado.saldoInicial ?? validado.saldoActual ?? '0'
  const [nuevo] = await db.insert(s.cuentasFinancieras).values({
    nombre: validado.nombre,
    tipo: validado.tipo,
    saldoInicial: saldo,
    saldoActual: saldo,
  }).returning()
  return nuevo as unknown as CuentaFinanciera
}

/** t-181: entrada (credito a la cuenta) o salida (debito de la cuenta) manual.
 *  El saldo se actualiza con aritmética SQL atómica dentro de la misma transacción.
 *  Se permite saldo negativo a propósito (decisión de Supervisor 2026-10-17). */
export async function crearMovimientoManualAction(data: MovimientoManualInput): Promise<MovimientoFinanciero> {
  const validado = validarEntrada(movimientoManualSchema, data)
  const esEntrada = validado.tipo === 'entrada'

  return db.transaction(async (tx) => {
    const [cuenta] = await tx
      .select()
      .from(s.cuentasFinancieras)
      .where(eq(s.cuentasFinancieras.id, validado.cuentaId))
    if (!cuenta) throw new Error('La cuenta financiera no existe.')

    const [movimiento] = await tx.insert(s.movimientosFinancieros).values({
      fecha: validado.fecha,
      descripcion: validado.descripcion,
      tipo: esEntrada ? 'credito' : 'debito',
      monto: validado.monto,
      estado: 'asentado',
      cuentaOrigenId: esEntrada ? null : cuenta.id,
      cuentaDestinoId: esEntrada ? cuenta.id : null,
      proyectoId: validado.proyectoId ?? null,
      proveedorId: validado.proveedorId ?? null,
      medioPago: null,
      comprobanteUrl: validado.comprobanteUrl ?? null,
    }).returning()

    await tx.update(s.cuentasFinancieras).set({
      saldoActual: esEntrada
        ? sql`${s.cuentasFinancieras.saldoActual} + ${validado.monto}::numeric`
        : sql`${s.cuentasFinancieras.saldoActual} - ${validado.monto}::numeric`,
    }).where(eq(s.cuentasFinancieras.id, cuenta.id))

    return movimiento as unknown as MovimientoFinanciero
  })
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
    nombre: data.nombre, nit: data.nit ?? null, categoria: data.categoria ?? null,
    descripcion: data.descripcion ?? null,
    contactoNombre: data.contactoNombre ?? null, contactoCargo: data.contactoCargo ?? null,
    email: data.email ?? null, whatsapp: data.whatsapp ?? null,
    telefonoComercial: data.telefonoComercial ?? null, telefonoAlterno: data.telefonoAlterno ?? null,
    direccionDespacho: data.direccionDespacho ?? null, ciudad: data.ciudad ?? null, medioPago: data.medioPago ?? null,
    diasEntregaDefault: data.diasEntregaDefault ?? null, transportadora: data.transportadora ?? null,
    tarifaFlete: data.tarifaFlete ?? null,
  }).returning()
  return nuevo as unknown as Proveedor
}

export async function actualizarProveedorAction(
  id: string,
  data: Partial<Omit<Proveedor, 'id' | 'createdAt'>>,
): Promise<Proveedor | null> {
  const [actualizado] = await db.update(s.proveedores).set({
    nombre: data.nombre,
    nit: data.nit,
    categoria: data.categoria,
    descripcion: data.descripcion,
    contactoNombre: data.contactoNombre,
    contactoCargo: data.contactoCargo,
    email: data.email,
    whatsapp: data.whatsapp,
    telefonoComercial: data.telefonoComercial,
    telefonoAlterno: data.telefonoAlterno,
    direccionDespacho: data.direccionDespacho,
    ciudad: data.ciudad,
    medioPago: data.medioPago,
    diasEntregaDefault: data.diasEntregaDefault,
    transportadora: data.transportadora,
    tarifaFlete: data.tarifaFlete,
  }).where(eq(s.proveedores.id, id)).returning()
  return (actualizado as unknown as Proveedor) ?? null
}


export async function crearBancoAction(data: Partial<Banco> & { nombre: string }): Promise<Banco> {
  const [nuevo] = await db.insert(s.bancos).values({
    nombre: data.nombre,
    codigo: data.codigo ?? null,
    activo: data.activo ?? true,
  }).returning()
  return nuevo as unknown as Banco
}

export async function crearProveedorCuentaBancariaAction(
  data: Partial<ProveedorCuentaBancaria> & { proveedorId: string; tipo: ProveedorCuentaBancaria['tipo'] },
): Promise<ProveedorCuentaBancaria> {
  return db.transaction(async (tx) => {
    const ahora = new Date().toISOString()
    if (data.esPrincipal) {
      await tx.update(s.proveedorCuentasBancarias)
        .set({ esPrincipal: false, updatedAt: ahora })
        .where(eq(s.proveedorCuentasBancarias.proveedorId, data.proveedorId))
    }
    const [nueva] = await tx.insert(s.proveedorCuentasBancarias).values({
      proveedorId: data.proveedorId,
      tipo: data.tipo,
      alias: data.alias ?? null,
      bancoId: data.bancoId ?? null,
      tipoCuenta: data.tipoCuenta ?? null,
      numeroCuenta: data.numeroCuenta ?? null,
      titular: data.titular ?? null,
      documentoTitular: data.documentoTitular ?? null,
      tipoLlave: data.tipoLlave ?? null,
      llave: data.llave ?? null,
      esPrincipal: data.esPrincipal ?? false,
      activa: data.activa ?? true,
      notas: data.notas ?? null,
      updatedAt: ahora,
    }).returning()
    return nueva as unknown as ProveedorCuentaBancaria
  })
}

export async function actualizarProveedorCuentaBancariaAction(
  id: string,
  data: Partial<Omit<ProveedorCuentaBancaria, 'id' | 'proveedorId' | 'createdAt' | 'updatedAt'>>,
): Promise<ProveedorCuentaBancaria | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.proveedorCuentasBancarias).where(eq(s.proveedorCuentasBancarias.id, id))
    if (!actual) return null
    const ahora = new Date().toISOString()
    if (data.esPrincipal) {
      await tx.update(s.proveedorCuentasBancarias)
        .set({ esPrincipal: false, updatedAt: ahora })
        .where(eq(s.proveedorCuentasBancarias.proveedorId, actual.proveedorId))
    }
    const [actualizada] = await tx.update(s.proveedorCuentasBancarias).set({
      tipo: data.tipo,
      alias: data.alias,
      bancoId: data.bancoId,
      tipoCuenta: data.tipoCuenta,
      numeroCuenta: data.numeroCuenta,
      titular: data.titular,
      documentoTitular: data.documentoTitular,
      tipoLlave: data.tipoLlave,
      llave: data.llave,
      esPrincipal: data.esPrincipal,
      activa: data.activa,
      notas: data.notas,
      updatedAt: ahora,
    }).where(eq(s.proveedorCuentasBancarias.id, id)).returning()
    return (actualizada as unknown as ProveedorCuentaBancaria) ?? null
  })
}

export async function eliminarProveedorCuentaBancariaAction(id: string): Promise<boolean> {
  const [eliminada] = await db.delete(s.proveedorCuentasBancarias)
    .where(eq(s.proveedorCuentasBancarias.id, id))
    .returning({ id: s.proveedorCuentasBancarias.id })
  return Boolean(eliminada)
}
