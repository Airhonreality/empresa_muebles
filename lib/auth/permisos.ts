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

// TEMPORAL (2026-11-27): mientras el Supervisor decide la matriz rol→permiso real, todo empleado
// autenticado conserva el alcance que tiene hoy (todos los permisos). El protocolo de guarda
// (protegerAccion) sigue activo: sin sesión o sin permiso declarado, la acción no se ejecuta.
// Para restringir un rol, reemplazar su entrada aquí; no cambiar protegerAccion.
export const PERMISOS_POR_ROL: Record<RolCanonico, readonly Permiso[]> = {
  admin: PERMISOS,
  comercial: PERMISOS,
  desarrollador: PERMISOS,
  compras: PERMISOS,
  taller: PERMISOS,
  finanzas: PERMISOS,
  supervisora_qa: PERMISOS,
}
