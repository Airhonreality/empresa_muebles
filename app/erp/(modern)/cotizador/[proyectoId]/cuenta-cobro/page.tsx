'use client'

import { useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CotizadorCompatProvider, useCotizadorCompat } from '@/lib/data/queries/cotizador-compat'
import { Button } from '@/components/veta/button'
import { numeroALetrasPesos } from '@/lib/utils/numero-a-letras'

// Cuenta de cobro estándar Colombia (t-163 / t-178), mismo pipeline que el contrato:
// página imprimible + window.print(), NO PDF binario. Se eliminó el generador
// @pdfme/generator de este flujo porque fallaba en runtime (basePdf null y el
// plugin de tipo 'html' no existe).

const EMISOR = {
  nombre: 'Hermanos García González S.A.S',
  nit: '901421357-9',
  domicilio: 'Cra 72a 71a 57, Bogotá D.C., Colombia',
  repLegal: 'Airhon Javier García Rozo',
  cc: '123.350.6023',
  email: 'Vetadeoro.co@gmail.com',
  telefono: '302 5922101',
  banco: 'Bancolombia',
  tipoCuenta: 'Cuenta de Ahorros',
  numeroCuenta: '62700003257',
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function fmtCOP(v: number): string {
  return (
    '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP'
  )
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** 'AAAA-MM-DD' → '15 de octubre de 2026' (o la fecha de hoy si no llega). */
function fechaTexto(iso: string | null | undefined): string {
  const base = iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10)
  const [year, month, day] = base.split('-')
  const mes = MESES[parseInt(month, 10) - 1] ?? month
  return `${parseInt(day, 10)} de ${mes} de ${year}`
}

export default function CuentaCobroPrintPage() {
  const params = useParams()
  const proyectoId = params.proyectoId as string
  return (
    <CotizadorCompatProvider proyectoId={proyectoId}>
      <CuentaCobroPrintInner proyectoId={proyectoId} />
    </CotizadorCompatProvider>
  )
}

function CuentaCobroPrintInner({ proyectoId }: { proyectoId: string }) {
  const searchParams = useSearchParams()
  const hitoId = searchParams.get('hitoId')
  const numeroDocumento = searchParams.get('numeroDocumento') ?? ''
  const fechaVencimientoParam = searchParams.get('fechaVencimiento') ?? ''

  const { store, cargando } = useCotizadorCompat()
  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cliente = proyecto?.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
  const contrato = store.contratos.porProyecto(proyectoId)
  const hitosList = contrato ? store.hitos.porContrato(contrato.id) : []
  const hito = hitosList.find((h) => h.id === hitoId) ?? null

  const totalNeto = contrato ? parseNum(contrato.valorTotal) : 0
  const valorHito = hito
    ? hito.tipo === 'percentage'
      ? Math.round((totalNeto * parseNum(hito.montoOPorcentaje)) / 100)
      : parseNum(hito.montoOPorcentaje)
    : 0

  const valorLetras = numeroALetrasPesos(String(valorHito)).toUpperCase()
  const fechaEmision = fechaTexto(null)
  const fechaVencimiento = fechaTexto(fechaVencimientoParam || null)

  // Auto-impresión diferida para que carguen la firma y las fuentes. Se dispara
  // una sola vez, cuando el snapshot ya resolvió y existen contrato + hito.
  const impreso = useRef(false)
  useEffect(() => {
    if (impreso.current) return
    if (cargando || !contrato || !hito) return
    impreso.current = true
    const timer = setTimeout(() => window.print(), 500)
    return () => clearTimeout(timer)
  }, [cargando, contrato, hito])

  if (cargando) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-text-muted">Cargando cuenta de cobro…</p>
  }

  if (!contrato || !proyecto) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-text-muted">Este proyecto no tiene contrato emitido.</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={() => window.history.back()}>
            ← Volver
          </Button>
        </div>
      </div>
    )
  }

  if (!hito) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-text-muted">No se encontró el hito seleccionado para esta cuenta de cobro.</p>
        <p className="text-xs font-mono mt-2">{hitoId ?? 'sin hitoId'}</p>
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={() => window.history.back()}>
            ← Volver
          </Button>
        </div>
      </div>
    )
  }

  const concepto = contrato.objetoItems?.trim() || proyecto.nombreProyecto
  const hitoEtiqueta = hito.razon || (hito.tipo === 'percentage' ? `${parseNum(hito.montoOPorcentaje)}%` : 'Pago')

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border-subtle bg-bg-paper/95 px-6 py-3 print:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="md" onClick={() => window.history.back()}>← Volver</Button>
          <span className="text-text-muted text-xs">
            {proyecto.nombreProyecto} · {contrato.codigoContrato}
          </span>
        </div>
        <Button variant="primary" size="md" onClick={() => window.print()}>
          Descargar PDF
        </Button>
      </div>

      <div className="cuenta-print">
        <div className="cuenta-brand">
          <div>
            <h1>{EMISOR.nombre}</h1>
            <p className="cuenta-subtitle">Veta Dorada®</p>
            <div className="cuenta-contact">
              NIT: {EMISOR.nit}<br />
              Domicilio: {EMISOR.domicilio}<br />
              {EMISOR.email} | {EMISOR.telefono}
            </div>
          </div>
          <div className="cuenta-meta">
            <div className="cuenta-doc-title">Cuenta de Cobro</div>
            <div className="cuenta-field">Número</div>
            <div className="cuenta-value">{numeroDocumento || '—'}</div>
            <div className="cuenta-field">Fecha de Emisión</div>
            <div className="cuenta-value">{fechaEmision}</div>
            <div className="cuenta-field">Fecha de Vencimiento</div>
            <div className="cuenta-value">{fechaVencimiento}</div>
          </div>
        </div>

        <div className="cuenta-partes">
          <div className="cuenta-parte">
            <h4>Emitido por</h4>
            <p><strong>{EMISOR.nombre}</strong></p>
            <p>NIT: {EMISOR.nit}</p>
            <p>{EMISOR.domicilio}</p>
            <p>{EMISOR.email} | {EMISOR.telefono}</p>
            <p>Representante Legal: {EMISOR.repLegal}<br />C.C. No. {EMISOR.cc}</p>
          </div>
          <div className="cuenta-parte">
            <h4>Debe a</h4>
            <p><strong>{cliente?.nombre ?? '—'}</strong></p>
            <p>Identificación: {cliente?.documento ?? 's/documento'}</p>
            <p>{contrato.contratanteDomicilio || cliente?.domicilio || 's/domicilio'}</p>
            <p>{cliente?.email ?? 's/email'} | {cliente?.telefono ?? 's/tel'}</p>
          </div>
        </div>

        <div className="cuenta-concepto">
          <h4>Concepto</h4>
          <div className="cuenta-concepto-detalle">
            <p><strong>Contrato:</strong> {contrato.codigoContrato}</p>
            <p><strong>Objeto:</strong> {concepto}</p>
            <p><strong>Hito {hito.orden}:</strong> {hitoEtiqueta}</p>
          </div>
        </div>

        <div className="cuenta-valor">
          <h4>Valor de la Cuenta de Cobro</h4>
          <div className="cuenta-valor-fila">
            <span className="label">Valor en número:</span>
            <span className="valor">{fmtCOP(valorHito)}</span>
          </div>
          <div className="cuenta-valor-letras">
            <strong>Valor en letras:</strong> {valorLetras}
          </div>
          <div className="cuenta-valor-pie">
            Pagaderos a la cuenta autorizada de {EMISOR.nombre} (NIT: {EMISOR.nit})
          </div>
        </div>

        <div className="cuenta-bancos">
          <h4>Medio de Pago</h4>
          <div className="cuenta-bancos-detalle">
            <p><strong>Entidad Bancaria:</strong> {EMISOR.banco}</p>
            <p><strong>Tipo de Cuenta:</strong> {EMISOR.tipoCuenta}</p>
            <p><strong>Número de Cuenta:</strong> {EMISOR.numeroCuenta}</p>
            <p><strong>Titular:</strong> {EMISOR.nombre} (NIT: {EMISOR.nit})</p>
          </div>
        </div>

        <div className="cuenta-firmas">
          <div className="cuenta-firma">
            <div className="cuenta-firma-title">El Deudor (Cliente)</div>
            <div className="cuenta-firma-line" />
            <p className="cuenta-firma-texto">Firma: ______________________</p>
            <div className="cuenta-firma-datos">
              Nombre: {cliente?.nombre ?? ''}<br />
              C.C. o NIT: {cliente?.documento ?? ''}
            </div>
          </div>
          <div className="cuenta-firma">
            <div className="cuenta-firma-title">El Contratista</div>
            <div className="cuenta-firma-line" />
            <span className="cuenta-firma-wrap">
              <img src="/firma_representante.png" alt="Firma" className="cuenta-firma-img" />
              Firma: ______________________
            </span>
            <div className="cuenta-firma-datos">
              <strong>Nombre: {EMISOR.repLegal}</strong><br />
              Representante Legal - {EMISOR.nombre}<br />
              C.C. No. {EMISOR.cc}
            </div>
          </div>
        </div>

        <div className="cuenta-pie">
          {EMISOR.nombre} · NIT {EMISOR.nit} · {EMISOR.domicilio}<br />
          Veta Dorada® es marca comercial registrada. Documento generado electrónicamente.
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 0;
        }
        .cuenta-print {
          max-width: 800px;
          margin: 0 auto;
          padding: 50px 20px 20px;
          font-family: Georgia, serif;
          color: #222222;
          line-height: 1.5;
          font-size: 12.5px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .cuenta-brand {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #C5A059;
          padding-bottom: 18px;
          margin-bottom: 26px;
        }
        .cuenta-brand h1 {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 19px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1A1A1A;
          margin: 0;
        }
        .cuenta-subtitle {
          font-family: Inter, sans-serif;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #C5A059;
          margin: 5px 0 0;
        }
        .cuenta-contact {
          font-size: 10px;
          color: #555555;
          margin-top: 8px;
          line-height: 1.5;
        }
        .cuenta-meta {
          text-align: right;
          font-family: Inter, sans-serif;
        }
        .cuenta-doc-title {
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #1A1A1A;
          margin-bottom: 6px;
        }
        .cuenta-field {
          font-size: 8.5px;
          font-weight: 700;
          color: #8C7343;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1px;
        }
        .cuenta-value {
          font-size: 10px;
          color: #222222;
          margin-bottom: 4px;
        }
        .cuenta-partes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .cuenta-parte h4,
        .cuenta-concepto h4,
        .cuenta-valor h4,
        .cuenta-bancos h4 {
          font-family: Inter, sans-serif;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #8C7343;
          margin: 0 0 8px;
          border-bottom: 1px solid #A68C59;
          padding-bottom: 4px;
        }
        .cuenta-parte p {
          font-size: 10px;
          color: #555555;
          margin: 0 0 3px;
          line-height: 1.45;
        }
        .cuenta-parte strong {
          color: #222222;
          font-weight: 700;
        }
        .cuenta-concepto {
          margin-bottom: 22px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .cuenta-concepto-detalle {
          border: 1px solid #E6E1D8;
          padding: 12px 14px;
          background: #F3EFE9;
          font-size: 10px;
          color: #222222;
        }
        .cuenta-concepto-detalle p {
          margin: 0 0 4px;
        }
        .cuenta-concepto-detalle p:last-child {
          margin-bottom: 0;
        }
        .cuenta-concepto-detalle strong {
          color: #241C15;
          font-weight: 700;
        }
        .cuenta-valor {
          margin-bottom: 26px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .cuenta-valor-fila {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          margin-bottom: 6px;
        }
        .cuenta-valor-fila .label {
          color: #555555;
        }
        .cuenta-valor-fila .valor {
          font-weight: 700;
          color: #241C15;
          font-family: Inter, sans-serif;
        }
        .cuenta-valor-letras {
          border-top: 1.5px solid #E6E1D8;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 10px;
          color: #555555;
          font-style: italic;
        }
        .cuenta-valor-letras strong {
          color: #241C15;
          font-style: normal;
        }
        .cuenta-valor-pie {
          margin-top: 8px;
          font-size: 9.5px;
          color: #555555;
        }
        .cuenta-bancos {
          margin-bottom: 26px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .cuenta-bancos-detalle {
          font-size: 10px;
          color: #555555;
          line-height: 1.55;
        }
        .cuenta-bancos-detalle p {
          margin: 0;
        }
        .cuenta-bancos-detalle strong {
          color: #222222;
          font-weight: 700;
        }
        .cuenta-firmas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          margin-top: 40px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .cuenta-firma {
          border-top: 1px solid #222222;
          padding-top: 10px;
          font-size: 11px;
          position: relative;
        }
        .cuenta-firma-title {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #8C7343;
          margin-bottom: 28px;
        }
        .cuenta-firma-line {
          border-bottom: 1px solid #222222;
          margin-bottom: 6px;
        }
        .cuenta-firma-texto {
          margin: 0 0 10px;
        }
        .cuenta-firma-datos {
          font-size: 10px;
          color: #555555;
          line-height: 1.5;
        }
        .cuenta-firma-datos strong {
          color: #222222;
        }
        .cuenta-firma-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 10px;
        }
        .cuenta-firma-img {
          height: 70px;
          position: absolute;
          bottom: -6px;
          left: 40px;
          mix-blend-mode: multiply;
        }
        .cuenta-pie {
          margin-top: 30px;
          padding-top: 14px;
          border-top: 1px solid #E6E1D8;
          font-size: 8px;
          color: #555555;
          text-align: center;
          line-height: 1.4;
        }
        @media print {
          .cuenta-print {
            max-width: 100%;
            padding: 1.5cm 2cm;
          }
          .cuenta-concepto-detalle {
            background-color: #F3EFE9 !important;
          }
        }
      `}</style>
    </>
  )
}
