import { config } from 'dotenv';
config({ path: '.env.local' });

import { db, client } from '../lib/db/client';
import { proyectos, portfolioPublico } from '../lib/db/schema';

// ── Normalización (preview, no muta) ───────────────────────────────────────
// Reglas conservadoras: recortar, colapsar espacios, normalizar unicode.
// NO fuerza Title Case (lo reporta aparte para que el humano decida).
function normalizeBase(s: string): string {
  return s
    .replace(/ /g, ' ')            // nbsp → espacio normal
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripAccentsLower(s: string): string {
  return normalizeBase(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

type Issue = {
  id: string;
  table: string;
  field: string;
  current: string;
  proposed: string;
  reasons: string[];
};

async function inspect() {
  console.log('=== INSPECCIÓN SOLO LECTURA (no muta) ===\n');

  const pRows = await db.select({ id: proyectos.id, nombre: proyectos.nombreProyecto }).from(proyectos);
  const fRows = await db.select({ id: portfolioPublico.id, titulo: portfolioPublico.titulo, slug: portfolioPublico.slug }).from(portfolioPublico);

  console.log(`proyectos: ${pRows.length} filas | portfolioPublico: ${fRows.length} filas\n`);

  const issues: Issue[] = [];

  // ── proyectos.nombreProyecto ──
  const nameKeys = new Map<string, string[]>(); // clave normalizada → ids
  for (const r of pRows) {
    const cur = r.nombre;
    const prop = normalizeBase(cur);
    const reasons: string[] = [];
    if (cur !== prop) {
      if (cur !== cur.trim()) reasons.push('espacios extremos');
      if (/\s{2,}/.test(cur)) reasons.push('espacios dobles');
      if (cur.includes(' ')) reasons.push('nbsp/unicode');
      if (cur.normalize('NFC') !== cur) reasons.push('unicode');
      if (reasons.length === 0) reasons.push('cambio menor');
    }
    issues.push({ id: r.id, table: 'proyectos', field: 'nombreProyecto', current: cur, proposed: prop, reasons });
    const k = stripAccentsLower(prop);
    if (!nameKeys.has(k)) nameKeys.set(k, []);
    nameKeys.get(k)!.push(`${r.nombre} [${r.id.slice(0, 8)}]`);
  }

  // ── portfolioPublico.titulo ──
  const titleKeys = new Map<string, string[]>();
  for (const r of fRows) {
    const cur = r.titulo;
    const prop = normalizeBase(cur);
    const reasons: string[] = [];
    if (cur !== prop) {
      if (cur !== cur.trim()) reasons.push('espacios extremos');
      if (/\s{2,}/.test(cur)) reasons.push('espacios dobles');
      if (cur.includes(' ')) reasons.push('nbsp/unicode');
      if (reasons.length === 0) reasons.push('cambio menor');
    }
    issues.push({ id: r.id, table: 'portfolioPublico', field: 'titulo', current: cur, proposed: prop, reasons });
    const k = stripAccentsLower(prop);
    if (!titleKeys.has(k)) titleKeys.set(k, []);
    titleKeys.get(k)!.push(`${r.titulo} [${r.id.slice(0, 8)}]`);
  }

  // ── Reporte de cambios ──
  const changed = issues.filter(i => i.current !== i.proposed);
  console.log(`--- Filas que CAMBIARÍAN (${changed.length}) ---`);
  for (const i of changed) {
    console.log(`[${i.table}.${i.field}] ${i.id.slice(0, 8)}`);
    console.log(`   actual : ${JSON.stringify(i.current)}`);
    console.log(`   propuesto: ${JSON.stringify(i.proposed)}  (${i.reasons.join(', ')})`);
  }

  // ── Duplicados potenciales ──
  console.log('\n--- Duplicados por clave normalizada (sin acentos/minúsculas) ---');
  let dupCount = 0;
  for (const [k, vals] of nameKeys) {
    if (vals.length > 1) { dupCount++; console.log(`proyectos  "${k}": ${vals.join(' | ')}`); }
  }
  for (const [k, vals] of titleKeys) {
    if (vals.length > 1) { dupCount++; console.log(`portfolio  "${k}": ${vals.join(' | ')}`); }
  }
  if (dupCount === 0) console.log('(ninguno)');

  // ── Slugs que colisionarían si se re-generan ──
  const slugCounts = new Map<string, number>();
  for (const r of fRows) {
    const s = stripAccentsLower(r.titulo).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    slugCounts.set(s, (slugCounts.get(s) || 0) + 1);
  }
  const colliding = [...slugCounts.entries()].filter(([, n]) => n > 1);
  console.log('\n--- Slugs que colisionarían al re-generar desde título ---');
  console.log(colliding.length ? colliding.map(([s, n]) => `${s} ×${n}`).join('\n') : '(ninguno)');

  await client.end();
}

inspect().catch(e => { console.error(e); client.end(); process.exit(1); });
