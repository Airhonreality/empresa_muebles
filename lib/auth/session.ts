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
// getDataStore() solo sirve para DATA_IMPL=mock (lanza si es drizzle) — para
// drizzle, login() consulta clientes directo con Drizzle acá abajo.
import { getDataStore } from '@/lib/data/store'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
// contracts.ts es solo tipos (sin React) — importarlo acá no arrastra el
// mismo problema de "use client" que lib/data/index.ts.
import type { RolCanonico } from '@/lib/data/contracts'
import { hashPassword, verifyPassword } from './hash'

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

  let cliente: { id: string } | undefined

  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    // DATA_IMPL=drizzle: consulta directa (login corre server-only, no hay boundary de navegador
    // que evitar acá) — getDataStore() no sirve para drizzle, ver comentario de arriba.
    const { db } = await import('@/lib/db/client')
    const { clientes } = await import('@/lib/db/schema')
    const candidatos = await db.select().from(clientes).where(eq(clientes.documento, documentoNorm))
    cliente = candidatos.find((c) => c.email?.trim().toLowerCase() === emailNorm)
  } else {
    const store = getDataStore()
    cliente = store.clientes
      .listar()
      .find((c) => c.email?.trim().toLowerCase() === emailNorm && c.documento?.trim() === documentoNorm)
  }

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

// ─────────────────────────────────────────────────────────────────────────
// Login interno del ERP (D-08b, F10 2026-08-15). Cookie separada de la del
// portal cliente a propósito — dos superficies de acceso externo distintas
// (empleado vs cliente), mismo principio que diseno_perfil_persona_proveedor_
// login_interno.md ya señaló para no mezclar identidades en una sola sesión.
// nombre/email/rol viajan denormalizados en la cookie cifrada: evita una
// query a `usuarios` en cada hidratación de página (fetchSnapshotAction corre
// en el layout raíz, para todo el sitio, no solo /erp). Trade-off aceptado:
// si a alguien le cambian el rol, su sesión queda desactualizada hasta el
// próximo login — mitigado con maxAge de 7 días en vez de sesión indefinida.
// ─────────────────────────────────────────────────────────────────────────

export interface ErpSessionData {
  usuarioId: string | null
  personaId: string | null
  nombre: string | null
  email: string | null
  rol: RolCanonico | null
}

const ERP_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

export const erpSessionOptions: SessionOptions = {
  cookieName: 'veta_erp_session',
  password: SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: ERP_SESSION_MAX_AGE,
  },
}

export async function getErpSession() {
  const cookieStore = await cookies()
  const session = await getIronSession<ErpSessionData>(cookieStore, erpSessionOptions)
  if (session.usuarioId === undefined) session.usuarioId = null
  if (session.personaId === undefined) session.personaId = null
  if (session.nombre === undefined) session.nombre = null
  if (session.email === undefined) session.email = null
  if (session.rol === undefined) session.rol = null
  return session
}

/** Forma narrowed de ErpSessionData con la sesión ya confirmada como presente (usuarioId/rol no-null). */
export interface SesionEmpleado {
  usuarioId: string
  personaId: string | null
  nombre: string
  email: string
  rol: RolCanonico
}

/** Identidad real del empleado logueado, o null. Sin llamada a DB — lee solo la cookie. */
export async function requireSesionEmpleado(): Promise<SesionEmpleado | null> {
  const session = await getErpSession()
  if (!session.usuarioId || !session.rol) return null
  return {
    usuarioId: session.usuarioId,
    personaId: session.personaId,
    nombre: session.nombre ?? '',
    email: session.email ?? '',
    rol: session.rol,
  }
}

export interface AuthResult {
  ok: boolean
  error?:
    | 'credenciales_invalidas'
    | 'usuario_no_encontrado'
    | 'password_incorrecta'
    | 'error_sistema'
    | 'token_invalido'
    | 'token_vencido'
    | 'email_en_uso'
    | 'password_corta'
}

interface UsuarioEmpleadoRow {
  id: string
  email: string
  passwordHash: string | null
  rolEmpleado: RolCanonico | null
  personaId: string | null
  nombre: string
  activo: boolean
  inviteToken: string | null
  inviteTokenExpiraEn: string | null
}

// Store en memoria para DATA_IMPL=mock (dev local sin Neon) — nunca se agrega
// a mock-store.ts/DataStore a propósito: ese store también vive en el
// navegador cuando DATA_IMPL=mock, y no debe llevar passwordHash con él. Vive
// solo server-side acá, igual que login()/clientes ya hace para el mock.
let mockUsuariosEmpleado: UsuarioEmpleadoRow[] | null = null

