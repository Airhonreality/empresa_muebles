// lib/asistente/ops/erp.ts
// Lecturas que reutilizan las acciones de lectura del ERP (lib/data/actions/lecturas-*). Las acciones
// se inyectan para poder probarlas sin base. Este archivo es TEMPORAL dentro del paso 2 de t-200: las
// operaciones de búsqueda definitivas (paso 3) reemplazan estas definiciones.
import { z } from 'zod'
import type { CotizadorListaSnapshot } from '../../data/queries/cotizador-lista-types'
import type { ProyectoSnapshot } from '../../data/queries/proyecto-types'
import type { FinanzasSnapshot } from '../../data/queries/finanzas-types'
import type { Cliente, Proyecto } from '../../data/contracts'
import { aNumero } from '../../dinero/calculo'
import { type DefinicionAsistente, type DefinicionLectura } from '../herramientas'

/**
 * Acciones de lectura que usan las herramientas. En producción se cargan con import dinámico
 * (así los tests que usan acciones falsas no abren conexión ni leen la cookie).
 */
export interface AccionesLectura {
  cotizadorLista: () => Promise<CotizadorListaSnapshot>
  proyecto: (proyectoId: string) => Promise<ProyectoSnapshot>
  finanzas: () => Promise<FinanzasSnapshot>
}

export const accionesErp: AccionesLectura = {
  cotizadorLista: async () =>
    (await import('../../data/actions/lecturas-cotizador-lista')).obtenerSnapshotCotizadorListaAction(),
  proyecto: async (proyectoId) =>
    (await import('../../data/actions/lecturas-proyecto')).obtenerSnapshotProyectoAction(proyectoId),
  finanzas: async () =>
    (await import('../../data/actions/lecturas-finanzas')).obtenerSnapshotFinanzasAction(),
}

const LIMITE_RESULTADOS_LISTA = 20

function nombreCliente(clientes: Cliente[], clienteId: string | null): string | null {
  if (!clienteId) return null
  return clientes.find((c) => c.id === clienteId)?.nombre ?? null
}

function resumenProyecto(p: Proyecto, clientes: Cliente[]) {
  return {
    id: p.id,
    codigo: p.codigo,
    nombreProyecto: p.nombreProyecto,
    estado: p.estado,
    tipoProyecto: p.tipoProyecto,
    cliente: nombreCliente(clientes, p.clienteId),
    creadoEn: p.createdAt,
  }
}

const esquemaCotizacionBuscar = z.object({
  texto: z.string().trim().min(2, 'Escribe al menos 2 caracteres').max(120),
})

const cotizacionBuscar = (acciones: AccionesLectura): DefinicionLectura<typeof esquemaCotizacionBuscar> => ({
  nombre: 'cotizacion.buscar',
  dominio: 'cotizacion',
  operacion: 'buscar',
  descripcion:
    'Busca cotizaciones por código (ej. COT-2026-11-25-01), nombre del proyecto o nombre del cliente. Devuelve hasta 20 coincidencias.',
  permiso: 'proyectos:leer',
  canales: ['chat'],
  esEscritura: false,
  esquema: esquemaCotizacionBuscar,
  ejecutar: async ({ texto }, _usuario, ctx) => {
    const snapshot = await acciones.cotizadorLista()
    const buscado = texto.toLocaleLowerCase('es')
    const coincidencias = snapshot.proyectos.filter((p) => {
      const cliente = nombreCliente(snapshot.clientes, p.clienteId) ?? ''
      return (
        p.codigo.toLocaleLowerCase('es').includes(buscado) ||
        p.nombreProyecto.toLocaleLowerCase('es').includes(buscado) ||
        cliente.toLocaleLowerCase('es').includes(buscado)
      )
    })
    const resultados = coincidencias.slice(0, LIMITE_RESULTADOS_LISTA)
    ctx.procedencia.registrar('cotizacion', resultados.map((p) => p.id))
    return {
      total: coincidencias.length,
      resultados: resultados.map((p) => ({ ...resumenProyecto(p, snapshot.clientes), proyectoId: p.id })),
    }
  },
})

const esquemaProyectoConsultar = z.object({
  proyectoId: z.uuid('proyectoId debe ser un identificador válido'),
})

const proyectoConsultar = (acciones: AccionesLectura): DefinicionLectura<typeof esquemaProyectoConsultar> => ({
  nombre: 'proyecto.consultar',
  dominio: 'proyecto',
  operacion: 'consultar',
  descripcion:
    'Consulta un proyecto por su proyectoId (obtenido con cotizacion_buscar): estado, cliente, espacios y totales básicos.',
  permiso: 'proyectos:leer',
  canales: ['chat'],
  esEscritura: false,
  esquema: esquemaProyectoConsultar,
  ejecutar: async ({ proyectoId }) => {
    const snapshot = await acciones.proyecto(proyectoId)
    if (!snapshot.proyecto) return { encontrado: false }
    return {
      encontrado: true,
      proyecto: resumenProyecto(snapshot.proyecto, snapshot.cliente ? [snapshot.cliente] : []),
      espacios: snapshot.espacios.map((e) => ({
        nombre: e.nombreEspacio,
        variante: e.nombreVariante,
        tipo: e.tipoEspacio,
      })),
    }
  },
})

const esquemaCajaSaldo = z.object({})

const cajaSaldo = (acciones: AccionesLectura): DefinicionLectura<typeof esquemaCajaSaldo> => ({
  nombre: 'finanzas.saldo_caja',
  dominio: 'finanzas',
  operacion: 'saldo_caja',
  descripcion: 'Devuelve el saldo actual de cada cuenta financiera (caja, bancos) y el total.',
  permiso: 'finanzas:leer',
  canales: ['chat'],
  esEscritura: false,
  esquema: esquemaCajaSaldo,
  ejecutar: async () => {
    const snapshot = await acciones.finanzas()
    const cuentas = snapshot.cuentas.map((c) => ({
      nombre: c.nombre,
      tipo: c.tipo,
      saldoActual: c.saldoActual,
    }))
    // Dos decimales, sin redondear a pesos: un saldo de caja no puede perder centavos.
    const total = Math.round(snapshot.cuentas.reduce((suma, c) => suma + aNumero(c.saldoActual), 0) * 100) / 100
    return { cuentas, total }
  },
})

/** Lecturas temporales (paso 2). Las reemplazan las operaciones de búsqueda del paso 3. */
export function lecturasErpTemporales(acciones: AccionesLectura): DefinicionAsistente[] {
  return [cotizacionBuscar(acciones), proyectoConsultar(acciones), cajaSaldo(acciones)]
}
