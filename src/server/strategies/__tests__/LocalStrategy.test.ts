import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocalStrategy } from '../LocalStrategy'

describe('LocalStrategy characterization', () => {
  let storageRoot: string
  let strategy: LocalStrategy

  beforeEach(async () => {
    storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agnostic-local-strategy-'))
    strategy = new LocalStrategy(storageRoot)
  })

  afterEach(async () => {
    await fs.rm(storageRoot, { recursive: true, force: true })
  })

  it('writes and reads a record in its namespace', async () => {
    const saved = await strategy.write('products', {
      id: 'product-1',
      data: { name: 'Desk', status: 'draft' },
    })

    expect(saved).toMatchObject({
      id: 'product-1',
      context: 'products',
      data: { name: 'Desk', status: 'draft' },
    })
    expect(saved.updated_at).toEqual(expect.any(String))
    await expect(strategy.read('products')).resolves.toEqual([saved])
  })

  it('merges timestamped fields independently and preserves untouched fields', async () => {
    await strategy.write('products', {
      id: 'product-1',
      data: { name: 'Desk', status: 'draft' },
      _meta: {
        name: '2026-01-01T00:00:00.000Z',
        status: '2026-01-01T00:00:00.000Z',
      },
    })

    const saved = await strategy.write('products', {
      id: 'product-1',
      data: { name: 'Stale name', status: 'published' },
      _meta: {
        name: '2025-12-31T23:59:59.000Z',
        status: '2026-01-02T00:00:00.000Z',
      },
    })

    expect(saved.data).toEqual({ name: 'Desk', status: 'published' })
    expect(saved._meta).toEqual({
      name: '2026-01-01T00:00:00.000Z',
      status: '2026-01-02T00:00:00.000Z',
    })
    await expect(strategy.read('products')).resolves.toEqual([saved])
  })

  it('removes only the requested record', async () => {
    await strategy.write('products', {
      id: 'product-1',
      data: { name: 'Desk' },
    })
    const retained = await strategy.write('products', {
      id: 'product-2',
      data: { name: 'Chair' },
    })

    await strategy.remove('products', 'product-1')

    await expect(strategy.read('products')).resolves.toEqual([retained])
  })

  it('returns an empty collection for a namespace that does not exist', async () => {
    await expect(strategy.read('missing_namespace')).resolves.toEqual([])
    await expect(strategy.getNamespaceSha('missing_namespace')).resolves.toBeNull()
  })

  it('preserves legacy empty reads but rejects missing namespaces strictly', async () => {
    await expect(strategy.read('missing_namespace')).resolves.toEqual([])
    await expect(strategy.readStrict('missing_namespace')).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('preserves legacy empty reads but rejects corrupted JSON strictly', async () => {
    const dbDirectory = path.join(storageRoot, 'db')
    await fs.mkdir(dbDirectory, { recursive: true })
    await fs.writeFile(path.join(dbDirectory, 'products.json'), '{broken', 'utf8')

    await expect(strategy.read('products')).resolves.toEqual([])
    await expect(strategy.readStrict('products')).rejects.toBeInstanceOf(SyntaxError)
  })
})
