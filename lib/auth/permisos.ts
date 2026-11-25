// Matriz de permisos del ERP: DATOS, no lógica. La única regla de decisión vive en
// lib/auth/accion.ts (protegerAccion). Cada permiso corresponde a un área real del código
// (carpetas de lib/data/actions/ y app/erp/).
//
// DECISIÓN PENDIENTE DEL SUPERVISOR: no existe en el repo una matriz rol→permiso documentada
// (arnes/ solo lista los 7 roles canónicos). Lo de abajo es el rol MÁS RESTRICTIVO que tiene
// sentido por área; el Supervisor debe revisarlo antes de dar la protección por cerrada.
import type { RolCanonico } from '@/lib/data/contracts'

export const PERMISOS = [
  'erp:acceso',
  'cotizador:leer', 'cotizador:escribir',
  'proyectos:leer', 'proyectos:escribir',
  'clientes:leer', 'clientes:escribir',
  'contratos:leer', 'contratos:escribir',
  'catalogo:leer', 'catalogo:escribir',
  'produccion:leer', 'produccion:escribir',
  'compras:leer', 'compras:escribir',
  'taller:leer', 'taller:escribir',
  'garantia:leer', 'garantia:escribir',
  'finanzas:leer', 'finanzas:escribir',
  'equipo:leer', 'equipo:escribir',
  'comercial:leer', 'comercial:escribir',
  'tienda:leer', 'tienda:escribir',
  'marketing:leer', 'marketing:escribir',
  'sistema:leer', 'sistema:escribir',
] as const

export type Permiso = (typeof PERMISOS)[number]

/** Todo empleado con sesión válida puede entrar al ERP (lectura de snapshots, longpoll). */
const BASE: readonly Permiso[] = ['erp:acceso']

export const PERMISOS_POR_ROL: Record<RolCanonico, readonly Permiso[]> = {
  // Único rol con parámetros del sistema y gestión de equipo/accesos.
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

  taller: [
    ...BASE,
    'taller:leer', 'taller:escribir',
    'produccion:leer',
    'proyectos:leer',
  ],

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
