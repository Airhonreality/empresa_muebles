'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { vaultWrite } from '@/lib/agnostic/vault-client'
import { useMateriaStore } from '@/lib/agnostic/store'
import type { EspacioVariantesRecord } from '@/generated/agnostic-schemas'
import type { ConfirmConfig } from '../ConfirmActionDialog'

interface PhaseQuotingProps {
  cotizacionId: string
  espacios: EspacioVariantesRecord[]
  isCurrentPhase: boolean
  onRefresh: () => void
  onRequestConfirm: (config: ConfirmConfig) => void
  zapBusy: string | null
}

export default function PhaseQuoting({
  cotizacionId, espacios, isCurrentPhase, onRefresh, onRequestConfirm, zapBusy,
}: PhaseQuotingProps) {
  const [newNombre, setNewNombre]     = useState('')
  const [newVariante, setNewVariante] = useState('Premium')
  const [adding, setAdding]           = useState(false)

  const handleAdd = async () => {
    if (!newNombre) { toast.error('Escribe el nombre del espacio.'); return }
    setAdding(true)
    try {
      const saved = await vaultWrite('espacio_variantes', undefined, {
        cotizacion_id: cotizacionId,
        nombre_espacio: newNombre, nombre_variante: newVariante, activa: true,
        jornadas_desarrollo_tecnico: 1, jornadas_ensamblaje_taller: 2, jornadas_instalacion_obra: 2,
      })
      useMateriaStore.getState().updateItem('espacio_variantes', saved)
      setNewNombre(''); toast.success('Ambiente creado.'); onRefresh()
    } catch { toast.error('Error al crear el espacio.') }
    finally { setAdding(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold">Lienzo de Cotización Comercial</h2>
          <p className="text-xs text-muted-foreground">Configura los espacios del mobiliario y gestiona las jornadas estimadas.</p>
        </div>
        {isCurrentPhase && (
          <Button size="sm" disabled={!!zapBusy} onClick={() => onRequestConfirm({
            title: 'Aprobar y Congelar Cotización',
            description: '¿Deseas congelar esta propuesta comercial? Se generará un snapshot inmutable y no podrás modificar los precios.',
            zap: 'aprobar_cotizacion',
            payload: { cotizacion_id: cotizacionId },
          })}>
            ✦ Congelar Propuesta
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ambientes Cotizados</h4>
            <Button variant="outline" size="sm"
              className="text-xs h-7 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
              onClick={() => window.open(`/app/quoting/${cotizacionId}`, '_blank')}>
              <ExternalLink size={12} className="mr-1" /> Ficha de Cotización Directa
            </Button>
          </div>

          {espacios.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground bg-muted/5">
              No hay ambientes cotizados. Crea uno rápido o abre la ficha completa.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
              {espacios.map(e => (
                <div key={e.id} className="rounded-lg border p-3 bg-card shadow-sm flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold truncate">{e.data.nombre_espacio as string}</h5>
                    {e.data.nombre_variante && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Variante: <span className="font-semibold text-primary">{e.data.nombre_variante as string}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground shrink-0 bg-muted/30 px-2 py-1 rounded-md border font-mono">
                    <span>Téc: {e.data.jornadas_desarrollo_tecnico as number}j</span>
                    <span>Ens: {e.data.jornadas_ensamblaje_taller as number}j</span>
                    <span>Inst: {e.data.jornadas_instalacion_obra as number}j</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-4 bg-muted/5 flex flex-col gap-3.5 h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Crear Ambiente Rápido</h4>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium">Nombre del Espacio</Label>
            <Input value={newNombre} onChange={e => setNewNombre(e.target.value)} placeholder="Ej: Cocina Abierta..." className="h-8 text-xs" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium">Línea de Variante</Label>
            <select value={newVariante} onChange={e => setNewVariante(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs font-semibold focus:outline-none">
              <option value="Standard">Standard (Melamina)</option>
              <option value="Premium">Premium (Lacados / Maderas)</option>
              <option value="Luxury">Luxury (Maderas macizas)</option>
            </select>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={adding || !newNombre} className="w-full h-8 text-xs font-bold gap-1 mt-1">
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus size={13} />} Crear Ambiente
          </Button>
        </div>
      </div>
    </div>
  )
}
