'use client'
import type { BlockProps } from '@agnostic/core'
import type { ContratosRecord, ProyectosRecord, ClientesRecord, EspacioVariantesRecord } from '@/generated/agnostic-schemas'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMateriaStore } from '@/lib/agnostic/store'
import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Mail, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'

const fmt = (v: number) =>
  '$' + v.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP'

async function vaultWrite(namespace: string, id: string | undefined, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  })
  if (!res.ok) throw new Error(await res.text())
  const body = await res.json()
  return body.record ?? body
}

export default function ContratoGenerator({ activeRecord }: BlockProps) {
  const contrato = activeRecord as ContratosRecord | null | undefined

  const { data: allProyectos, isLoading: loadingCot } = useRelationData('proyectos')
  const { data: allClientes, isLoading: loadingCli } = useRelationData('clientes')
  const { data: allEspacios, isLoading: loadingEsp } = useRelationData('espacio_variantes')

  const isLoading = loadingCot || loadingCli || loadingEsp

  const cotizacion = useMemo(
    () => (allProyectos as ProyectosRecord[]).find(q => q.id === contrato?.data.proyecto_id),
    [allProyectos, contrato]
  )
  const client = useMemo(
    () => (allClientes as ClientesRecord[]).find(c => c.id === cotizacion?.data.cliente_id),
    [allClientes, cotizacion]
  )
  const activeSpaces = useMemo(
    () => (allEspacios as EspacioVariantesRecord[]).filter(
      s => s.data.proyecto_id === cotizacion?.id && s.data.activa
    ),
    [allEspacios, cotizacion]
  )

  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string | number>>({})

  useEffect(() => {
    if (!contrato) return
    const d = contrato.data
    setForm({
      fecha_contrato:            d.fecha_contrato as string    ?? new Date().toISOString().split('T')[0],
      contratante_domicilio:     d.contratante_domicilio as string ?? (client?.data.domicilio ?? ''),
      plazo_ejecucion_texto:     d.plazo_ejecucion_texto as string ?? '',
      holgura_dias:              d.holgura_dias as number      ?? 6,
      garantia_anios:            d.garantia_anios as number    ?? 2,
      objeto_items:              d.objeto_items as string      ?? '',
      especificaciones_estructura: d.especificaciones_estructura as string ?? '',
      especificaciones_herrajes:  d.especificaciones_herrajes as string  ?? '',
      especificaciones_mesones:   d.especificaciones_mesones as string   ?? '',
      condiciones_desmonte:       d.condiciones_desmonte as string        ?? '',
      valor_total:               d.valor_total as number       ?? 0,
      email_asunto:              d.email_asunto as string      ?? '',
      email_cuerpo:              d.email_cuerpo as string      ?? '',
    })
  }, [contrato?.id, client?.id])

  const valorTotal = Number(form.valor_total ?? 0)
  const abono1 = Math.round(valorTotal * 0.50)
  const abono2 = Math.round(valorTotal * 0.25)
  const abono3 = valorTotal - abono1 - abono2

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const saveStep1 = async () => {
    if (!contrato) return
    if (!form.plazo_ejecucion_texto) {
      toast.error('El plazo de ejecución es obligatorio.')
      return
    }
    setSaving(true)
    try {
      const saved = await vaultWrite('contratos', contrato.id, {
        ...contrato.data,
        ...form,
        holgura_dias: Number(form.holgura_dias),
        garantia_anios: Number(form.garantia_anios),
        valor_total: Number(form.valor_total),
      })
      useMateriaStore.getState().updateItem('contratos', saved)
      toast.success('Contrato guardado.')
      setStep(2)
    } catch {
      toast.error('Error al guardar el contrato.')
    } finally {
      setSaving(false)
    }
  }

  const markAsSent = async () => {
    if (!contrato || !cotizacion) return
    setSaving(true)
    try {
      const saved = await vaultWrite('contratos', contrato.id, {
        ...contrato.data,
        ...form,
        estado: 'enviado',
      })
      useMateriaStore.getState().updateItem('contratos', saved)

      const savedCot = await vaultWrite('proyectos', cotizacion.id, {
        ...cotizacion.data,
        estado: 'pre_produccion',
      })
      useMateriaStore.getState().updateItem('proyectos', savedCot)

      toast.success('Contrato marcado como enviado. Proyecto en pre-producción.')
    } catch {
      toast.error('Error al marcar como enviado.')
    } finally {
      setSaving(false)
    }
  }

  const mailtoLink = useMemo(() => {
    const to = client?.data.email ?? ''
    const subject = encodeURIComponent(String(form.email_asunto ?? ''))
    const body = encodeURIComponent(String(form.email_cuerpo ?? ''))
    return `mailto:${to}?subject=${subject}&body=${body}`
  }, [client, form.email_asunto, form.email_cuerpo])

  if (!contrato) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>Selecciona un contrato del panel de arriba para editarlo.</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    )
  }

  const estadoBadgeVariant = (e: string) =>
    e === 'firmado' ? 'default' : e === 'enviado' ? 'secondary' : 'outline'

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{contrato.data.codigo_contrato}</h2>
          <p className="text-sm text-muted-foreground">
            {cotizacion?.data.nombre_proyecto ?? '—'} · {client?.data.nombre ?? 'Sin cliente'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={estadoBadgeVariant(contrato.data.estado)}>
            {contrato.data.estado}
          </Badge>
          <span className="text-xs text-muted-foreground">Paso {step} de 2</span>
        </div>
      </div>

      {step === 1 && (
        <>
          {/* Datos del contratante — heredados pero editables */}
          <Card>
            <CardHeader><CardTitle className="text-base">Datos del Contratante</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre / Razón Social</Label>
                <Input value={client?.data.nombre ?? ''} disabled className="bg-muted/40" />
              </div>
              <div>
                <Label>Identificación (C.C. o NIT)</Label>
                <Input value={client?.data.documento ?? ''} disabled className="bg-muted/40" />
              </div>
              <div>
                <Label>Correo Electrónico</Label>
                <Input value={client?.data.email ?? ''} disabled className="bg-muted/40" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={client?.data.telefono ?? ''} disabled className="bg-muted/40" />
              </div>
              <div className="md:col-span-2">
                <Label>Domicilio del Contratante *</Label>
                <Input
                  value={String(form.contratante_domicilio ?? '')}
                  onChange={set('contratante_domicilio')}
                  placeholder="Ej: Cra 101 #150a-60 casa 39, Bogotá"
                />
                <p className="text-xs text-muted-foreground mt-1">Puede diferir de la dirección de obra.</p>
              </div>
            </CardContent>
          </Card>

          {/* Cláusulas */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cláusulas del Contrato</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label>Fecha del Contrato</Label>
                <Input type="date" value={String(form.fecha_contrato ?? '')} onChange={set('fecha_contrato')} />
              </div>

              <div>
                <Label>Plazo de Ejecución (descripción) *</Label>
                <Input
                  value={String(form.plazo_ejecucion_texto ?? '')}
                  onChange={set('plazo_ejecucion_texto')}
                  placeholder="Ej: segunda semana de julio (día: 6 - 10)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El contrato entra en vigencia a partir del primer anticipo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Holgura operativa (días hábiles)</Label>
                  <Input
                    type="number"
                    value={Number(form.holgura_dias ?? 6)}
                    onChange={set('holgura_dias')}
                  />
                </div>
                <div>
                  <Label>Garantía (años)</Label>
                  <Input
                    type="number"
                    value={Number(form.garantia_anios ?? 2)}
                    onChange={set('garantia_anios')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objeto del contrato */}
          <Card>
            <CardHeader><CardTitle className="text-base">Objeto del Contrato</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              {activeSpaces.length > 0 && (
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Espacios de la cotización (referencia):</p>
                  <ul className="text-sm space-y-0.5">
                    {activeSpaces.map((s, i) => (
                      <li key={s.id}>{i + 1}. {s.data.nombre_espacio}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <Label>Lista de muebles / trabajos (editable)</Label>
                <Textarea
                  rows={5}
                  value={String(form.objeto_items ?? '')}
                  onChange={set('objeto_items')}
                  placeholder="1. Walking closet (Cuarto Principal)&#10;2. Closet de cuarto 1 (Niña)&#10;..."
                />
              </div>
              <div>
                <Label>Estructura (materiales principales)</Label>
                <Input
                  value={String(form.especificaciones_estructura ?? '')}
                  onChange={set('especificaciones_estructura')}
                  placeholder="Ej: Melamina calibre 18mm"
                />
              </div>
              <div>
                <Label>Herrajes y Accesorios</Label>
                <Input
                  value={String(form.especificaciones_herrajes ?? '')}
                  onChange={set('especificaciones_herrajes')}
                  placeholder="Ej: Bisagras de cierre suave, rieles de extensión total..."
                />
              </div>
              <div>
                <Label>Mesones (si aplica)</Label>
                <Input
                  value={String(form.especificaciones_mesones ?? '')}
                  onChange={set('especificaciones_mesones')}
                  placeholder="Ej: Mesón barra en piedra sinterizada"
                />
              </div>
              <div>
                <Label>Desmonte y Disposición</Label>
                <Input
                  value={String(form.condiciones_desmonte ?? '')}
                  onChange={set('condiciones_desmonte')}
                  placeholder="Ej: Incluye desmonte pero NO disposición de los muebles existentes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pagos */}
          <Card>
            <CardHeader><CardTitle className="text-base">Quinta — Pagos y Condiciones</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label>Valor Total del Contrato ($)</Label>
                <Input
                  type="number"
                  value={Number(form.valor_total ?? 0)}
                  onChange={set('valor_total')}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div className="rounded-md bg-muted/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Primer anticipo (50%)</p>
                  <p className="font-semibold text-sm mt-1">{fmt(abono1)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Al activar el contrato</p>
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Segundo pago (25%)</p>
                  <p className="font-semibold text-sm mt-1">{fmt(abono2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Al despachar muebles</p>
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Pago final (25%)</p>
                  <p className="font-semibold text-sm mt-1">{fmt(abono3)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Al finalizar instalación</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveStep1} disabled={saving} size="lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar y preparar correo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo de Envío del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">Para:</span>
                <span className="text-sm font-medium">{client?.data.email ?? 'Sin correo registrado'}</span>
              </div>
              <div>
                <Label>Asunto</Label>
                <Input
                  value={String(form.email_asunto ?? '')}
                  onChange={set('email_asunto')}
                />
              </div>
              <div>
                <Label>Cuerpo del correo</Label>
                <Textarea
                  rows={12}
                  value={String(form.email_cuerpo ?? '')}
                  onChange={set('email_cuerpo')}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <a href={mailtoLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir en cliente de correo
                  </a>
                </Button>
                <Button
                  onClick={markAsSent}
                  disabled={saving || contrato.data.estado === 'enviado'}
                  className="flex-1"
                >
                  {saving
                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    : <CheckCircle className="mr-2 h-4 w-4" />
                  }
                  {contrato.data.estado === 'enviado' ? 'Ya enviado' : 'Marcar como enviado'}
                </Button>
              </div>

              {contrato.data.estado === 'enviado' && (
                <p className="text-sm text-center text-muted-foreground">
                  El proyecto está en pre-producción. Registra el primer anticipo desde Comercial para activar producción.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver al formulario
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
