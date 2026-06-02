'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SmartImageInput } from '@/components/ui/SmartImageInput'
import { Badge } from '@/components/ui/badge'
import { Camera, Ruler, BookOpen, Plus, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { vaultWrite } from '@/lib/agnostic/vault-client'
import type { ApoyoTecnicoRecord } from '@/generated/agnostic-schemas'
import type { ConfirmConfig } from '../ConfirmActionDialog'

interface PhaseDesignProps {
  cotizacionId: string
  apoyo: ApoyoTecnicoRecord[]
  isCurrentPhase: boolean
  onRefresh: () => void
  onRequestConfirm: (config: ConfirmConfig) => void
  zapBusy: string | null
}

export default function PhaseDesign({
  cotizacionId, apoyo, isCurrentPhase, onRefresh, onRequestConfirm, zapBusy,
}: PhaseDesignProps) {
  const [newFotoUrl, setNewFotoUrl]               = useState('')
  const [newDiagramaUrl, setNewDiagramaUrl]       = useState('')
  const [newNotaText, setNewNotaText]             = useState('')
  const [newRequisitosText, setNewRequisitosText] = useState('')
  const [newFechaVisita, setNewFechaVisita]       = useState('')
  const [saving, setSaving]                       = useState(false)

  const fotos     = apoyo.filter(r => r.data.tipo_recurso === 'foto')
  const diagramas = apoyo.filter(r => r.data.tipo_recurso === 'diagrama')
  const visitas   = apoyo.filter(r => r.data.tipo_recurso === 'visita')

  const handleAddRecurso = async (tipo: 'foto' | 'diagrama', url: string) => {
    if (!url) return
    setSaving(true)
    try {
      await vaultWrite('apoyo_tecnico', undefined, {
        cotizacion_id: cotizacionId, tipo_recurso: tipo, imagen_url: url,
      })
      if (tipo === 'foto') setNewFotoUrl(''); else setNewDiagramaUrl('')
      toast.success('Recurso añadido.')
      onRefresh()
    } catch { toast.error('Error al guardar el recurso.') }
    finally { setSaving(false) }
  }

  const handleAddNota = async () => {
    if (!newNotaText) { toast.error('Escribe una nota o requisito.'); return }
    setSaving(true)
    try {
      await vaultWrite('apoyo_tecnico', undefined, {
        cotizacion_id: cotizacionId, tipo_recurso: 'visita',
        notas: newNotaText, lista_requisitos: newRequisitosText,
        fecha_visita: newFechaVisita || new Date().toISOString().split('T')[0],
      })
      setNewNotaText(''); setNewRequisitosText(''); setNewFechaVisita('')
      toast.success('Requisito registrado.')
      onRefresh()
    } catch { toast.error('Error al guardar la nota.') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold">Lienzo de Diseño Técnico</h2>
          <p className="text-xs text-muted-foreground">Adjunta planos, fotos de obra y define los requerimientos de despiece.</p>
        </div>
        {isCurrentPhase && (
          <Button size="sm" disabled={!!zapBusy} onClick={() => onRequestConfirm({
            title: 'Completar Diseño Comercial',
            description: '¿Confirmas que el diseño técnico y los requerimientos han sido cargados? Esto avanzará el proyecto a Cotización.',
            zap: 'completar_diseno',
            payload: { cotizacion_id: cotizacionId },
          })}>
            ✦ Finalizar Diseño
          </Button>
        )}
      </div>

      <Tabs defaultValue="requisitos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/40 p-1 border rounded-lg max-w-md">
          <TabsTrigger value="requisitos" className="text-xs gap-1.5"><BookOpen size={13} />Requisitos</TabsTrigger>
          <TabsTrigger value="fotos" className="text-xs gap-1.5"><Camera size={13} />Fotos ({fotos.length})</TabsTrigger>
          <TabsTrigger value="diagramas" className="text-xs gap-1.5"><Ruler size={13} />Diagramas ({diagramas.length})</TabsTrigger>
        </TabsList>

        {/* Requisitos */}
        <TabsContent value="requisitos" className="flex flex-col gap-4 mt-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-4 bg-muted/5 flex flex-col gap-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Agregar Requisito / Nota de Obra</h4>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium">Notas Principales</Label>
                <Textarea value={newNotaText} onChange={e => setNewNotaText(e.target.value)}
                  placeholder="Notas generales tomadas en la obra..." className="text-xs min-h-[60px]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium">Lista de Requerimientos</Label>
                <Textarea value={newRequisitosText} onChange={e => setNewRequisitosText(e.target.value)}
                  placeholder="Ej:&#10;- Toma corriente de 220v en isla&#10;- Muro aplomado con desviación de 2cm..."
                  className="text-xs min-h-[80px] font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium">Fecha de Visita</Label>
                  <Input type="date" value={newFechaVisita} onChange={e => setNewFechaVisita(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex items-end">
                  <Button size="sm" onClick={handleAddNota} disabled={saving || !newNotaText} className="w-full h-8 text-xs font-bold gap-1">
                    <Plus size={13} /> Registrar
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visitas Registradas</h4>
              {visitas.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground bg-muted/5">
                  No hay requisitos registrados.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {visitas.map(r => (
                    <div key={r.id} className="rounded-lg border p-3 bg-card shadow-sm flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b pb-1">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {r.data.fecha_visita as string}</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-primary/20 text-primary">Requisito</Badge>
                      </div>
                      {r.data.notas && <p className="text-xs text-foreground/90 font-medium">{r.data.notas as string}</p>}
                      {r.data.lista_requisitos && (
                        <pre className="text-[10px] bg-muted/60 rounded p-2 whitespace-pre-wrap font-sans border border-dashed">{r.data.lista_requisitos as string}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Fotos */}
        <TabsContent value="fotos" className="flex flex-col gap-4 mt-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cargar Nueva Foto</h4>
              <SmartImageInput value={newFotoUrl} onChange={setNewFotoUrl} placeholder="URL o pega captura (Ctrl+V)" />
              <Button size="sm" onClick={() => handleAddRecurso('foto', newFotoUrl)} disabled={saving || !newFotoUrl} className="w-full gap-1 h-9 font-bold">
                <Plus size={13} /> Guardar Foto
              </Button>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Galería</h4>
              {fotos.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground bg-muted/5">Sin fotografías.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {fotos.map(r => (
                    <div key={r.id} className="relative group aspect-square rounded-lg border overflow-hidden bg-muted">
                      <img src={r.data.imagen_url as string} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Diagramas */}
        <TabsContent value="diagramas" className="flex flex-col gap-4 mt-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cargar Diagrama / Plano</h4>
              <SmartImageInput value={newDiagramaUrl} onChange={setNewDiagramaUrl} placeholder="URL o pega diagrama (Ctrl+V)" />
              <Button size="sm" onClick={() => handleAddRecurso('diagrama', newDiagramaUrl)} disabled={saving || !newDiagramaUrl} className="w-full gap-1 h-9 font-bold">
                <Plus size={13} /> Guardar Diagrama
              </Button>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Planos Técnicos</h4>
              {diagramas.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground bg-muted/5">Sin diagramas.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {diagramas.map(r => (
                    <div key={r.id} className="relative group aspect-square rounded-lg border overflow-hidden bg-muted">
                      <img src={r.data.imagen_url as string} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
