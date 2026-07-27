import { describe, expect, it } from 'vitest'
import { isRouteAuthorized } from './route-authorization'

describe('isRouteAuthorized', () => {
  it('allows routes without access restrictions', () => {
    expect(isRouteAuthorized({ role: 'cliente' }, {})).toBe(true)
  })

  it('matches normalized roles and metadata lists', () => {
    expect(isRouteAuthorized({ role: 'Producción' }, { allowed_lists: ['produccion'] })).toBe(true)
    expect(
      isRouteAuthorized(
        { role: 'usuario', metadata: { type: ['Finanzas'] } },
        { allowed_lists: ['finanzas'] },
      ),
    ).toBe(true)
  })

  it('always grants administrators and rejects unrelated roles', () => {
    expect(isRouteAuthorized({ role: 'Administrador' }, { allowed_lists: ['finanzas'] })).toBe(true)
    expect(isRouteAuthorized({ role: 'comercial' }, { allowed_lists: ['finanzas'] })).toBe(false)
  })
})