/** Credenciales demo para probar el flujo completo sin Neon: admin@dev.local / dev-local */
async function getMockUsuariosEmpleado(): Promise<UsuarioEmpleadoRow[]> {
  if (!mockUsuariosEmpleado) {
    mockUsuariosEmpleado = [
      {
        id: 'mock-admin-empleado',
        email: 'admin@dev.local',
        passwordHash: await hashPassword('dev-local'),
        rolEmpleado: 'admin',
        personaId: null,
        nombre: 'Javier García (mock)',
        activo: true,
        inviteToken: null,
        inviteTokenExpiraEn: null,
      },
    ]
  }
  return mockUsuariosEmpleado
}

/**
 * Login de empleado: email + contraseña contra `usuarios` (tipo='empleado', activo=true).
 *
 * Cada rama de fallo devuelve un `error` distinto y deja un log server-side
 * correspondiente (visible en Runtime Logs de Vercel) — antes todo caía en
 * 'credenciales_invalidas' sin rastro, indistinguible de una caída real de
 * infraestructura (ej. Neon inalcanzable) desde afuera. Pedido explícito de
 * Javier tras un login que fallaba en silencio total (2026-08-17).
 */
export async function loginEmpleado(email: string, password: string): Promise<AuthResult> {
  const emailNorm = email.trim().toLowerCase()
  if (!emailNorm || !password) return { ok: false, error: 'credenciales_invalidas' }

  let usuario: UsuarioEmpleadoRow | undefined

  try {
    if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
      const { db } = await import('@/lib/db/client')
      const { usuarios } = await import('@/lib/db/schema')
      const candidatos = await db.select().from(usuarios).where(eq(usuarios.email, emailNorm))
      usuario = candidatos.find((u) => u.tipo === 'empleado' && u.activo) as UsuarioEmpleadoRow | undefined
    } else {
      const lista = await getMockUsuariosEmpleado()
      usuario = lista.find((u) => u.email.toLowerCase() === emailNorm && u.activo)
    }
  } catch (err) {
    console.error(`[loginEmpleado] error de sistema consultando usuario (${emailNorm}):`, err)
    return { ok: false, error: 'error_sistema' }
  }

  if (!usuario || !usuario.passwordHash) {
    console.warn(`[loginEmpleado] usuario no encontrado, inactivo o sin contraseña configurada: ${emailNorm}`)
    return { ok: false, error: 'usuario_no_encontrado' }
  }

  let valido: boolean
  try {
    valido = await verifyPassword(password, usuario.passwordHash)
  } catch (err) {
    console.error(`[loginEmpleado] error de sistema verificando contraseña (${emailNorm}):`, err)
    return { ok: false, error: 'error_sistema' }
  }
  if (!valido) {
    console.warn(`[loginEmpleado] contraseña incorrecta: ${emailNorm}`)
    return { ok: false, error: 'password_incorrecta' }
  }

  try {
    const session = await getErpSession()
    session.usuarioId = usuario.id
    session.personaId = usuario.personaId
    session.nombre = usuario.nombre
    session.email = usuario.email
    session.rol = usuario.rolEmpleado ?? 'admin'
    await session.save()
  } catch (err) {
    console.error(`[loginEmpleado] error de sistema guardando la sesión (${emailNorm}):`, err)
    return { ok: false, error: 'error_sistema' }
  }

  console.log(`[loginEmpleado] login exitoso: ${emailNorm}`)
  return { ok: true }
}

/** Destruye la sesión de empleado actual. Solo desde Server Action/Route Handler. */
export async function logoutEmpleado(): Promise<void> {
  const session = await getErpSession()
  session.destroy()
}

export interface InvitacionResult {
  ok: boolean
  token?: string
  error?: 'email_en_uso'
}

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 días

/**
 * Crea o actualiza la cuenta de acceso de un empleado, siempre keyed por
 * `personaId` (no por email — F10 2026-08-17, corrige el bug donde corregir
 * el email de una persona dejaba huérfana la fila vieja en `usuarios` porque
 * el lookup anterior era por email). Sirve tanto para "Generar acceso"
 * (primera vez) como para "Editar acceso" (cuenta ya activa: el nuevo enlace
 * de invitación actualiza el email; la contraseña vieja sigue funcionando
 * hasta que se use el enlace nuevo, así nadie queda bloqueado a mitad de
 * camino). Devuelve el token — el link completo
 * (`${origin}/erp/login/activar?token=...`) se arma en el cliente.
 */
