// lib/asistente/permisos.ts
// Tipo y matriz MÍNIMOS que usa el asistente. Existen para no depender de la rama de seguridad
// (fix/guard-acciones-protegidas, que trae lib/auth/permisos.ts y lib/auth/errors.ts completos).
// Solo cubre los permisos que el chat realmente pide. La matriz completa del ERP queda pendiente
// de decisión del Supervisor (ver nota en la rama de seguridad). Si esa rama se aprueba, este
// archivo se reemplaza por una importación de lib/auth/permisos.ts.
//
// Principio: rol más restrictivo posible. Admin tiene todo lo del chat; los demás, solo lo
// necesario para su área. Los permisos de escritura y los de excepción comercial (descuento,
// precio libre) se asignan de forma conservadora: ante la duda, no se conceden.
import type { RolCanonico } from '@/lib/data/contracts'

export type Permiso =
  | 'cotizador:leer'
  | 'cotizador:escribir'
  | 'cotizador:descuento'
  | 'cotizador:precio_libre'
  | 'proyectos:leer'
  | 'finanzas:leer'
  | 'finanzas:escribir'

export const PERMISOS_POR_ROL: Record<RolCanonico, readonly Permiso[]> = {
  admin: [
    'cotizador:leer',
    'cotizador:escribir',
    'cotizador:descuento',
    'cotizador:precio_libre',
    'proyectos:leer',
    'finanzas:leer',
    'finanzas:escribir',
  ],
  comercial: ['cotizador:leer', 'cotizador:escribir', 'proyectos:leer'],
  desarrollador: ['cotizador:leer', 'proyectos:leer'],
  compras: ['proyectos:leer'],
  taller: ['proyectos:leer'],
  finanzas: ['proyectos:leer', 'finanzas:leer', 'finanzas:escribir'],
  supervisora_qa: ['proyectos:leer'],
}

/** Error que el chat lanza cuando la sesión no tiene el permiso de la herramienta. */
export class NoAutorizadoError extends Error {
  constructor(permiso: string) {
    super(`No autorizado: el rol de la sesión no tiene el permiso "${permiso}"`)
    this.name = 'NoAutorizadoError'
  }
}
