import { db, client } from '../lib/db/client'
import * as s from '../lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// Aplicación aprobada por Supervisor (2026-09-18): normalizar descripciones Eimy González
// (formato lista + ortografía) + borrar espacio 7 (vacío, nombre "-"). Todo en UNA transacción.
const PROYECTO_ID = 'fed5d841-694d-445e-b370-31036bcb00ea'
const ESPACIO_A_BORRAR = '8822aa5e-8386-4ed4-a1ca-e766ec94aa5b'

const CAMBIOS: { id: string; descripcion: string }[] = [
  {
    id: 'cace9129-90c3-439b-a08c-9102784b0c76',
    descripcion:
      '- Mueble inferior con condimentero, torre de 3 cajones con un organizador de cubiertos, módulo de basuras con caneca.\n' +
      '- Mueble superior con 4 puertas de apertura superior independientes e iluminación LED cálida.\n' +
      '- Bar con puerta de vidrio bronce con iluminación LED.\n' +
      '- Torre escobillero.\n' +
      '- Zona de lavandería con puerta corrediza y mueble inferior de lavadora con patas en aluminio.\n' +
      '- Mesones en piedra sinterizada con salpicadero en piedra sinterizada.'
  },
  {
    id: '6f7c100b-b54a-4692-8fb4-7da82fee0107',
    descripcion:
      '- Estudio con escritorio con gavetas superiores.\n' +
      '- División en vidrio templado con marco de aluminio.\n' +
      '- Iluminación LED.'
  },
  {
    id: 'da57b5f3-a567-47b2-92c1-5c5d1f5f3885',
    descripcion:
      '- Closet con puertas batientes, 6 cajones y 4 zapateras.\n' +
      '- Incluye fondo melamínico (no muro).'
  },
  {
    id: '7e0522b9-e6ad-405a-98a6-618e8183d0f5',
    descripcion:
      '- Se cotiza la opción 2.\n' +
      '- Mueble inferior en melamina RH con mesón en piedra sinterizada (igual a cocina), mueble superior con puertas espejo y repisas con iluminación LED.\n' +
      '- División de ducha en vidrio templado batiente.\n' +
      '- El cliente suministra poceta y grifería.'
  },
  {
    id: '559b33a7-533c-4d2c-9fec-6f64dd45e105',
    descripcion:
      '- Centro de entretenimiento, con módulo rotativo, repisa fija intermedia y mueble inferior con puertas corredizas.\n' +
      '- Tocador integral contiguo con espejo de doble cara fijo y marco en madera.\n' +
      '- Iluminación LED en zona del tocador.'
  },
  {
    id: 'ec499e04-b2f0-44b0-81b7-014a0a0c4f89',
    descripcion:
      '- Mueble de cama, con 2 mesas de noche con 3 cajones y gimnasio para gatos incluido (según diseño).'
  }
]

async function main() {
  const ids = CAMBIOS.map(c => c.id)
  const antes = await db.select().from(s.espacioVariantes).where(inArray(s.espacioVariantes.id, [...ids, ESPACIO_A_BORRAR]))
  const antesProyecto = await db.select().from(s.proyectos).where(eq(s.proyectos.id, PROYECTO_ID))

  mkdirSync('scripts/backups', { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = join('scripts/backups', `eimy-gonzalez-${ts}.json`)
  writeFileSync(backup, JSON.stringify({ antes, antesProyecto, aplicado: ts }, null, 2))
  console.log('SNAPSHOT:', backup)

  await db.transaction(async (tx) => {
    for (const c of CAMBIOS) {
      await tx.update(s.espacioVariantes).set({ descripcion: c.descripcion }).where(eq(s.espacioVariantes.id, c.id))
    }
    await tx.update(s.espacioVariantes)
      .set({ nombreEspacio: 'Centro TV' })
      .where(eq(s.espacioVariantes.id, '559b33a7-533c-4d2c-9fec-6f64dd45e105'))
    await tx.delete(s.espacioVariantes).where(eq(s.espacioVariantes.id, ESPACIO_A_BORRAR))
    await tx.update(s.proyectos)
      .set({ descripcionSemantica: 'Proyecto integral' })
      .where(eq(s.proyectos.id, PROYECTO_ID))
  })

  const despues = await db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, PROYECTO_ID)).orderBy(s.espacioVariantes.orden)
  const despuesProyecto = await db.select().from(s.proyectos).where(eq(s.proyectos.id, PROYECTO_ID))
  console.log('APLICADO. Espacios restantes:', despues.length)
  for (const e of despues) {
    console.log('- [' + e.orden + '] ' + e.nombreEspacio + ' :: ' + JSON.stringify(e.descripcion))
  }
  console.log('descripcionSemantica:', despuesProyecto[0].descripcionSemantica)

  await client.end()
  process.exit(0)
}
main().catch(async (e) => { console.error('ERROR:', e); try { await client.end() } catch {}; process.exit(1) })