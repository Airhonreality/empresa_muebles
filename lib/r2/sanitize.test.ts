// Test de la ley R2: sanitización de URLs de imagen (ley R2 + fallback temporal).
// Patrón node:assert manual del repo. NO importa lib/db/client, no requiere DATABASE_URL.
// Ejecutar: npx tsx lib/r2/sanitize.test.ts
import assert from 'node:assert/strict'
import {
  esUrlR2,
  esUrlEfimera,
  esUrlPermitida,
  sanitizarUrlIndividual,
  sanitizarUrlsFotos,
} from './sanitize'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

;(async () => {

await test('esUrlR2: reconoce dominios r2.dev públicos y endpoint cloudflarestorage', () => {
  assert.equal(esUrlR2('https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/cotizador/a.webp'), true)
  assert.equal(esUrlR2('https://veta-dorada.r2.cloudflarestorage.com/cotizador/a.webp'), true)
  assert.equal(esUrlR2('https://www.vetadeoro.co/cotizador/a.webp'), false)
  assert.equal(esUrlR2('blob:https://vetadeoro.co/xxx'), false)
})

await test('esUrlEfimera: detecta hosts que mueren solos (Vercel-preview, Notion S3)', () => {
  assert.equal(esUrlEfimera('https://empresa-muebles-vl37-git-dev-hgarciagonzalezsas-1694s-projects.vercel.app/906e.webp'), true)
  assert.equal(esUrlEfimera('https://prod-files-secure.s3.us-west-2.amazonaws.com/11c6e/a.webp'), true)
  assert.equal(esUrlEfimera('https://challengerco.vteximg.com.br/arquivos/a.jpg'), false)
  assert.equal(esUrlEfimera('https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/a.webp'), false)
})

await test('sanitizarUrlIndividual: rechaza blob:, /api/assets y efímeras', () => {
  assert.equal(sanitizarUrlIndividual('blob:https://vetadeoro.co/uuid'), null)
  assert.equal(sanitizarUrlIndividual('/api/assets/vento_console.png'), null)
  assert.equal(sanitizarUrlIndividual('https://empresa-muebles-XXX.vercel.app/a.webp'), null)
  assert.equal(sanitizarUrlIndividual('   https://madecentro.com/a.jpg  '), 'https://madecentro.com/a.jpg')
  assert.equal(sanitizarUrlIndividual('no-es-una-url'), null)
  assert.equal(sanitizarUrlIndividual(undefined), null)
})

await test('sanitizarUrlsFotos: modo fallback temporal conserva URLs http externas legítimas', () => {
  const resultado = sanitizarUrlsFotos([
    'https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/cotizador/a.webp',
    'blob:https://vetadeoro.co/uuid',
    '/api/assets/venta.png',
    'https://madecentro.com/a.jpg',
    'https://challengerco.vteximg.com.br/arquivos/1.jpg',
    '   ',
  ])
  assert.deepEqual(resultado, [
    'https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/cotizador/a.webp',
    'https://madecentro.com/a.jpg',
    'https://challengerco.vteximg.com.br/arquivos/1.jpg',
  ])
})

await test('sanitizarUrlsFotos: modo estricto (whitelist) solo conserva R2 — la ley real', () => {
  const resultado = sanitizarUrlsFotos([
    'https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/cotizador/a.webp',
    'https://madecentro.com/a.jpg',
    'blob:https://vetadeoro.co/uuid',
  ], { permitirExternas: false })
  assert.deepEqual(resultado, [
    'https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/cotizador/a.webp',
  ])
})

await test('sanitizarUrlsFotos: undefined -> undefined; array vacío -> []', () => {
  assert.equal(sanitizarUrlsFotos(undefined), undefined)
  assert.equal(sanitizarUrlsFotos(null), undefined)
  assert.deepEqual(sanitizarUrlsFotos([]), [])
})

await test('esUrlPermitida: whitelist solo acepta nuestro R2', () => {
  assert.equal(esUrlPermitida('https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev/x.png'), true)
  assert.equal(esUrlPermitida('https://veta-dorada.r2.cloudflarestorage.com/x.png'), true)
  assert.equal(esUrlPermitida('https://madecentro.com/x.png'), false)
})

console.log(`\n${pasadas} pruebas pasaron`)
})().catch((e) => { console.error(e); process.exit(1) })