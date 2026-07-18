import { describe, expect, it } from 'vitest'
import { toContractZapRecord } from './contrato-payload'

describe('toContractZapRecord', () => {
  it('preserves the Vault id when unwrapping a record', () => {
    expect(toContractZapRecord({
      id: 'project-1',
      context: 'proyectos',
      data: { nombre_proyecto: 'Cocina' }
    })).toEqual({
      id: 'project-1',
      nombre_proyecto: 'Cocina'
    })
  })

  it('accepts an already flat record', () => {
    expect(toContractZapRecord({
      id: 'project-2',
      nombre_proyecto: 'Closet'
    })).toEqual({
      id: 'project-2',
      nombre_proyecto: 'Closet'
    })
  })

  it('returns null for an absent record', () => {
    expect(toContractZapRecord(null)).toBeNull()
  })
})
