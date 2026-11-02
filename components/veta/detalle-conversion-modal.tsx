'use client'

import { Modal } from '@/components/veta/modal'
import { Badge } from '@/components/veta/badge'
import type { FilaConversion } from '@/lib/data/queries/conversiones'
import { formatCurrency } from '@/lib/utils/format'

const ETAPA_LABELS: Record<FilaConversion['etapa'], string> = {
  nuevo_lead: 'Nuevo lead',
  contactado: 'Contactado',
  asesoria_agendada: 'Asesoría agendada',
  cotizado: 'Cotizado',
  contrato_firmado: 'Contrato firmado',
  descartado: 'Descartado',
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <div className="mt-0.5 break-words text-sm text-text-primary">{children}</div>
    </div>
  )
}

function Vacio() {
  return <span className="text-text-muted">—</span>
}

/**
 * t-189: ficha de solo lectura con todo lo que capturó el pixel para una conversión.
 * El objetivo es analizar, no editar: refleja exactamente lo que el sitio guardó.
 */
export function DetalleConversionModal({
  fila,
  onClose,
}: {
  fila: FilaConversion | null
  onClose: () => void
}) {
  if (!fila) return null

  return (
    <Modal open onClose={onClose} title="Datos capturados por el pixel" maxWidthClassName="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-text-heading">{fila.ref}</span>
          <Badge tone={fila.atribuido ? 'info' : 'neutral'}>
            {fila.atribuido ? 'Google Ads' : 'Orgánico'}
          </Badge>
          <Badge tone={fila.etapa === 'contrato_firmado' ? 'warning' : 'neutral'}>
            {ETAPA_LABELS[fila.etapa]}
          </Badge>
          {fila.sinIdentificar && <Badge tone="danger">Sin identificar</Badge>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Dato label="Fecha">{new Date(fila.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</Dato>
          <Dato label="Tipo de proyecto">{fila.tipoProyecto || <Vacio />}</Dato>
          <Dato label="Nombre">{fila.nombre || <Vacio />}</Dato>
          <Dato label="Teléfono">{fila.telefono || <Vacio />}</Dato>
          <Dato label="Correo">{fila.email || <Vacio />}</Dato>
          <Dato label="Ubicación">{fila.ubicacion || <Vacio />}</Dato>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Clic de Google
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Dato label="gclid"><span className="font-mono text-xs">{fila.gclid || <Vacio />}</span></Dato>
            <Dato label="wbraid"><span className="font-mono text-xs">{fila.wbraid || <Vacio />}</span></Dato>
            <Dato label="gbraid"><span className="font-mono text-xs">{fila.gbraid || <Vacio />}</span></Dato>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            UTMs
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Dato label="Fuente">{fila.fuente || <Vacio />}</Dato>
            <Dato label="Medio">{fila.medio || <Vacio />}</Dato>
            <Dato label="Campaña">{fila.campana || <Vacio />}</Dato>
            <Dato label="Término">{fila.termino || <Vacio />}</Dato>
            <Dato label="Contenido">{fila.contenido || <Vacio />}</Dato>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Datos hasheados enviados a Google
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Dato label="Teléfono (SHA-256)">
              <span className="break-all font-mono text-xs">{fila.hashedPhone || <Vacio />}</span>
            </Dato>
            <Dato label="Correo (SHA-256)">
              <span className="break-all font-mono text-xs">{fila.hashedEmail || <Vacio />}</span>
            </Dato>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Vínculos en el ERP
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Dato label="Cliente">{fila.clienteNombre || <Vacio />}</Dato>
            <Dato label="Proyecto">{fila.proyectoCodigo || <Vacio />}</Dato>
            <Dato label="Contrato">{fila.contratoCodigo || <Vacio />}</Dato>
            <Dato label="Valor del contrato">
              {fila.contratoId ? formatCurrency(fila.valorContrato) : <Vacio />}
            </Dato>
          </div>
        </div>

        {fila.eventosPendientes > 0 && (
          <p className="rounded-sm border border-border-subtle bg-bg-alt px-3 py-2 text-xs text-text-muted">
            {fila.eventosPendientes} evento{fila.eventosPendientes === 1 ? '' : 's'} de conversión
            offline pendiente{fila.eventosPendientes === 1 ? '' : 's'} de subir a Google Ads.
          </p>
        )}
      </div>
    </Modal>
  )
}
