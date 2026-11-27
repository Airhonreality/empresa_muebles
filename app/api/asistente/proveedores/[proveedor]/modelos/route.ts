import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { catalogoModelosHttp } from '@/lib/asistente/ruta'
import { depsCatalogo } from '@/lib/asistente/produccion'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ proveedor: string }> }) {
  const sesion = await requireSesionEmpleado()
  const { proveedor } = await params
  const r = await catalogoModelosHttp(sesion, proveedor, depsCatalogo)
  return NextResponse.json(r.body, { status: r.status })
}
