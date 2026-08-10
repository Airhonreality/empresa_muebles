'use server'

// Server Action de logout del portal cliente (F-07). Separado de
// lib/auth/session.ts a propósito: un archivo 'use server' solo puede
// exportar funciones async (session.ts también exporta getSession(), que
// devuelve un objeto con métodos no serializables — no puede ser 'use server').
import { redirect } from 'next/navigation'
import { logout } from './session'

export async function logoutAction(): Promise<void> {
  await logout()
  redirect('/cuenta/login')
}
