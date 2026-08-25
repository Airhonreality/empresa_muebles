import { config } from 'dotenv'; config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { proyectos } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = 'scripts/backups';

function normalizeBase(s: string): string {
  return s.replace(/ /g, ' ').normalize('NFC').replace(/\s+/g, ' ').trim();
}

async function run() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const all = await db.select({ id: proyectos.id, nombre: proyectos.nombreProyecto }).from(proyectos);

  const changes: { id: string; current: string; proposed: string }[] = [];
  for (const r of all) {
    const prop = normalizeBase(r.nombre);
    if (r.nombre !== prop) changes.push({ id: r.id, current: r.nombre, proposed: prop });
  }

  console.log(`=== NORMALIZA ESPACIOS proyectos.nombreProyecto (${APPLY ? 'APLICANDO' : 'DRY-RUN'}) ===`);
  console.log(`Filas a cambiar: ${changes.length}\n`);
  for (const c of changes) {
    console.log(`  ${c.id.slice(0, 8)}: ${JSON.stringify(c.current)} -> ${JSON.stringify(c.proposed)}`);
  }

  if (!APPLY) {
    const f = `${BACKUP_DIR}/proyecto-names-backup-${Date.now()}.json`;
    writeFileSync(f, JSON.stringify(changes, null, 2));
    console.log(`\nDRY-RUN: backup en ${f}. Re-ejecuta con --apply.`);
    await client.end();
    return;
  }

  const f = `${BACKUP_DIR}/proyecto-names-backup-${Date.now()}.json`;
  writeFileSync(f, JSON.stringify(changes, null, 2));
  console.log(`\nBackup en ${f}`);

  await db.transaction(async (tx) => {
    for (const c of changes) {
      await tx.update(proyectos).set({ nombreProyecto: c.proposed, updatedAt: sql`now()` }).where(eq(proyectos.id, c.id));
    }
  });

  const [n] = await db.select({ n: sql<number>`count(*)` }).from(proyectos)
    .where(sql`nombre_proyecto <> ${'x'.normalize('NFC')}`); // placeholder
  console.log(`Hecho. ${changes.length} nombres normalizados.`);
  await client.end();
}
run().catch(e => { console.error(e); client.end(); process.exit(1); });