export async function crearInvitacionEmpleado(input: {
  personaId: string
  email: string
  rol: RolCanonico
  nombre: string
}): Promise<InvitacionResult> {
  const emailNorm = input.email.trim().toLowerCase()
  const token = randomBytes(24).toString('hex')
  const expiraEn = new Date(Date.now() + INVITE_TOKEN_TTL_MS).toISOString()

  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    const { db } = await import('@/lib/db/client')
    const { usuarios } = await import('@/lib/db/schema')
    const [propia] = await db.select().from(usuarios).where(eq(usuarios.personaId, input.personaId))
    const [otroConEseEmail] = await db.select().from(usuarios).where(eq(usuarios.email, emailNorm))
    if (otroConEseEmail && otroConEseEmail.personaId !== input.personaId) {
      return { ok: false, error: 'email_en_uso' }
    }
    if (propia) {
      await db
        .update(usuarios)
        .set({
          email: emailNorm,
          inviteToken: token,
          inviteTokenExpiraEn: expiraEn,
          rolEmpleado: input.rol,
          nombre: input.nombre,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(usuarios.id, propia.id))
    } else {
      await db.insert(usuarios).values({
        email: emailNorm,
        passwordHash: null,
        tipo: 'empleado',
        rolEmpleado: input.rol,
        personaId: input.personaId,
        nombre: input.nombre,
        activo: false,
        inviteToken: token,
        inviteTokenExpiraEn: expiraEn,
      })
    }
  } else {
    const lista = await getMockUsuariosEmpleado()
    const propia = lista.find((u) => u.personaId === input.personaId)
    const otroConEseEmail = lista.find((u) => u.email.toLowerCase() === emailNorm)
    if (otroConEseEmail && otroConEseEmail.personaId !== input.personaId) {
      return { ok: false, error: 'email_en_uso' }
    }
    if (propia) {
      propia.email = emailNorm
      propia.inviteToken = token
      propia.inviteTokenExpiraEn = expiraEn
      propia.rolEmpleado = input.rol
      propia.nombre = input.nombre
    } else {
      lista.push({
        id: randomBytes(8).toString('hex'),
        email: emailNorm,
        passwordHash: null,
        rolEmpleado: input.rol,
        personaId: input.personaId,
        nombre: input.nombre,
        activo: false,
        inviteToken: token,
        inviteTokenExpiraEn: expiraEn,
      })
    }
  }

  return { ok: true, token }
}

/** Activa una invitación: valida el token, guarda la contraseña elegida e inicia sesión. */
export async function activarInvitacion(token: string, password: string): Promise<AuthResult> {
  const tokenNorm = token.trim()
  if (!tokenNorm) return { ok: false, error: 'token_invalido' }
  if (!password || password.length < 8) return { ok: false, error: 'password_corta' }

  const passwordHash = await hashPassword(password)

  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    const { db } = await import('@/lib/db/client')
    const { usuarios } = await import('@/lib/db/schema')
    const candidatos = await db.select().from(usuarios).where(eq(usuarios.inviteToken, tokenNorm))
    const usuario = candidatos[0]
    if (!usuario) return { ok: false, error: 'token_invalido' }
    if (!usuario.inviteTokenExpiraEn || new Date(usuario.inviteTokenExpiraEn) < new Date()) {
      return { ok: false, error: 'token_vencido' }
    }

    await db
      .update(usuarios)
      .set({
        passwordHash,
        activo: true,
        inviteToken: null,
        inviteTokenExpiraEn: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usuarios.id, usuario.id))

    const session = await getErpSession()
    session.usuarioId = usuario.id
    session.personaId = usuario.personaId
    session.nombre = usuario.nombre
    session.email = usuario.email
    session.rol = (usuario.rolEmpleado ?? 'admin') as RolCanonico
    await session.save()
    return { ok: true }
  } else {
    const lista = await getMockUsuariosEmpleado()
    const usuario = lista.find((u) => u.inviteToken === tokenNorm)
    if (!usuario) return { ok: false, error: 'token_invalido' }
    if (!usuario.inviteTokenExpiraEn || new Date(usuario.inviteTokenExpiraEn) < new Date()) {
      return { ok: false, error: 'token_vencido' }
    }
    usuario.passwordHash = passwordHash
    usuario.activo = true
    usuario.inviteToken = null
    usuario.inviteTokenExpiraEn = null

    const session = await getErpSession()
    session.usuarioId = usuario.id
    session.personaId = usuario.personaId
    session.nombre = usuario.nombre
    session.email = usuario.email
    session.rol = usuario.rolEmpleado ?? 'admin'
    await session.save()
    return { ok: true }
  }
}

export interface EstadoCuentaEmpleado {
  personaId: string
  email: string
  activo: boolean
  inviteTokenExpiraEn: string | null
}

/** Estado de cuenta por persona, saneado (nunca passwordHash ni el token en crudo). */
export async function listarEstadoCuentasEmpleado(): Promise<EstadoCuentaEmpleado[]> {
  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    const { db } = await import('@/lib/db/client')
    const { usuarios } = await import('@/lib/db/schema')
    const filas = await db.select().from(usuarios)
    return filas
      .filter((u) => u.tipo === 'empleado' && u.personaId)
      .map((u) => ({
        personaId: u.personaId as string,
        email: u.email,
        activo: u.activo,
        inviteTokenExpiraEn: u.inviteTokenExpiraEn,
      }))
  } else {
    const lista = await getMockUsuariosEmpleado()
    return lista
      .filter((u) => u.personaId)
      .map((u) => ({
        personaId: u.personaId as string,
        email: u.email,
        activo: u.activo,
        inviteTokenExpiraEn: u.inviteTokenExpiraEn,
      }))
  }
}
