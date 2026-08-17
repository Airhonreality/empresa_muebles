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

/**
 * A propósito NO llama a redirect(): se comprobó con un navegador real
 * (Playwright, 2026-08-17) que la transición cliente de Next.js tras un
 * redirect() lanzado dentro de esta Server Action nunca completaba al cruzar
 * hacia /erp/comercial (layout con fetchSnapshotAction, ~50 queries en
 * paralelo) -- el POST de datos llegaba bien (200) pero la URL nunca cambiaba,
 * dejando el botón de submit trabado en "Ingresando..." para siempre. Esta
 * acción ahora solo devuelve el resultado; ErpLoginForm (useActionState) hace
 * la navegación con window.location.href en el cliente al ver ok:true.
 * Firma (prevState, formData) => es la que exige useActionState().
 */
export async function loginEmpleadoAction(_prevState: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  try {
    return await loginEmpleado(email, password)
  } catch (err) {
    // Red de seguridad: loginEmpleado() ya captura sus propios fallos de DB/sesión
    // y devuelve error_sistema — esto solo cubre algo verdaderamente inesperado.
    console.error('[loginEmpleadoAction] error inesperado no capturado en loginEmpleado:', err)
    return { ok: false, error: 'error_sistema' }
  }
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
