// lib/asistente/prueba-registro.ts
// SOLO PRUEBAS. Mundo en memoria con los mismos puertos que usan las operaciones en producción
// (clientes, catálogo, cotizaciones, finanzas y transacción de cotización). Las escrituras quedan en
// `mundo.escrituras`; una transacción que falla las revierte (como Postgres).
import type { FilaCliente, DatosClienteNuevo, PuertoClientes } from './ops/clientes'
import type { FilaProducto, PuertoCatalogo } from './ops/catalogo'
import type { DetalleProyecto, FilaProyectoBusqueda, PuertoCotizaciones } from './ops/cotizacion'
import type { FilaCuenta, PuertoFinanzas } from './ops/finanzas'
import type { DefinicionAsistente } from './herramientas'
import type { DepsCotizacion, EjecutorTransaccion, EscrituraCotizacion, LecturaCotizacion } from './operaciones/cotizacion-completa'
import { crearOperaciones, type DepsRegistro } from './registro'

export interface MundoFalso {
  clientes: FilaCliente[]
  productos: FilaProducto[]
  proyectos: FilaProyectoBusqueda[]
  materiales: Map<string, number>
  detalles: Map<string, DetalleProyecto>
  cuentas: FilaCuenta[]
  /** Escrituras registradas (clientes, proyectos, espacios, ítems, movimientos). */
  escrituras: Array<{ tabla: string; fila: unknown }>
  /** Cuántas veces se llamó cada puerto de lectura. */
  llamadas: Record<string, number>
  /** Si se indica N, la inserción número N de ítem de cotización lanza (para probar atomicidad). */
  fallaEnItem?: number
}

export function mundoFalso(parcial: Partial<MundoFalso> = {}): MundoFalso {
  return {
    clientes: [],
    productos: [],
    proyectos: [],
    materiales: new Map(),
    detalles: new Map(),
    cuentas: [],
    escrituras: [],
    llamadas: {},
    ...parcial,
  }
}

function contar(mundo: MundoFalso, nombre: string): void {
  mundo.llamadas[nombre] = (mundo.llamadas[nombre] ?? 0) + 1
}

function clientesFalsos(mundo: MundoFalso): PuertoClientes {
  return {
    async listar() {
      contar(mundo, 'clientes.listar')
      return mundo.clientes
    },
    async porDocumento(documento) {
      contar(mundo, 'clientes.porDocumento')
      const c = mundo.clientes.find((x) => x.documento === documento)
      return c ? { id: c.id } : null
    },
    async crear(datos: DatosClienteNuevo) {
      contar(mundo, 'clientes.crear')
      const id = `cli-${mundo.clientes.length + 1}`
      mundo.escrituras.push({ tabla: 'clientes', fila: { id, ...datos } })
      mundo.clientes.push({ id, nombre: datos.nombre, documento: datos.documento ?? null, telefono: datos.telefono ?? null })
      return id
    },
  }
}

function catalogoFalso(mundo: MundoFalso): PuertoCatalogo {
  return {
    async productosVigentes() {
      contar(mundo, 'catalogo.productos')
      return mundo.productos
    },
  }
}

function cotizacionesFalsas(mundo: MundoFalso): PuertoCotizaciones {
  return {
    async proyectos() {
      contar(mundo, 'cotizaciones.proyectos')
      return mundo.proyectos
    },
    async materialesPorProyecto() {
      contar(mundo, 'cotizaciones.materiales')
      return mundo.materiales
    },
    async detalle(id) {
      contar(mundo, 'cotizaciones.detalle')
      return mundo.detalles.get(id) ?? null
    },
  }
}

function finanzasFalsas(mundo: MundoFalso): PuertoFinanzas {
  return {
    async cuentas() {
      contar(mundo, 'finanzas.cuentas')
      return mundo.cuentas
    },
    async cuentaPorId(id) {
      contar(mundo, 'finanzas.cuentaPorId')
      return mundo.cuentas.find((c) => c.id === id) ?? null
    },
    async registrarMovimiento(datos) {
      contar(mundo, 'finanzas.registrarMovimiento')
      const id = `mov-${mundo.escrituras.length + 1}`
      const cuenta = mundo.cuentas.find((c) => c.id === datos.cuentaId)
      if (cuenta) {
        const delta = Number(datos.monto) * (datos.tipo === 'entrada' ? 1 : -1)
        cuenta.saldoActual = String(Number(cuenta.saldoActual) + delta)
      }
      mundo.escrituras.push({ tabla: 'movimientos', fila: { id, ...datos } })
      return id
    },
  }
}

/** Dependencias de cotización sobre el mundo: lectura directa y transacción con rollback. */
export function cotizacionFalsa(mundo: MundoFalso): DepsCotizacion {
  const lectura: LecturaCotizacion = {
    async clienteNombre(id) {
      return mundo.clientes.find((c) => c.id === id)?.nombre ?? null
    },
    async productoCatalogo(id) {
      const p = mundo.productos.find((x) => x.id === id)
      return p ? { precioPublico: p.precioPublico, anulado: false } : null
    },
  }
  let n = 0
  let itemsIntentados = 0
  const tx = (escritas: MundoFalso['escrituras']): EscrituraCotizacion => ({
    ...lectura,
    async cotizacionesDelDia() {
      return 0
    },
    async proyectoInsertar(fila) {
      const id = `proy-${++n}`
      escritas.push({ tabla: 'proyectos', fila: { id, ...fila } })
      return id
    },
    async espacioInsertar(fila) {
      const id = `esp-${++n}`
      escritas.push({ tabla: 'espacios', fila: { id, ...fila } })
      return id
    },
    async itemInsertar(fila) {
      const id = `item-${++n}`
      itemsIntentados += 1
      if (mundo.fallaEnItem === itemsIntentados) throw new Error('fallo simulado en el ítem')
      escritas.push({ tabla: 'items', fila: { id, ...fila } })
      return id
    },
  })
  const transaccion: EjecutorTransaccion = async (fn) => {
    const previas = mundo.escrituras.length
    const pendientes: MundoFalso['escrituras'] = []
    try {
      const resultado = await fn(tx(pendientes))
      mundo.escrituras.push(...pendientes)
      return resultado
    } catch (err) {
      mundo.escrituras.length = previas
      throw err
    }
  }
  return { lectura, transaccion, ahora: () => new Date('2026-11-27T15:00:00.000Z') }
}

/** Dependencias del registro sobre un mundo en memoria (sin base de datos). */
export function depsRegistroFalsos(mundo: MundoFalso = mundoFalso(), documentos: DepsRegistro['documentos'] = [], indice = ''): DepsRegistro {
  return {
    clientes: clientesFalsos(mundo),
    catalogo: catalogoFalso(mundo),
    cotizaciones: cotizacionesFalsas(mundo),
    finanzas: finanzasFalsas(mundo),
    cotizacion: cotizacionFalsa(mundo),
    documentos,
    indice,
  }
}

/** Registro completo sobre un mundo en memoria. */
export function registroFalso(mundo: MundoFalso = mundoFalso(), documentos: DepsRegistro['documentos'] = [], indice = ''): DefinicionAsistente[] {
  return crearOperaciones(depsRegistroFalsos(mundo, documentos, indice))
}
