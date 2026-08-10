'use server'

// Server Action del login del portal cliente (F-07). Envuelve login() de
// lib/auth/session.ts — la única pieza que toca la cookie de sesión.
import { redirect } from 'next/navigation'
import { login } from '@/lib/auth/session'

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '')
  const documento = String(formData.get('documento') ?? '')

  const result = await login(email, documento)

  if (!result.ok) {
    redirect('/cuenta/login?error=1')
  }

  // Índice del portal cliente: lo define la pantalla de negocio F-07
  // (otro agente). Placeholder de convención hasta que exista.
  redirect('/cuenta')
}
