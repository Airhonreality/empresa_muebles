import { db, client } from '../lib/db/client'
import * as s from '../lib/db/schema'
import { ilike, or, eq, desc } from 'drizzle-orm'

async function main() {
  // Solo lectura: busca cotizaciones Eimy González por nombre de proyecto O por nombre de cliente.
  const proyectos = await db
    .select({
      id: s.proyectos.id,
      nombreProyecto: s.proyectos.nombreProyecto,
      estado: s.proyectos.estado,
      descripcionSemantica: s.proyectos.descripcionSemantica,
      updatedAt: s.proyectos.updatedAt,
      clienteNombre: s.clientes.nombre,
    })
    .from(s.proyectos)
    .leftJoin(s.clientes, eq(s.proyectos.clienteId, s.clientes.id))
    .where(or(ilike(s.proyectos.nombreProyecto, '%Eimy%'), ilike(s.clientes.nombre, '%Eimy%')))
    .orderBy(desc(s.proyectos.updatedAt))

  if (proyectos.length === 0) {
    console.log('NO_SE_ENCONTRO_NINGUNA_COTIZACION_PARA_EIMY')
    await client.end()
    process.exit(0)
  }

  for (const p of proyectos) {
    const espacios = await db
      .select({
        id: s.espacioVariantes.id,
        nombreEspacio: s.espacioVariantes.nombreEspacio,
        nombreVariante: s.espacioVariantes.nombreVariante,
        tipoEspacio: s.espacioVariantes.tipoEspacio,
        descripcion: s.espacioVariantes.descripcion,
        activa: s.espacioVariantes.activa,
        visibleEnPropuestaPublica: s.espacioVariantes.visibleEnPropuestaPublica,
        orden: s.espacioVariantes.orden,
        updatedAt: s.espacioVariantes.updatedAt,
      })
      .from(s.espacioVariantes)
      .where(eq(s.espacioVariantes.proyectoId, p.id))
      .orderBy(s.espacioVariantes.orden)

    console.log('\n=== COTIZACION ===')
    console.log(JSON.stringify(p, null, 2))
    console.log('=== ESPACIOS (' + espacios.length + ') ===')
    console.log(JSON.stringify(espacios, null, 2))
  }

  await client.end()
  process.exit(0)
}

main().catch(async (e) => {
  console.error('ERROR:', e)
  try { await client.end() } catch {}
  process.exit(1)
})