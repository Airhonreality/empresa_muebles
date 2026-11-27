// Prueba de humo de diseño: la pantalla del cotizador carga con datos de prueba y no
// desborda horizontalmente en móvil, tablet ni escritorio.
import { test, expect } from '@playwright/test'

// proj01 = 'Cocina Márquez — Integral' en lib/data/fixtures.ts (id = 'mock-proj01')
const RUTA = '/erp/cotizador/mock-proj01'

const VIEWPORTS = [
  { nombre: 'movil-360', width: 360, height: 800 },
  { nombre: 'tablet-768', width: 768, height: 1024 },
  { nombre: 'escritorio-1280', width: 1280, height: 900 },
] as const

for (const vp of VIEWPORTS) {
  test(`cotizador carga sin desbordar en ${vp.nombre}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    const respuesta = await page.goto(RUTA)
    expect(respuesta?.status(), 'respuesta HTTP').toBeLessThan(400)

    // Sin pantalla de error de Next ni de la aplicación.
    await expect(page.getByText('Application error')).toHaveCount(0)
    await expect(page.getByText('Algo salió mal')).toHaveCount(0)

    // Contenido real: el proyecto de fixture aparece y no queda el estado de carga.
    await expect(page.getByText('Cargando cotización')).toHaveCount(0, { timeout: 20_000 })
    await expect(page.getByText('Cocina Márquez').first()).toBeVisible({ timeout: 20_000 })

    // Sin scroll horizontal: el ancho del documento no supera el viewport.
    const { ancho, vista } = await page.evaluate(() => ({
      ancho: document.documentElement.scrollWidth,
      vista: window.innerWidth,
    }))
    expect(ancho, 'scrollWidth vs viewport').toBeLessThanOrEqual(vista)

    await page.screenshot({ path: `test-results/cotizador-${vp.nombre}.png`, fullPage: true })
  })
}
