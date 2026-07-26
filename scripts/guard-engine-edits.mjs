#!/usr/bin/env node
/**
 * guard-engine-edits.mjs — pre-commit boundary guard for FORKS.
 * ──────────────────────────────────────────────────────────────
 * Turns "don't edit engine files" from a convention into a check. If a commit
 * in a fork stages a file that is NOT fork-owned (no merge=ours in .gitattributes),
 * it warns and points to the right extension point — because editing engine files
 * reintroduces sync conflicts (or, worse, gets frozen with merge=ours and silently
 * misses engine fixes).
 *
 * Safe by design:
 *  - Only runs in a FORK (a repo with an `upstream`/`seed` remote). The seed edits
 *    engine files legitimately, so the guard is a no-op there.
 *  - Skips during a merge (sync commits legitimately bring engine changes).
 *  - Default mode is WARN (exit 0). Set AGNOSTIC_GUARD_STRICT=1 to BLOCK (exit 1).
 *  - Bypass a strict block once with AGNOSTIC_ALLOW_ENGINE_EDIT=1.
 *
 * Classification is delegated to `git check-attr`, so it always matches the real
 * merge behaviour (incl. escaped globs like src/app/[[]...slug[]]/page.tsx).
 */
import { execSync } from 'node:child_process';

const C = { dim: '\x1b[90m', red: '\x1b[31m', yellow: '\x1b[33m', green: '\x1b[32m', cyan: '\x1b[36m', reset: '\x1b[0m' };
const git = (args, opts = {}) => execSync(`git ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
const tryGit = (args) => { try { return git(args); } catch { return ''; } };

// 1. Skip during a merge (sync brings engine changes legitimately).
if (tryGit('rev-parse -q --verify MERGE_HEAD')) process.exit(0);

// 2. Only guard forks. The seed (no upstream/seed remote) edits engine freely.
const remotes = tryGit('remote').split('\n').map(r => r.trim());
if (!remotes.includes('upstream') && !remotes.includes('seed')) process.exit(0);

// 3. Staged files (added/copied/modified).
const staged = tryGit('diff --cached --name-only --diff-filter=ACM').split('\n').filter(Boolean);
if (staged.length === 0) process.exit(0);

// 4. Which staged files are engine (not merge=ours)?
let attr = '';
try {
  attr = execSync('git check-attr --stdin merge', { input: staged.join('\n'), encoding: 'utf8' }).trim();
} catch { process.exit(0); }
const ours = new Set();
for (const line of attr.split('\n')) {
  const m = line.match(/^(.*): merge: ours$/);
  if (m) ours.add(m[1]);
}
const engineEdits = staged.filter(f => !ours.has(f));
if (engineEdits.length === 0) process.exit(0);

// 5. Report.
const strict = process.env.AGNOSTIC_GUARD_STRICT === '1';
const bypass = process.env.AGNOSTIC_ALLOW_ENGINE_EDIT === '1';

console.error(`\n${C.yellow}⚠ Guardián de frontera — este commit toca archivos de ENGINE en un fork:${C.reset}`);
for (const f of engineEdits) console.error(`  ${C.red}•${C.reset} ${f}`);
console.error(`${C.dim}
Editar engine reintroduce conflictos en el upstream. Usa la capa de extensión:
  · marca / SEO / GA / favicon   → configuracion_comercial (datos)
  · pixels / GTM / meta / JSON-LD→ storage/site-injections.json
  · colores / radios / fuentes   → design_tokens  (tokens.css)
  · @font-face / temas / CSS libre→ storage/styles/custom.css
  · rutas protegidas / públicas  → agnostic.routing.ts (o env AGNOSTIC_*_PATHS)
  · páginas bespoke              → src/app/<ruta>/page.tsx (rutas explícitas)
Si el archivo es 100% del fork, protégelo con merge=ours en .gitattributes.
${C.reset}`);

if (strict && !bypass) {
  console.error(`${C.red}✗ Bloqueado (AGNOSTIC_GUARD_STRICT=1). Para forzar este commit: AGNOSTIC_ALLOW_ENGINE_EDIT=1 git commit ...${C.reset}\n`);
  process.exit(1);
}
console.error(`${C.dim}(modo aviso — el commit continúa. Para bloquear: AGNOSTIC_GUARD_STRICT=1)${C.reset}\n`);
process.exit(0);
