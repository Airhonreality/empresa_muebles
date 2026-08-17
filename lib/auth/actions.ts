'use server'

// Server Action de logout del portal cliente (F-07). Separado de
// lib/auth/session.ts a propósito: un archivo 'use server' solo puede
// exportar funciones async (session.ts también exporta getSession(), que
// devuelve un objeto con métodos no serializables — no puede ser 'use server').
import { redirect } from 'next/navigation'
import {
  logout,
  logoutEmpleado,
  activarInvitacion,
  crearInvitacionEmpleado,
  listarEstadoCuentasEmpleado,
  type InvitacionResult,
  type EstadoCuentaEmpleado,
} from './session'
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

export async function activarInvitacionAction(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirmacion = String(formData.get('passwordConfirmacion') ?? '')
  if (password !== confirmacion) {
    redirect(`/erp/login/activar?token=${encodeURIComponent(token)}&error=password_no_coincide`)
  }
  const resultado = await activarInvitacion(token, password)
  if (!resultado.ok) {
    redirect(`/erp/login/activar?token=${encodeURIComponent(token)}&error=${resultado.error ?? 'token_invalido'}`)
  }
  redirect('/erp/comercial')
}

/** Llamado imperativamente desde app/erp/equipo/page.tsx (client component). */
export async function crearInvitacionEmpleadoAction(input: {
  personaId: string
  email: string
  rol: RolCanonico
  nombre: string
}): Promise<InvitacionResult> {
  return crearInvitacionEmpleado(input)
}

/** Llamado imperativamente desde app/erp/equipo/page.tsx (client component). */
export async function listarEstadoCuentasAction(): Promise<EstadoCuentaEmpleado[]> {
  return listarEstadoCuentasEmpleado()
}
