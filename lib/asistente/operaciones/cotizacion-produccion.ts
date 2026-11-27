// lib/asistente/operaciones/cotizacion-produccion.ts
// Cableado Drizzle de cotizacion.crear_completa. Único archivo de operaciones que toca la base.
// La transacción usa `tx` para TODAS las escrituras; no llama a acciones de lib/data/actions/
// (cada una abre su propia conexión y rompería la atomicidad).
import { eq, like } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { EjecutorTransaccion, EscrituraCotizacion } from './cotizacion-completa'

type Consulta = Pick<typeof db, 'select' | 'insert'>

function adaptador(q: Consulta): EscrituraCotizacion {
  return {
    async clienteNombre(id) {
      const [f] = await q.select({ nombre: s.clientes.nombre }).from(s.clientes).where(eq(s.clientes.id, id))
      return f?.nombre ?? null
    },
    async productoCatalogo(id) {
      const [f] = await q
        .select({ precioPublico: s.productosCatalogo.precioPublico, anulado: s.productosCatalogo.anulado })
        .from(s.productosCatalogo)
        .where(eq(s.productosCatalogo.id, id))
      return f ? { precioPublico: f.precioPublico, anulado: f.anulado } : null
    },
    async cotizacionesDelDia(prefijo) {
      const filas = await q.select({ codigo: s.proyectos.codigo }).from(s.proyectos).where(like(s.proyectos.codigo, `${prefijo}%`))
      return filas.length
    },
    async proyectoInsertar(fila) {
      // Mismos defaults que crearProyectoAction (core.ts): activa, personalizado, montos en 0.
      const [f] = await q
        .insert(s.proyectos)
        .values({
          codigo: fila.codigo,
          clienteId: fila.clienteId,
          nombreProyecto: fila.nombreProyecto,
          direccionObra: fila.direccionObra,
          estado: 'activa',
          tipoProyecto: 'personalizado',
          costosOperativos: '0',
          imprevistosInstalacion: '0',
          descuentoComercial: fila.descuentoComercial,
          ajusteArbitrario: '0',
          aplicaIva: fila.aplicaIva,
          porcentajeIva: fila.porcentajeIva,
        })
        .returning({ id: s.proyectos.id })
      return f.id
    },
    async espacioInsertar(fila) {
      const [f] = await q
        .insert(s.espacioVariantes)
        .values({
          proyectoId: fila.proyectoId,
          nombreEspacio: fila.nombreEspacio,
          nombreVariante: 'Inicial',
          tipoEspacio: fila.tipoEspacio,
          activa: true,
          visibleEnPropuestaPublica: true,
          orden: fila.orden,
        })
        .returning({ id: s.espacioVariantes.id })
      return f.id
    },
    async itemInsertar(fila) {
      const [f] = await q
        .insert(s.itemsVariante)
        .values({
          varianteId: fila.varianteId,
          catalogoId: fila.catalogoId,
          cantidad: fila.cantidad,
          precioUnitario: fila.precioUnitario,
          totalLinea: fila.totalLinea,
        })
        .returning({ id: s.itemsVariante.id })
      return f.id
    },
  }
}

/** Lectura fuera de transacción (para preparar el resumen de la propuesta). */
export const lecturaCotizacionDb = adaptador(db)

/** Transacción real: todo el trabajo va por el mismo `tx`; si algo lanza, Postgres revierte. */
export const transaccionCotizacionDb: EjecutorTransaccion = (fn) => db.transaction((tx) => fn(adaptador(tx)))
