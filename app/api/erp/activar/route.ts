import { NextResponse } from 'next/server'
import { activarInvitacion } from '@/lib/auth/session'
import { registrarAuditLog } from '@/lib/auth/audit'

/**
 * Route Handler plano (JSON) para activar una invitación de empleado — mismo
 * patrón que app/api/erp/login/route.ts: el POST vía Server Action nativo
 * (form action={...}) devolvía 400 en el edge de Vercel (mismo mecanismo de
 * streaming `text/x-component` ya diagnosticado y corregido para el login).
 * Reportado por Javier el 2026-08-17 probando /erp/login/activar en preview.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const passwordConfirmacion = typeof body?.passwordConfirmacion === 'string' ? body.passwordConfirmacion : ''

  if (password !== passwordConfirmacion) {
    return NextResponse.json({ ok: false, error: 'password_no_coincide' })
  }

  try {
    const resultado = await activarInvitacion(token, password)
    if (resultado.ok) {
      await registrarAuditLog({ accion: 'acceso.activar', entidadTipo: 'usuario' })
    }
    return NextResponse.json(resultado)
  } catch (err) {
    console.error('[POST /api/erp/activar] error inesperado no capturado en activarInvitacion:', err)
    return NextResponse.json({ ok: false, error: 'error_sistema' }, { status: 500 })
  }
}
