'use server'

// Server Action de logout del portal cliente (F-07). Separado de
// lib/auth/session.ts a propósito: un archivo 'use server' solo puede
// exportar funciones async (session.ts también exporta getSession(), que
// devuelve un objeto con métodos no serializables — no puede ser 'use server').
import { redirect } from 'next/navigation'
import {
  logout,
  logoutEmpleado,
  crearInvitacionEmpleado,
  listarEstadoCuentasEmpleado,
  type InvitacionResult,
  type EstadoCuentaEmpleado,
} from './session'
import { registrarAuditLog } from './audit'
import type { RolCanonico } from '@/lib/data/contracts'

export async function logoutAction(): Promise<void> {
  await logout()
  redirect('/cuenta/login')
}

// ── Login interno del ERP (D-08b, F10 2026-08-15) ──
// El login mismo ya NO es una Server Action: ver app/api/erp/login/route.ts
// y su comentario -- se comprobó con Runtime Logs + un navegador real que el
// servidor completaba el login rápido y sin errores en cada intento, pero el
// navegador nunca recibía la respuesta (streaming de Server Actions roto
// sobre el edge de Vercel para esta ruta). Un Route Handler JSON normal lo
// evita por completo.

export async function logoutEmpleadoAction(): Promise<void> {
  await logoutEmpleado()
  redirect('/erp/login')
}

// ── Activación de invitación de empleado ──
// Tampoco es Server Action, mismo motivo que el login: ver
// app/api/erp/activar/route.ts y components/veta/activar-cuenta-form.tsx.

/** Llamado imperativamente desde app/erp/equipo/page.tsx (client component). */
export async function crearInvitacionEmpleadoAction(input: {
  personaId: string
  email: string
  rol: RolCanonico
  nombre: string
}): Promise<InvitacionResult> {
  const resultado = await crearInvitacionEmpleado(input)
  if (resultado.ok) {
    await registrarAuditLog({
      accion: 'acceso.generar_o_editar',
      entidadTipo: 'persona',
      entidadId: input.personaId,
      cambios: { email: input.email },
    })
  }
  return resultado
}

/** Llamado imperativamente desde app/erp/equipo/page.tsx (client component). */
export async function listarEstadoCuentasAction(): Promise<EstadoCuentaEmpleado[]> {
  return listarEstadoCuentasEmpleado()
}
