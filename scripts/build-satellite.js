#!/usr/bin/env node
/**
 * 🛰️ SATELLITE CSS BUILD SCRIPT
 * ===============================
 * Compila el CSS del satélite a storage/[tenant]/styles/compiled.css
 *
 * USAGE:
 *   node scripts/build-satellite.js [tenant]
 *   node scripts/build-satellite.js empresa_muebles
 *   node scripts/build-satellite.js              ← usa "default"
 *
 * DETECCIÓN AUTOMÁTICA DE ESTRATEGIA:
 *   Si storage/[tenant]/styles/tailwind.config.js existe
 *     → Compila con Tailwind CLI
 *   Si storage/[tenant]/styles/satellite.css existe
 *     → Copia tal cual a compiled.css (vanilla CSS / Bootstrap output)
 *   Si ninguno existe
 *     → Genera compiled.css vacío con comentario instructivo
 *
 * El Seed inyecta compiled.css como <link rel="stylesheet"> en cada page load.
 * Los módulos guest pueden usar las clases definidas aquí.
 *
 * DEPENDENCIAS OPCIONALES:
 *   Para compilar Tailwind: npm install -D tailwindcss postcss autoprefixer
 *   (en el directorio del proyecto, no del satélite)
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT   = path.join(__dirname, '..');
const tenant = process.argv[2] || 'default';
const siloStyles = path.join(ROOT, 'storage', tenant, 'styles');
const outputPath = path.join(siloStyles, 'compiled.css');

function log(msg)   { console.log(`\x1b[36m[satellite:build]\x1b[0m ${msg}`); }
function ok(msg)    { console.log(`\x1b[32m[satellite:build]\x1b[0m ${msg}`); }
function warn(msg)  { console.log(`\x1b[33m[satellite:build]\x1b[0m ${msg}`); }
function error(msg) { console.error(`\x1b[31m[satellite:build]\x1b[0m ${msg}`); }

// ─── Ensure output directory ─────────────────────────────────────────────────
fs.mkdirSync(siloStyles, { recursive: true });

// ─── Strategy A: Tailwind ────────────────────────────────────────────────────
const tailwindConfig = path.join(siloStyles, 'tailwind.config.js');
const satelliteEntry = path.join(siloStyles, 'satellite.css');

if (fs.existsSync(tailwindConfig)) {
  log(`Tenant "${tenant}" → Tailwind strategy detected`);

  // The satellite must have an entry CSS with @tailwind directives.
  if (!fs.existsSync(satelliteEntry)) {
    warn(`satellite.css not found — creating default entry file`);
    fs.writeFileSync(satelliteEntry, [
      '/* Satellite entry — add @import for fonts here */',
      '@tailwind base;',
      '@tailwind components;',
      '@tailwind utilities;',
    ].join('\n') + '\n');
  }

  try {
    execSync(
      `npx tailwindcss -c "${tailwindConfig}" -i "${satelliteEntry}" -o "${outputPath}" --minify`,
      { stdio: 'inherit', cwd: ROOT }
    );
    ok(`compiled.css generated via Tailwind → ${outputPath}`);
  } catch (e) {
    error('Tailwind compilation failed. Is tailwindcss installed? (npm install -D tailwindcss)');
    process.exit(1);
  }

// ─── Strategy B: Vanilla / pre-compiled CSS ──────────────────────────────────
} else if (fs.existsSync(satelliteEntry)) {
  log(`Tenant "${tenant}" → Vanilla CSS strategy detected`);
  fs.copyFileSync(satelliteEntry, outputPath);
  ok(`compiled.css copied → ${outputPath}`);

// ─── Strategy C: Empty (tokens-only satellite) ───────────────────────────────
} else {
  warn(`No satellite.css or tailwind.config.js found for tenant "${tenant}"`);
  warn(`Generating empty compiled.css. The satellite will use only tokens.css for styling.`);

  fs.writeFileSync(outputPath, [
    '/*',
    ' * SATELLITE COMPILED CSS — storage/' + tenant + '/styles/compiled.css',
    ' *',
    ' * Este satélite opera con solo token overrides (tokens.css).',
    ' * Para agregar clases propias del negocio:',
    ' *',
    ' *   OPCIÓN A — Tailwind propio:',
    ' *     1. Crea storage/' + tenant + '/styles/tailwind.config.js',
    ' *     2. Crea storage/' + tenant + '/styles/satellite.css con @tailwind directives',
    ' *     3. Ejecuta: node scripts/build-satellite.js ' + tenant,
    ' *',
    ' *   OPCIÓN B — CSS vanilla o Bootstrap output:',
    ' *     1. Crea storage/' + tenant + '/styles/satellite.css con tu CSS',
    ' *     2. Ejecuta: node scripts/build-satellite.js ' + tenant,
    ' *',
    ' * Los módulos guest (.js) pueden usar las clases definidas aquí.',
    ' */',
    '',
  ].join('\n'));

  ok(`Empty compiled.css created → ${outputPath}`);
}

log(`Done. Restart the dev server or trigger revalidation to see changes.`);
