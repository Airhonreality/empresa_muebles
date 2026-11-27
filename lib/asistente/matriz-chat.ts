// lib/asistente/matriz-chat.ts
// Segunda barrera del asistente. La matriz del ERP (lib/auth/permisos.ts) está en modo TEMPORAL: todo
// rol tiene todos los permisos para no romper pantallas en producción. Aquí vive la matriz restrictiva
// que sí aplica al chat: una operación del asistente exige el permiso base Y puedeUsarChat(rol, permiso).
//
// Origen: PERMISOS_POR_ROL de la versión 0f5a649 de lib/auth/permisos.ts. Los permisos añadidos
// (clientes, catálogo, cotizador, finanzas, proyectos, erp:acceso) ya los tenía cada rol en esa versión:
// ningún rol gana permisos nuevos respecto del original.
//
// Descuentos y precio libre NO tienen permiso propio en lib/auth/permisos.ts. Quedan solo para admin
// (ROLES_DESCUENTO_CHAT). Esta matriz no inventa permisos.
import { PERMISOS, type Permiso } from '../auth/permisos'
import type { RolCanonico } from '../data/contracts'

const BASE: readonly Permiso[] = ['erp:acceso']

export const MATRIZ_CHAT: Record<RolCanonico, readonly Permiso[]> = {
  admin: PERMISOS,

  comercial: [
    ...BASE,
    'cotizador:leer', 'cotizador:escribir',
    'proyectos:leer',
    'clientes:leer', 'clientes:escribir',
    'contratos:leer',
    'catalogo:leer',
    'comercial:leer', 'comercial:escribir',
    'marketing:leer', 'tienda:leer', 'garantia:leer',
  ],

  desarrollador: [
    ...BASE,
    'cotizador:leer', 'cotizador:escribir',
    'proyectos:leer', 'proyectos:escribir',
    'produccion:leer', 'produccion:escribir',
    'clientes:leer',
    'catalogo:leer',
    'taller:leer', 'compras:leer',
  ],

  compras: [
    ...BASE,
    'compras:leer', 'compras:escribir',
    'catalogo:leer',
    'proyectos:leer',
  ],

  // Sin cotizador:* ni finanzas:*: no ve cotizaciones ni finanzas en el chat.
  taller: [
    ...BASE,
    'taller:leer', 'taller:escribir',
    'produccion:leer',
    'proyectos:leer',
  ],

  // Sin cotizador:*: no ve cotizaciones en el chat.
  finanzas: [
    ...BASE,
    'finanzas:leer', 'finanzas:escribir',
    'contratos:leer',
    'proyectos:leer',
    'clientes:leer',
    'compras:leer',
  ],

  supervisora_qa: [
    ...BASE,
    'produccion:leer', 'produccion:escribir',
    'proyectos:leer',
    'garantia:leer',
    'taller:leer',
  ],
}

/** Roles que pueden aplicar descuentos o precio libre desde el chat. Sin permiso propio: solo admin. */
export const ROLES_DESCUENTO_CHAT: readonly RolCanonico[] = ['admin']

/** ¿Puede el rol usar esta operación desde el chat? Segunda barrera, además del permiso base. */
export function puedeUsarChat(rol: RolCanonico, permiso: Permiso): boolean {
  return (MATRIZ_CHAT[rol] ?? []).includes(permiso)
}

/** ¿Puede el rol aplicar un descuento o precio libre desde el chat? */
export function puedeDescontarChat(rol: RolCanonico): boolean {
  return ROLES_DESCUENTO_CHAT.includes(rol)
}
