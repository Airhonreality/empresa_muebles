'use server'

// Server Action de logout del portal cliente (F-07). Separado de
// lib/auth/session.ts a propósito: un archivo 'use server' solo puede
// exportar funciones async (session.ts también exporta getSession(), que
// devuelve un objeto con métodos no serializables — no puede ser 'use server').
import { redirect } from 'next/navigation'
import {
  logout,
  loginEmpleado,
  logoutEmpleado,
  activarInvitacion,
  crearInvitacionEmpleado,
  listarEstadoCuentasEmpleado,
  type AuthResult,
  type InvitacionResult,
  type EstadoCuentaEmpleado,
} from './session'
import type { RolCanonico } from '@/lib/data/contracts'

export async function logoutAction(): Promise<void> {
  await logout()
  redirect('/cuenta/login')
}

// ── Login interno del ERP (D-08b, F10 2026-08-15) ──

export async function loginEmpleadoAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const resultado = await loginEmpleado(email, password)
  if (!resultado.ok) {
    redirect(`/erp/login?error=${resultado.error ?? 'credenciales_invalidas'}`)
  }
  redirect('/erp/comercial')
}

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

export type { AuthResult }
