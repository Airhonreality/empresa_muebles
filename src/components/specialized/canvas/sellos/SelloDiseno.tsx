'use client'
import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SmartImageInput } from '@/components/ui/SmartImageInput'
import { Check, Lock, ChevronDown, ChevronUp, Camera, Ruler, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import type { ApoyoTecnicoRecord } from '@/generated/agnostic-schemas'

export type SelloStatus = 'active' | 'completed' | 'locked'

async function vaultWrite(namespace: string, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { data } }),
  })
  if (!res.ok) throw new Error(await res.text())
}

interface SelloDisenoProps {
  status: SelloStatus
  expanded: boolean
  onToggle: () => void
  cotizacionId: string
  apoyo: ApoyoTecnicoRecord[]
  onRefresh: () => void
}

export default function SelloDiseno({ status, expanded, onToggle, cotizacionId, apoyo, onRefresh }: SelloDisenoProps) {
  const [newFotoUrl, setNewFotoUrl]         = useState('')
  const [newDiagramaUrl, setNewDiagramaUrl] = useState('')
  const [saving, setSaving]                 = useState(false)

  const fotos     = apoyo.filter(r => r.data.tipo_recurso === 'foto')
  const diagramas = apoyo.filter(r => r.data.tipo_recurso === 'diagrama')
  const visitas   = apoyo.filter(r => r.data.tipo_recurso === 'visita')

  const addRecurso = useCallback(async (tipo: 'foto' | 'diagrama', imageUrl: string) => {
    if (!imageUrl) return
    setSaving(true)
    try {
      await vaultWrite('apoyo_tecnico', { cotizacion_id: cotizacionId, tipo_recurso: tipo, imagen_url: imageUrl })
      if (tipo === 'foto') setNewFotoUrl(''); else setNewDiagramaUrl('')
      onRefresh()
    } catch { toast.error('Error al guardar.') }
    finally { setSaving(false) }
  }, [cotizacionId, onRefresh])

  const fechaVisita = visitas[0]?.data.fecha_visita

  return (
    <div className={[
      'border rounded-lg overflow-hidden',
      status === 'active'    && 'border-primary/60 bg-primary/[0.03]',
      status === 'completed' && 'border-border',
      status === 'locked'    && 'border-border opacity-60',
    ].filter(Boolean).join(' ')}>

      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors disabled:cursor-not-allowed"
        onClick={onToggle}
        disabled={status === 'locked'}
      >
        <div className="flex items-center gap-2.5">
          {status === 'completed' && <Check   size={15} className="text-green-500 shrink-0" />}
          {status === 'active'    && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
          {status === 'locked'    && <Lock    size={13} className="text-muted-foreground shrink-0" />}
          <span className="font-medium text-sm">Diseño Comercial</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {fechaVisita && <span>visita: {fechaVisita}</span>}
          <span>{fotos.length} fotos · {diagramas.length} diagramas · {visitas.length} notas</span>
          {status !== 'locked' && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </div>
      </button>

      {expanded && status !== 'locked' && (
        <div className="border-t px-4 pb-4 pt-3">
          <Tabs defaultValue="fotos">
            <TabsList className="h-8 mb-3">
              <TabsTrigger value="fotos"    className="text-xs gap-1"><Camera   size={12} />Fotos ({fotos.length})</TabsTrigger>
              <TabsTrigger value="diagramas" className="text-xs gap-1"><Ruler   size={12} />Diagramas ({diagramas.length})</TabsTrigger>
              <TabsTrigger value="requisitos" className="text-xs gap-1"><BookOpen size={12} />Requisitos</TabsTrigger>
            </TabsList>

            <TabsContent value="fotos">
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {fotos.map(r => (
                    <img key={r.id} src={r.data.imagen_url} alt="" className="w-full aspect-square object-cover rounded-md border" />
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <SmartImageInput value={newFotoUrl} onChange={setNewFotoUrl} placeholder="URL o pega imagen (Ctrl+V)" />
                </div>
                <Button size="sm" disabled={!newFotoUrl || saving} onClick={() => addRecurso('foto', newFotoUrl)}>
                  + Foto
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="diagramas">
              {diagramas.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {diagramas.map(r => (
                    <img key={r.id} src={r.data.imagen_url} alt="" className="w-full aspect-square object-cover rounded-md border" />
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <SmartImageInput value={newDiagramaUrl} onChange={setNewDiagramaUrl} placeholder="URL o pega imagen (Ctrl+V)" />
                </div>
                <Button size="sm" disabled={!newDiagramaUrl || saving} onClick={() => addRecurso('diagrama', newDiagramaUrl)}>
                  + Diagrama
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="requisitos">
              {visitas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Sin notas de visita registradas.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {visitas.map(r => (
                    <div key={r.id} className="rounded-md border p-3 text-sm">
                      {r.data.fecha_visita && (
                        <p className="text-xs text-muted-foreground mb-1">Fecha de visita: {r.data.fecha_visita}</p>
                      )}
                      {r.data.notas && <p className="mb-1">{r.data.notas}</p>}
                      {r.data.lista_requisitos && (
                        <pre className="text-xs bg-muted rounded p-2 whitespace-pre-wrap font-sans mt-1">
                          {r.data.lista_requisitos}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
