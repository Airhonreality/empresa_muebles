import { NextResponse } from 'next/server'
import { loginEmpleado } from '@/lib/auth/session'

/**
 * Route Handler plano (JSON) para el login del ERP — no Server Action.
 *
 * Se comprobó con Vercel Runtime Logs + un navegador real (Playwright) que el
 * login vía Server Action SIEMPRE completaba del lado del servidor en <1s
 * ("[loginEmpleado] login exitoso" en cada intento), pero el navegador nunca
 * recibía/procesaba esa respuesta -- se corta en el mecanismo de streaming
 * `text/x-component` que usa Next.js para las Server Actions sobre el edge de
 * Vercel (net::ERR_ABORTED del lado del cliente en cada intento, servidor
 * limpio en cada uno). Un endpoint JSON normal evita ese mecanismo por
 * completo. Hallazgo de Javier (2026-08-17), diagnosticado en la misma sesión.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  try {
    const resultado = await loginEmpleado(email, password)
    return NextResponse.json(resultado)
  } catch (err) {
    console.error('[POST /api/erp/login] error inesperado no capturado en loginEmpleado:', err)
    return NextResponse.json({ ok: false, error: 'error_sistema' }, { status: 500 })
  }
}
