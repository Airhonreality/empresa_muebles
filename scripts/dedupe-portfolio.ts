import { config } from 'dotenv';
config({ path: '.env.local' });

import { db, client } from '../lib/db/client';
import { portfolioPublico, imagenesPortfolio } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = 'scripts/backups';

const normalizeKey = (s: string) =>
  s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

async function run() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const all = await db.select().from(portfolioPublico);
  const groups = new Map<string, typeof all>();
  for (const r of all) {
    const k = normalizeKey(r.titulo);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  const plan: { title: string; keepId: string; deleteIds: string[] }[] = [];
  const backup: any[] = [];

  for (const [k, rows] of groups) {
    if (rows.length <= 1) continue;

    // Contar imágenes por fila para elegir la que más tiene
    const counts = await Promise.all(rows.map(async (r) => {
      const [c] = await db.select({ n: sql<number>`count(*)` })
        .from(imagenesPortfolio).where(eq(imagenesPortfolio.portfolioId, r.id));
      return { id: r.id, n: Number(c.n) };
    }));

    rows.sort((a, b) => {
      const ca = counts.find(c => c.id === a.id)!.n;
      const cb = counts.find(c => c.id === b.id)!.n;
      if (cb !== ca) return cb - ca;           // más imágenes primero
      return a.createdAt.localeCompare(b.createdAt); // más antigua primero
    });

    const keep = rows[0];
    const del = rows.slice(1);
    plan.push({ title: k, keepId: keep.id, deleteIds: del.map(d => d.id) });

    for (const d of del) {
      const imgs = await db.select().from(imagenesPortfolio).where(eq(imagenesPortfolio.portfolioId, d.id));
      backup.push({ portfolio: d, images: imgs });
    }
  }

  console.log(`=== DEDUPE portfolioPublico (${APPLY ? 'APLICANDO' : 'DRY-RUN'}) ===`);
  console.log(`Grupos duplicados: ${plan.length}\n`);
  for (const p of plan) {
    console.log(`Título: "${p.title}"`);
    console.log(`  CONSERVO: ${p.keepId.slice(0, 8)}`);
    console.log(`  BORRO   : ${p.deleteIds.map(i => i.slice(0, 8)).join(', ')}`);
  }
  const totalDel = plan.reduce((s, p) => s + p.deleteIds.length, 0);
  console.log(`\nTotal filas a borrar: ${totalDel}`);

  if (!APPLY) {
    const f = `${BACKUP_DIR}/portfolio-dedupe-backup-${Date.now()}.json`;
    writeFileSync(f, JSON.stringify(backup, null, 2));
    console.log(`\nDRY-RUN: no se borró nada. Backup de lo que se borraría en: ${f}`);
    console.log('Re-ejecuta con --apply para confirmar.');
    await client.end();
    return;
  }

  // ── Aplicar en transacción ──
  const backupFile = `${BACKUP_DIR}/portfolio-dedupe-backup-${Date.now()}.json`;
  writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\nBackup escrito en ${backupFile}`);

  await db.transaction(async (tx) => {
    for (const p of plan) {
      for (const id of p.deleteIds) {
        await tx.delete(imagenesPortfolio).where(eq(imagenesPortfolio.portfolioId, id));
        await tx.delete(portfolioPublico).where(eq(portfolioPublico.id, id));
      }
    }
  });

  const [remaining] = await db.select({ n: sql<number>`count(*)` }).from(portfolioPublico);
  console.log(`Hecho. Filas restantes en portfolioPublico: ${remaining.n}`);
  await client.end();
}

run().catch(e => { console.error(e); client.end(); process.exit(1); });
