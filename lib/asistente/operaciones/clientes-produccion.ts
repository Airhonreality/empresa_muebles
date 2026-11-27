// lib/asistente/operaciones/clientes-produccion.ts
// Adaptador Drizzle de los clientes para el asistente (búsqueda y alta). Ningún otro archivo del
// asistente toca la tabla clientes.
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { PuertoClientes } from '../ops/clientes'

export const clientesDb: PuertoClientes = {
  async listar() {
    return db
      .select({ id: s.clientes.id, nombre: s.clientes.nombre, documento: s.clientes.documento, telefono: s.clientes.telefono })
      .from(s.clientes)
  },
  async porDocumento(documento) {
    const [f] = await db.select({ id: s.clientes.id }).from(s.clientes).where(eq(s.clientes.documento, documento)).limit(1)
    return f ?? null
  },
  async crear(datos) {
    const [f] = await db
      .insert(s.clientes)
      .values({
        nombre: datos.nombre,
        documento: datos.documento ?? null,
        telefono: datos.telefono ?? null,
        email: datos.email ?? null,
        domicilio: datos.domicilio ?? null,
      })
      .returning({ id: s.clientes.id })
    return f.id
  },
}
