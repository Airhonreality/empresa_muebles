import { config } from 'dotenv'; config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { proyectos, espacioVariantes, itemsVariante, contratos, leads } from '../lib/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

const normalizeKey = (s: string) =>
  s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

async function run() {
  const all = await db.select().from(proyectos);
  const groups = new Map<string, typeof all>();
  for (const r of all) {
    const k = normalizeKey(r.nombreProyecto);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  const dupGroups = [...groups.entries()].filter(([, rows]) => rows.length > 1);
  console.log(`=== GRUPOS DUPLICADOS POR NOMBRE (${dupGroups.length}) ===\n`);

  for (const [k, rows] of dupGroups) {
    console.log(`● "${rows[0].nombreProyecto}"  (${rows.length} filas)\n`);
    for (const r of rows) {
      const [ev] = await db.select({ n: sql<number>`count(*)` }).from(espacioVariantes).where(eq(espacioVariantes.proyectoId, r.id));
      const espacios = await db.select({ id: espacioVariantes.id }).from(espacioVariantes).where(eq(espacioVariantes.proyectoId, r.id));
      const espIds = espacios.map(e => e.id);
      const [it] = espIds.length
        ? await db.select({ n: sql<number>`count(*)` }).from(itemsVariante).where(inArray(itemsVariante.varianteId, espIds))
        : [{ n: 0 }];
      const [co] = await db.select({ n: sql<number>`count(*)` }).from(contratos).where(eq(contratos.proyectoId, r.id));
      const [le] = await db.select({ n: sql<number>`count(*)` }).from(leads).where(eq(leads.proyectoId, r.id));
      console.log(`  id=${r.id.slice(0, 8)}  cliente=${r.clienteId ? r.clienteId.slice(0, 8) : '∅'}  dir=${r.direccionObra || '∅'}`);
      console.log(`     espacios=${Number(ev.n)}  items=${Number(it.n)}  contratos=${Number(co.n)}  leads=${Number(le.n)}  creado=${r.createdAt}`);
    }
    console.log('');
  }
  await client.end();
}
run().catch(e => { console.error(e); client.end(); process.exit(1); });
