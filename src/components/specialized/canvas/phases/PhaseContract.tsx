'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lock, ExternalLink, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { vaultWrite } from '@/lib/agnostic/vault-client'
import { useMateriaStore } from '@/lib/agnostic/store'
import type { ContratosRecord, AbonosContratoRecord } from '@/generated/agnostic-schemas'
import type { ConfirmConfig } from '../ConfirmActionDialog'

interface PhaseContractProps {
  cotizacionId: string
  contrato: ContratosRecord | null
  abonos: AbonosContratoRecord[]
  isCurrentPhase: boolean
  onRefresh: () => void
  onRequestConfirm: (config: ConfirmConfig) => void
  zapBusy: string | null
}

export default function PhaseContract({
  cotizacionId, contrato, abonos, isCurrentPhase, onRefresh, onRequestConfirm, zapBusy,
}: PhaseContractProps) {
  const [plazoText, setPlazoText]   = useState('')
  const [garantia, setGarantia]     = useState('2')
  const [planPagos, setPlanPagos]   = useState('50/25/25')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (contrato) {
      setPlazoText(contrato.data.plazo_ejecucion_texto as string ?? '')
      setGarantia(String(contrato.data.garantia_anios ?? '2'))
      setPlanPagos((contrato.data as any).plan_pagos as string ?? '50/25/25')
    }
  }, [contrato?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!contrato) return
    setSaving(true)
    try {
      const updated = await vaultWrite('contratos', contrato.id, {
        ...contrato.data,
        plazo_ejecucion_texto: plazoText,
        garantia_anios: Number(garantia),
        plan_pagos: planPagos,
      })
      useMateriaStore.getState().updateItem('contratos', updated)
      toast.success('Contrato y plan de pagos actualizado.'); onRefresh()
    } catch { toast.error('Error al actualizar.') }
    finally { setSaving(false) }
  }

  const mailtoHref = contrato
    ? `mailto:?subject=${encodeURIComponent(contrato.data.email_asunto as string ?? '')}&body=${encodeURIComponent(contrato.data.email_cuerpo as string ?? '')}`
    : '#'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold">Lienzo de Contrato Legal</h2>
          <p className="text-xs text-muted-foreground">Redacta condiciones técnicas, fija plazos y formaliza el acuerdo.</p>
        </div>
        {isCurrentPhase && (
          <Button size="sm" disabled={!!zapBusy} onClick={() => onRequestConfirm({
            title: 'Generar y Firmar Contrato',
            description: '¿Confirmas la generación oficial del contrato? Esto creará el contrato y notificará al área contable.',
            zap: 'generar_contrato',
            payload: { cotizacion_id: cotizacionId },
          })}>
            ✦ Registrar Firma
          </Button>
        )}
      </div>

      {!contrato ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-xs text-muted-foreground bg-muted/5 flex flex-col items-center gap-3">
          <Lock size={24} className="text-muted-foreground/60" />
          <p className="font-semibold text-foreground">Contrato no generado.</p>
          <p>Estará disponible una vez que congeles la cotización comercial.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 border rounded-xl p-5 bg-card shadow-sm flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Pliego Legal y Fechas</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Plazo de Ejecución</Label>
                <Input value={plazoText} onChange={e => setPlanPagos && setPlazoText(e.target.value)}
                  placeholder="Ej: 35 días hábiles..." className="h-8 text-xs font-medium" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Garantía (Años)</Label>
                <select value={garantia} onChange={e => setGarantia(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs font-semibold focus:outline-none">
                  <option value="1">1 año</option>
                  <option value="2">2 años</option>
                  <option value="5">5 años (Maderas selectas)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Plan de Pagos</Label>
                <select value={planPagos} onChange={e => setPlanPagos(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs font-semibold focus:outline-none">
                  <option value="50/25/25">50/25/25 (Anticipo/Taller/Obra)</option>
                  <option value="50/50">50/50 (Anticipo/Entrega)</option>
                  <option value="60/40">60/40 (Anticipo/Entrega)</option>
                  <option value="40/40/20">40/40/20 (Anticipo/Taller/Obra)</option>
                  <option value="30/30/30/10">30/30/30/10 (4 Cuotas)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs h-8 font-bold">
                {saving && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />} Guardar Términos
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-2 bg-muted/30 p-3 rounded-lg border border-dashed">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-semibold uppercase text-primary flex items-center gap-1"><Mail size={12} /> Correo Pre-configurado</span>
              </div>
              <p className="text-xs truncate text-foreground/80">
                <span className="text-muted-foreground">Asunto:</span> {contrato.data.email_asunto as string || 'Sin asunto'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones del Contrato</h4>
            <div className="border rounded-xl p-4 bg-muted/5 flex flex-col gap-2.5 h-fit">
              <div className="text-xs flex flex-col gap-1">
                <span className="text-muted-foreground">Código:</span>
                <strong className="font-mono font-semibold">{contrato.data.codigo_contrato as string}</strong>
              </div>
              <div className="text-xs flex flex-col gap-1">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant="secondary" className="w-fit text-[10px] font-bold uppercase py-0.5">{contrato.data.estado as string}</Badge>
              </div>
              <Separator className="my-1" />
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 justify-start gap-2 border-primary/30 text-primary hover:bg-primary/5" asChild>
                <a href={mailtoHref} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Abrir en Correo</a>
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 justify-start gap-2 border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => window.open('/app/contratos', '_blank')}>
                <ExternalLink size={12} /> Ficha Contrato Completa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
