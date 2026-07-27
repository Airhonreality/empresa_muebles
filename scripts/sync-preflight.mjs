#!/usr/bin/env node
/**
 * sync-preflight.mjs — drift report before an engine sync.
 * ─────────────────────────────────────────────────────────
 * Lists ENGINE files a fork modified since it last synced. These are the files
 * that will conflict on the next `git merge upstream/<branch>` and, worse, the
 * ones a fork might silently freeze with merge=ours and stop receiving engine
 * fixes on. "Fork-owned" is decided by git itself (files carrying merge=ours in
 * .gitattributes), so the classification always matches the real merge behaviour.
 *
 * Read-only. Never writes, never merges. Exit 0 always (informational).
 *
 * Usage: node scripts/sync-preflight.mjs [upstreamRef]
 *   upstreamRef defaults to upstream/<current-branch>, then seed/<branch>, main.
 */
import { execSync } from 'node:child_process';

function git(args, opts = {}) {
  return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
}
function tryGit(args) { try { return git(args); } catch { return ''; } }

const C = { dim: '\x1b[90m', red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m', cyan: '\x1b[36m', reset: '\x1b[0m' };

function resolveUpstream() {
  if (process.argv[2]) return process.argv[2];
  const branch = tryGit('rev-parse --abbrev-ref HEAD') || 'main';
  for (const ref of [`upstream/${branch}`, `seed/${branch}`, 'upstream/main', 'seed/main']) {
    if (tryGit(`rev-parse --verify --quiet ${ref}`)) return ref;
  }
  return '';
}

const upstream = resolveUpstream();
if (!upstream) {
  console.log(`${C.yellow}[preflight] No hay remote upstream/seed configurado — nada que comparar.${C.reset}`);
  process.exit(0);
}

const base = tryGit(`merge-base ${upstream} HEAD`);
if (!base) {
  console.log(`${C.yellow}[preflight] No hay ancestro común con ${upstream} (¿fetch pendiente?).${C.reset}`);
  process.exit(0);
}

// A file only conflicts if BOTH sides changed it since the base. Intersect the
// seed's changes with the fork's changes → the real conflict candidate set.
const seedChanged = new Set(tryGit(`diff --name-only ${base} ${upstream}`).split('\n').filter(Boolean));
const forkChanged = tryGit(`diff --name-only ${base} HEAD`).split('\n').filter(Boolean);
const bothChanged = forkChanged.filter(f => seedChanged.has(f));

console.log(`\n${C.cyan}── Sync preflight vs ${upstream} (base ${base.slice(0, 8)}) ──${C.reset}`);
console.log(`${C.dim}Cambios: fork ${forkChanged.length} · seed ${seedChanged.size} · ambos ${bothChanged.length}${C.reset}`);

if (bothChanged.length === 0) {
  console.log(`${C.green}✓ Ningún archivo tocado por ambos lados. El sync no debería conflictuar.${C.reset}\n`);
  process.exit(0);
}

// Of the files both sides changed, which are protected (merge=ours) vs engine?
let attr = '';
try {
  attr = execSync('git check-attr --stdin merge', { input: bothChanged.join('\n'), encoding: 'utf8' }).trim();
} catch { /* empty → treat all as engine (conservative) */ }
const ours = new Set();
for (const line of attr.split('\n')) {
  const m = line.match(/^(.*): merge: ours$/);
  if (m) ours.add(m[1]);
}

const protectedBoth = bothChanged.filter(f => ours.has(f));
const engineDrift = bothChanged.filter(f => !ours.has(f));

if (engineDrift.length === 0) {
  console.log(`${C.green}✓ Los ${protectedBoth.length} archivos en común están protegidos (merge=ours). Cero conflicto esperado.${C.reset}\n`);
  process.exit(0);
}

console.log(`\n${C.red}⚠ Engine tocado por ambos lados (${engineDrift.length}) — VA A CONFLICTUAR / drift:${C.reset}`);
for (const f of engineDrift) console.log(`  ${C.red}•${C.reset} ${f}`);
console.log(`${C.dim}  → Mueve la personalización a una capa de extensión (configuracion_comercial,`);
console.log(`     design_tokens, custom.css, site-injections.json, env) y deja el archivo == seed;`);
console.log(`     o si es 100% del fork, protégelo con merge=ours en .gitattributes.${C.reset}`);
if (protectedBoth.length > 0) {
  console.log(`${C.dim}(${protectedBoth.length} en común ya protegidos por merge=ours — OK.)${C.reset}`);
}
console.log('');
process.exit(0);
