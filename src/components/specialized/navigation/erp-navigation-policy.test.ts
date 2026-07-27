import { describe, expect, it } from 'vitest'
import { canAccess, resolveCapabilities } from './erp-navigation-policy'

describe('ERP navigation capabilities', () => {
  it('keeps production and finance decisions independent', () => {
    const production = resolveCapabilities('Producción', undefined)
    const finance = resolveCapabilities('Finanzas', undefined)

    expect(canAccess(production, 'production:view')).toBe(true)
    expect(canAccess(production, 'finance:view')).toBe(false)
    expect(canAccess(finance, 'finance:view')).toBe(true)
    expect(canAccess(finance, 'production:view')).toBe(false)
  })

  it('derives capabilities from metadata types and grants admin wildcard', () => {
    expect(canAccess(resolveCapabilities('usuario', ['Comercial']), 'commercial:view')).toBe(true)
    expect(canAccess(resolveCapabilities('admin', undefined), 'settings:view')).toBe(true)
  })

  it('does not grant internal capabilities to unknown or client roles', () => {
    expect(resolveCapabilities('cliente', undefined).size).toBe(0)
    expect(canAccess(resolveCapabilities('desconocido', undefined), 'projects:view')).toBe(false)
  })
})
