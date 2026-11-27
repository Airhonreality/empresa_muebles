// Pruebas de componentes aislados (sin Next, sin base de datos, sin sesión).
// Correr: npx playwright test -c playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-react'
import path from 'node:path'

const RAIZ = path.resolve(__dirname)

export default defineConfig({
  testDir: './tests/componentes',
  snapshotDir: './tests/componentes/__snapshots__',
  outputDir: './test-results/componentes',
  timeout: 60_000,
  use: {
    ctPort: 3200,
    ctViteConfig: {
      resolve: {
        alias: [
          // La subida real a R2 usa el SDK del servidor: en pruebas de componentes se reemplaza por un stub.
          { find: '@/lib/r2/upload', replacement: path.join(RAIZ, 'tests/componentes/stubs/r2-upload.ts') },
          { find: /^@\//, replacement: `${RAIZ}/` },
        ],
      },
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
