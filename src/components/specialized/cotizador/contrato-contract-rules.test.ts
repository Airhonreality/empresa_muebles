import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()

function readUtf8(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

describe('contract inclusion rules', () => {
  it('keeps hidden spaces out of the contract UI and avoids variant suffixes', () => {
    const source = readUtf8('src/components/specialized/cotizador/ContratoModal.tsx')

    expect(source).toContain('visible_pdf !== false')
    expect(source).not.toContain('nombre_variante')
  })

  it('keeps hidden spaces out of the contract and production zaps', () => {
    const scripts = JSON.parse(readUtf8('storage/db/scripts.json')) as Array<{
      data?: { name?: string; code?: string }
      name?: string
    }>

    const contractZap = scripts.find((script) => (script.data?.name ?? script.name) === 'generar_contrato')
    const productionZap = scripts.find((script) => (script.data?.name ?? script.name) === 'zap_activar_produccion')

    expect(contractZap?.data?.code).toContain('visible_pdf !== false')
    expect(productionZap?.data?.code).toContain('visible_pdf !== false')
    expect(contractZap?.data?.code).not.toContain('nombre_variante')
  })
})
