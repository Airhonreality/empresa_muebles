'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/veta/button'
import { InputField } from '@/components/veta/input-field'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type Proyecto } from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

interface ProyectoRapidoModalProps {
  open: boolean
  onClose: () => void
  onSaved?: (proyecto: Proyecto) => void
}

/** Alta mínima de proyecto desde un selector (t-181). Solo el nombre es obligatorio;
 *  cliente, dirección y el resto se completan después en el proyecto. */
export function ProyectoRapidoModal({ open, onClose, onSaved }: ProyectoRapidoModalProps) {
  const store = useDataStore()
  const { guard, isPending } = usePendingGuard()
  const [nombreProyecto, setNombreProyecto] = useState('')
  const [direccionObra, setDireccionObra] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNombreProyecto('')
    setDireccionObra('')
    setError(null)
  }, [open])

  const handleSubmit = useCallback(() => {
    void guard(async () => {
      setError(null)
      if (!nombreProyecto.trim()) {
        setError('El nombre del proyecto es obligatorio.')
        return
      }
      try {
        const proyecto = await store.proyectos.crear({
          nombreProyecto: nombreProyecto.trim(),
          direccionObra: direccionObra.trim() || null,
          tipoProyecto: 'personalizado',
          estado: 'activa',
        })
        onSaved?.(proyecto)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo crear el proyecto.')
      }
    })
  }, [nombreProyecto, direccionObra, store, onSaved, onClose, guard])

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proyecto">
      <div className="space-y-4">
        <InputField
          label="Nombre del proyecto"
          value={nombreProyecto}
          onChange={(e) => setNombreProyecto(e.target.value)}
          placeholder="Ej. Cocina integral Roble"
        />
        <InputField
          label="Dirección de obra (opcional)"
          value={direccionObra}
          onChange={(e) => setDireccionObra(e.target.value)}
          placeholder="Ej. Cra 15 #123-45, Bogotá"
        />
        <p className="text-xs text-text-muted">
          El cliente y los demás datos se completan después desde el proyecto.
        </p>

        {error && (
          <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="primary" size="md" loading={isPending} onClick={handleSubmit}>
            Crear proyecto
          </Button>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
