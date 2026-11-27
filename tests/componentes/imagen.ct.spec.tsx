// Pruebas de componentes del módulo de imágenes (t-200). Sin servidor ni base de datos.
// P0 (línea base): el picker antiguo solapa controles sobre las miniaturas.
// Verificación: el nuevo SlotImagen no solapa controles, tiene objetivos táctiles de 44 px,
// y persiste alt, pie y descripción.
import { test, expect } from '@playwright/experimental-ct-react'
import type { Locator } from '@playwright/test'
import { SlotHarness } from './harness/slot-harness'
import { PickerAntiguoHarness } from './harness/picker-antiguo-harness'

const VIEWPORTS = [
  { nombre: 'movil-360', width: 360, height: 800 },
  { nombre: 'tablet-768', width: 768, height: 1024 },
  { nombre: 'escritorio-1280', width: 1280, height: 900 },
] as const

const COLORES = ['#c8a16b', '#7fa3b8', '#9cb07a', '#c98b8b']
const svg = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="${color}"/></svg>`)}`
const FOTOS = COLORES.map(svg)

type Caja = { x: number; y: number; width: number; height: number }

/** Pares de elementos cuyas cajas se intersectan (solapamiento real, no tocarse por borde). */
async function paresSolapados(elementos: Locator[]): Promise<string[]> {
  const cajas = await Promise.all(elementos.map((el) => el.boundingBox()))
  const textos = await Promise.all(elementos.map((el) => el.evaluate((n: Element) => (n.textContent ?? n.getAttribute('aria-label') ?? '').trim().slice(0, 30))))
  const pares: string[] = []
  for (let i = 0; i < cajas.length; i++) {
    for (let j = i + 1; j < cajas.length; j++) {
      const a = cajas[i] as Caja | null
      const b = cajas[j] as Caja | null
      if (!a || !b) continue
      const seSolapan = a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1
      if (seSolapan) pares.push(`"${textos[i]}" ⟂ "${textos[j]}"`)
    }
  }
  return pares
}

test.describe('SlotImagen (diseño nuevo)', () => {
  for (const vp of VIEWPORTS) {
    test(`controles sin superposición y con objetivo táctil de 44 px en ${vp.nombre}`, async ({ mount, page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await mount(<SlotHarness valorInicial={FOTOS.map((url) => ({ url }))} />)
      await page.getByRole('button', { name: /^Foto 1/ }).click()

      // Botones de las miniaturas y del panel: ninguno debe solaparse con otro.
      const botones = await page.locator('button').all()
      const solapados = await paresSolapados(botones)
      console.log(`[${vp.nombre}] SlotImagen nuevo: ${botones.length} botones, solapamientos=${solapados.length}`)
      expect(solapados, 'botones solapados').toEqual([])

      // Objetivos táctiles: los controles del panel miden al menos 44 px de alto.
      for (const b of await page.locator('aside button').all()) {
        const caja = await b.boundingBox()
        expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44)
      }

      // Sin desborde horizontal.
      const { ancho, vista } = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, vista: window.innerWidth }))
      expect(ancho).toBeLessThanOrEqual(vista)

      await page.screenshot({ path: `test-results/componentes/slot-nuevo-${vp.nombre}.png`, fullPage: true })
    })
  }

  test('editar alt, pie y descripción persiste la forma completa', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await mount(<SlotHarness valorInicial={[{ url: FOTOS[0] }]} />)
    await page.getByRole('button', { name: /^Foto 1/ }).click()

    await page.getByLabel('Texto alternativo').fill('Frente de cocina')
    await page.getByLabel('Pie de foto').fill('Vista general')
    await page.getByLabel('Descripción').fill('Roble natural con tirador de acero')

    const valor = page.getByTestId('valor')
    await expect(valor).toContainText('"alt":"Frente de cocina"')
    await expect(valor).toContainText('"pie":"Vista general"')
    await expect(valor).toContainText('"descripcion":"Roble natural con tirador de acero"')
  })

  test('reordenar con teclado (Alt+flecha) cambia el orden persistido', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await mount(<SlotHarness valorInicial={FOTOS.slice(0, 3).map((url) => ({ url }))} />)
    const segunda = page.getByRole('button', { name: /^Foto 2/ })
    await segunda.focus()
    await page.keyboard.press('Alt+ArrowLeft')
    const urls = JSON.parse((await page.getByTestId('valor').textContent()) ?? '[]') as Array<{ url: string }>
    expect(urls[0].url).toBe(FOTOS[1])
  })

  test('quitar con Supr elimina la foto enfocada', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await mount(<SlotHarness valorInicial={FOTOS.slice(0, 2).map((url) => ({ url }))} />)
    await page.getByRole('button', { name: /^Foto 1/ }).focus()
    await page.keyboard.press('Delete')
    const urls = JSON.parse((await page.getByTestId('valor').textContent()) ?? '[]') as Array<{ url: string }>
    expect(urls.map((u) => u.url)).toEqual([FOTOS[1]])
  })
})

test.describe('ImagePicker antiguo (línea base P0)', () => {
  test('documenta los solapamientos de miniatura en 360 px', async ({ mount, page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await mount(<PickerAntiguoHarness valorInicial={FOTOS} />)
    const botones = await page.locator('button').all()
    const solapados = await paresSolapados(botones)
    await page.screenshot({ path: 'test-results/componentes/picker-antiguo-movil-360.png', fullPage: true })
    console.log(`[360] ImagePicker antiguo: ${botones.length} botones, solapamientos=${solapados.length}`)
    for (const p of solapados.slice(0, 6)) console.log('   ', p)
    // Línea base: este test DOCUMENTA el defecto que motivó t-200. Debe haber solapamientos.
    expect(solapados.length, 'solapamientos en el picker antiguo (línea base)').toBeGreaterThan(0)
  })
})
