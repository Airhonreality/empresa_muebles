// Infraestructura de sesión del portal cliente (F-07, disenio_F07_portal_cliente.md).
// Cookie cifrada sin estado en servidor (iron-session) — decisión de Supervisor
// 2026-08-09: la sesión NO depende del eje mock/Drizzle (a diferencia de los
// datos) y sobrevive la migración F10-E sin reescribirse.
//
// Este módulo vive en lib/auth/, no en app/: puede usar getDataStore() directo
// (no el hook useDataStore(), que requiere React) sin violar la regla de
// "no getDataStore() en app/".
import { cookies } from 'next/headers'
import { getIronSession, type SessionOptions } from 'iron-session'
// Importa desde lib/data/store (no lib/data/index) a propósito: index.ts
// también define useDataStore() (hook de React), y Next marca cualquier
// archivo que lo toque como "necesita 'use client'" apenas se lo importa
// desde una cadena server-only como esta. Ver comentario en lib/data/store.ts.
import { getDataStore } from '@/lib/data/store'

// Sin fallback a propósito (mismo patrón que DATABASE_URL en lib/db/client.ts,
// ver AGENTS.md): si falta SESSION_SECRET, la app falla fuerte al importar
// este módulo en vez de firmar sesiones con un valor adivinable.
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET no definida en el entorno (requiere .env.local con un valor aleatorio largo, ej. `openssl rand -base64 32`).'
  )
}

/** Mínimo indispensable en la cookie — sin datos sensibles del cliente. */
export interface SessionData {
  clienteId: string | null
}

export const sessionOptions: SessionOptions = {
  cookieName: 'veta_cliente_session',
  password: SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

/**
 * Sesión iron-session actual. Lectura válida en Server Components; para
 * mutar (save()/destroy()) hay que llamarla desde un Server Action o Route
 * Handler — restricción de cookies() de next/headers en App Router.
 */
export async function getSession() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (session.clienteId === undefined) {
    session.clienteId = null
  }
  return session
}

export interface LoginResult {
  ok: boolean
  clienteId?: string
}

/**
 * Login del portal cliente: email + documento contra lib/data
 * (getDataStore().clientes.listar()). Comparación simple sin hash —
 * prototipo de acceso, no producción real; Cliente no tiene campo de
 * contraseña y esta función no le agrega uno.
 */
export async function login(email: string, documento: string): Promise<LoginResult> {
  const emailNorm = email.trim().toLowerCase()
  const documentoNorm = documento.trim()
  if (!emailNorm || !documentoNorm) {
    return { ok: false }
  }

  const store = getDataStore()
  const cliente = store.clientes
    .listar()
    .find((c) => c.email?.trim().toLowerCase() === emailNorm && c.documento?.trim() === documentoNorm)

  if (!cliente) {
    return { ok: false }
  }

  const session = await getSession()
  session.clienteId = cliente.id
  await session.save()
  return { ok: true, clienteId: cliente.id }
}

/** Destruye la sesión actual (borra la cookie). Solo desde Server Action/Route Handler. */
export async function logout(): Promise<void> {
  const session = await getSession()
  session.destroy()
}

/**
 * Guard reutilizable para páginas de /cuenta/**. Cada página lo llama al
 * inicio y decide cómo redirigir con redirect() de next/navigation si
 * retorna null. A propósito no hay middleware global — más simple de leer
 * y de usar bien para quien construya cada pantalla de F-07.
 *
 * Uso:
 *   const clienteId = await requireSesionCliente()
 *   if (!clienteId) redirect('/cuenta/login')
 */
export async function requireSesionCliente(): Promise<string | null> {
  const session = await getSession()
  return session.clienteId
}
