// Gate de ruta para /erp/** (D-08b, F10 2026-08-15). Antes de esto no existía
// ningún middleware.ts: cualquiera con la URL del preview tenía acceso de
// facto al ERP. Corre en Edge runtime — no toca la base de datos, solo
// desella la cookie de sesión (unsealData de iron-session, misma password
// que erpSessionOptions en lib/auth/session.ts) para confirmar que hay un
// usuarioId válido.
import { NextResponse, type NextRequest } from 'next/server'
import { unsealData } from 'iron-session'

const SESSION_SECRET = process.env.SESSION_SECRET
const ERP_COOKIE_NAME = 'veta_erp_session'

interface ErpSessionShape {
  usuarioId: string | null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/erp/login' || pathname.startsWith('/erp/login/')) {
    return NextResponse.next()
  }

  if (!SESSION_SECRET) {
    // Mismo patrón "sin fallback" que lib/auth/session.ts: si falta el secreto,
    // no se abre la puerta por accidente — se bloquea todo /erp/**.
    return NextResponse.redirect(new URL('/erp/login', request.url))
  }

  const cookie = request.cookies.get(ERP_COOKIE_NAME)?.value
  if (!cookie) {
    return NextResponse.redirect(new URL('/erp/login', request.url))
  }

  try {
    const session = await unsealData<ErpSessionShape>(cookie, { password: SESSION_SECRET })
    if (!session.usuarioId) {
      return NextResponse.redirect(new URL('/erp/login', request.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/erp/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/erp/:path*'],
}
