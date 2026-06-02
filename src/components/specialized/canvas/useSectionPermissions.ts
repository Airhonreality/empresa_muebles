import { useMateriaStore } from '@/lib/agnostic/store'
import { useMemo } from 'react'

export type SectionId = 'diseno' | 'cotizacion' | 'contrato' | 'pagos' | 'produccion' | 'entrega'

const DEFAULTS: Record<SectionId, string[]> = {
  diseno:     ['admin', 'comercial', 'disenador'],
  cotizacion: ['admin', 'comercial'],
  contrato:   ['admin', 'comercial'],
  pagos:      ['admin', 'comercial', 'gerencia'],
  produccion: ['admin', 'taller'],
  entrega:    ['admin', 'taller', 'comercial'],
}

export function useSectionPermissions(role: string = 'admin') {
  const materiaData = useMateriaStore(s => s.data)

  const sections = useMemo(() => {
    const configs = (materiaData['ai_config'] ?? []) as Array<{ data: Record<string, unknown> }>
    for (const c of configs) {
      if (c.data.canvas_sections) {
        return c.data.canvas_sections as Record<SectionId, string[]>
      }
    }
    return DEFAULTS
  }, [materiaData])

  return {
    canSee: (section: SectionId) => {
      const allowed = sections[section] ?? DEFAULTS[section] ?? ['admin']
      return allowed.includes(role)
    },
  }
}
