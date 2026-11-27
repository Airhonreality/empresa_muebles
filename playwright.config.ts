// Pruebas de diseño de pantallas con datos de prueba (DATA_IMPL=mock).
// Sin base de datos: el store vive en memoria con lib/data/fixtures.ts.
// Sesión: un usuario demo (admin@dev.local) que inicia sesión una vez en el proyecto `setup`.
// Correr: npx playwright test
import { defineConfig, devices } from '@playwright/test'

const PUERTO = 3100
const URL_BASE = `http://localhost:${PUERTO}`

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
  timeout: 60_000,
  use: {
    baseURL: URL_BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'diseno',
      testMatch: /.*\.diseno\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/sesion.json',
      },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PUERTO}`,
    url: `${URL_BASE}/erp/login`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      DATA_IMPL: 'mock',
    },
  },
})
