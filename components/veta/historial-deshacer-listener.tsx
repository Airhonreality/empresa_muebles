'use client'
// Atajo global de Ctrl+Z (t-179): deshace la última acción YA CONFIRMADA en la DB (crear/editar/
// eliminar un ítem). Solo actúa cuando el foco NO está dentro de un campo editable -- si estás
// escribiendo, Ctrl+Z debe deshacer lo que estás tecleando (ver t-177, `useUndoHistorial` en
// MoneyInput/NumberInput, y el undo nativo del navegador en el resto de los inputs), nunca saltar
// por encima a deshacer una acción guardada sin que el usuario lo busque.
import { useEffect } from 'react'
import { deshacerUltimaAccion } from '@/lib/data/queries/historial-deshacer'
import { useToast } from '@/components/veta/toast-provider'

function focoEnCampoEditable(): boolean {
  const el = typeof document === 'undefined' ? null : document.activeElement
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable
}

export function HistorialDeshacerListener({ proyectoId }: { proyectoId: string }) {
  const { mostrarInfo, mostrarError } = useToast()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod || e.shiftKey || e.key.toLowerCase() !== 'z') return
      if (focoEnCampoEditable()) return
      e.preventDefault()
      deshacerUltimaAccion(proyectoId)
        .then((descripcion) => {
          if (descripcion) mostrarInfo(`Deshecho: ${descripcion}`)
        })
        .catch((err) => {
          mostrarError(err instanceof Error ? err.message : 'No se pudo deshacer la última acción. Revisa tu conexión e intenta de nuevo.')
        })
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [proyectoId, mostrarInfo, mostrarError])

  return null
}
