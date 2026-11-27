// Setup de sesión demo (DATA_IMPL=mock). Inicia sesión una vez y guarda el estado en disco.
// Credenciales demo de lib/auth/session.ts — solo existen en modo mock, nunca en producción.
import { test as setup, expect } from '@playwright/test'

const SESION = '.playwright/sesion.json'

setup('iniciar sesión demo', async ({ page }) => {
  await page.goto('/erp/login')
  await page.getByLabel('Email').fill('admin@dev.local')
  await page.getByLabel('Contraseña').fill('dev-local')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL((url) => url.pathname.startsWith('/erp') && !url.pathname.startsWith('/erp/login'))
  await expect(page).not.toHaveURL(/\/erp\/login/)
  await page.context().storageState({ path: SESION })
})
