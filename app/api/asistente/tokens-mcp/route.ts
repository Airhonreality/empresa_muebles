import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { crearTokenHttp, listarTokensHttp, revocarTokenHttp } from '@/lib/mcp/gestion'
import { depsTokensMcp } from '@/lib/mcp/produccion'

// Tokens MCP del usuario de la sesión. Nunca devuelve tokens de otros usuarios: el dueño sale de la
// sesión, no de la petición. El token en claro solo aparece en la respuesta del POST.
export const dynamic = 'force-dynamic'

const SIN_CACHE = { 'Cache-Control': 'no-store' }

export async function GET() {
  const sesion = await requireSesionEmpleado()
  const r = await listarTokensHttp(sesion, depsTokensMcp)
  return NextResponse.json(r.body, { status: r.status, headers: SIN_CACHE })
}

export async function POST(request: Request) {
  const sesion = await requireSesionEmpleado()
  const cuerpo = await request.json().catch(() => null)
  const r = await crearTokenHttp(sesion, cuerpo, depsTokensMcp)
  return NextResponse.json(r.body, { status: r.status, headers: SIN_CACHE })
}

export async function DELETE(request: Request) {
  const sesion = await requireSesionEmpleado()
  const id = new URL(request.url).searchParams.get('id')
  const r = await revocarTokenHttp(sesion, id, depsTokensMcp)
  return NextResponse.json(r.body, { status: r.status, headers: SIN_CACHE })
}
