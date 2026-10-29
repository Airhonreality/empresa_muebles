/**
 * Generador de PDF para "Cuenta de Cobro" estándar Colombia.
 * Formato: empresa emisora → cliente ("Debe a"), concepto (objeto del contrato),
 * valor en número y letras, fechas, firma del representante legal.
 * Usa @pdfme/generator con template HTML embebido (mismo patrón que lib/pdf/cotizacion.ts).
 */

import { generate } from '@pdfme/generator'

const D4_TOKENS = {
  brand: '#8B6914',
  textPrimary: '#2B2B2D',
  textHeading: '#241C15',
  textMuted: '#5F5D57',
  bgRaised: '#FFFFFF',
  bgAlt: '#F3EFE9',
  borderSubtle: '#E6E1D8',
  gold100: '#E9DFC6',
  gold300: '#A68C59',
  gold600: '#8B6914',
}

export interface CuentaCobroPDFInput {
  /** Número de documento de la cuenta de cobro (ej. CC-0001) */
  numeroDocumento: string
  /** Fecha de emisión (YYYY-MM-DD) */
  fechaEmision: string
  /** Fecha de vencimiento (YYYY-MM-DD) */
  fechaVencimiento: string
  /** Emisor (hardcodeado: Hermanos García González S.A.S) */
  emisorNombre: string
  emisorNit: string
  emisorDomicilio: string
  emisorRepLegal: string
  emisorCc: string
  emisorEmail: string
  emisorTelefono: string
  emisorBanco: string
  emisorTipoCuenta: string
  emisorNumeroCuenta: string
  /** Receptor / "Debe a" (cliente) */
  clienteNombre: string
  clienteDocumento: string
  clienteDomicilio: string
  clienteEmail: string
  clienteTelefono: string
  /** Contrato */
  contratoCodigo: string
  contratoObjeto: string
  /** Hito seleccionado */
  hitoOrden: number
  hitoRazon: string
  hitoMonto: string
  /** Valor en número y letras */
  valorNumero: string
  valorLetras: string
}

function fmtCOP(cantidad: string): string {
  const n = parseFloat(cantidad.replace(/[^\d.,]/g, '').replace(',', '.'))
  if (!Number.isFinite(n)) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtFecha(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function generarPDFCuentaCobro(input: CuentaCobroPDFInput): Promise<Buffer> {
  const valorNumero = fmtCOP(input.valorNumero)
  const fechaEmision = fmtFecha(input.fechaEmision)
  const fechaVencimiento = fmtFecha(input.fechaVencimiento)

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cuenta de Cobro ${input.numeroDocumento}</title>
  <link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;700;800;900&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: ${D4_TOKENS.bgRaised};
      color: ${D4_TOKENS.textPrimary};
      line-height: 1.5;
      padding: 40px;
      font-size: 11.5px;
    }
    @page {
      size: letter;
      margin: 1.6cm 1.8cm;
    }
    .cuenta-container {
      max-width: 700px;
      margin: 0 auto;
      border: 1px solid ${D4_TOKENS.borderSubtle};
      padding: 30px 35px 35px;
      background: ${D4_TOKENS.bgRaised};
    }
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid ${D4_TOKENS.brand};
      padding-bottom: 18px;
      margin-bottom: 26px;
    }
    .brand-logo h1 {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.12em;
      color: ${D4_TOKENS.textHeading};
      text-transform: uppercase;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      color: ${D4_TOKENS.brand};
      margin-top: 3px;
    }
    .brand-contact {
      font-size: 9px;
      color: ${D4_TOKENS.textMuted};
      margin-top: 6px;
      line-height: 1.4;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-meta .doc-title {
      font-family: 'Alegreya Sans', sans-serif;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.05em;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .doc-meta .doc-field {
      font-size: 9px;
      font-weight: 600;
      color: ${D4_TOKENS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 2px;
    }
    .doc-meta .doc-value {
      font-size: 9.5px;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 3px;
    }
    .partes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .parte-block h4 {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 8px;
      border-bottom: 1px solid ${D4_TOKENS.gold300};
      padding-bottom: 4px;
    }
    .parte-block p {
      font-size: 9.5px;
      color: ${D4_TOKENS.textMuted};
      margin-bottom: 2.5px;
      line-height: 1.4;
    }
    .parte-block strong {
      color: ${D4_TOKENS.textPrimary};
      font-weight: 700;
    }
    .concepto-section {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .concepto-section h4 {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 8px;
      border-left: 3px solid ${D4_TOKENS.brand};
      padding-left: 10px;
    }
    .concepto-detalle {
      border: 1px solid ${D4_TOKENS.borderSubtle};
      padding: 12px 14px;
      background: ${D4_TOKENS.bgAlt};
      font-size: 9.5px;
      color: ${D4_TOKENS.textPrimary};
    }
    .concepto-detalle p {
      margin-bottom: 4px;
    }
    .concepto-detalle p:last-child { margin-bottom: 0; }
    .concepto-detalle strong {
      color: ${D4_TOKENS.textHeading};
      font-weight: 700;
    }
    .valor-section {
      margin-bottom: 26px;
      page-break-inside: avoid;
    }
    .valor-section h4 {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 10px;
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
      padding-bottom: 5px;
    }
    .valor-fila {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      margin-bottom: 5px;
    }
    .valor-fila .label { color: ${D4_TOKENS.textMuted}; }
    .valor-fila .valor { font-weight: 700; color: ${D4_TOKENS.textHeading}; font-family: 'Alegreya Sans', sans-serif; }
    .valor-fila.total { border-top: 1.5px solid ${D4_TOKENS.borderSubtle}; padding-top: 8px; margin-top: 8px; font-size: 12px; }
    .valor-letras {
      margin-top: 10px;
      font-size: 9.5px;
      color: ${D4_TOKENS.textMuted};
      font-style: italic;
      border-top: 1px solid ${D4_TOKENS.borderSubtle};
      padding-top: 8px;
    }
    .bancos-section {
      margin-bottom: 26px;
      page-break-inside: avoid;
    }
    .bancos-section h4 {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 8px;
      border-left: 3px solid ${D4_TOKENS.brand};
      padding-left: 10px;
    }
    .bancos-detalle {
      font-size: 9.5px;
      color: ${D4_TOKENS.textMuted};
      line-height: 1.5;
    }
    .bancos-detalle strong { color: ${D4_TOKENS.textPrimary}; font-weight: 700; }
    .firmas-section {
      display: flex;
      justify-content: space-between;
      margin-top: 34px;
      page-break-inside: avoid;
    }
    .firma-box {
      flex: 1;
      max-width: 300px;
    }
    .firma-title {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 6px;
    }
    .firma-line {
      border-bottom: 1px solid ${D4_TOKENS.textPrimary};
      height: 20px;
      margin-bottom: 24px;
    }
    .firma-img-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .firma-img {
      height: 24px;
      width: auto;
    }
    .firma-datos {
      font-size: 8.5px;
      color: ${D4_TOKENS.textMuted};
      line-height: 1.4;
    }
    .firma-datos strong { color: ${D4_TOKENS.textPrimary}; font-weight: 700; }
    .pie-legal {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid ${D4_TOKENS.borderSubtle};
      font-size: 7.5px;
      color: ${D4_TOKENS.textMuted};
      text-align: center;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="cuenta-container">
    <div class="brand-header">
      <div class="brand-logo">
        <h1>Hermanos García González S.A.S</h1>
        <div class="brand-subtitle">Veta Dorada®</div>
        <div class="brand-contact">
          NIT: ${input.emisorNit}<br />
          Domicilio: ${input.emisorDomicilio}<br />
          ${input.emisorEmail} | ${input.emisorTelefono}
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title">Cuenta de Cobro</div>
        <div class="doc-field">Número</div>
        <div class="doc-value">${input.numeroDocumento}</div>
        <div class="doc-field">Fecha de Emisión</div>
        <div class="doc-value">${fechaEmision}</div>
        <div class="doc-field">Fecha de Vencimiento</div>
        <div class="doc-value">${fechaVencimiento}</div>
      </div>
    </div>

    <div class="partes-grid">
      <div class="parte-block">
        <h4>Emitido por</h4>
        <p><strong>${input.emisorNombre}</strong></p>
        <p>NIT: ${input.emisorNit}</p>
        <p>${input.emisorDomicilio}</p>
        <p>${input.emisorEmail} | ${input.emisorTelefono}</p>
        <p>Representante Legal: ${input.emisorRepLegal}<br />C.C. No. ${input.emisorCc}</p>
      </div>
      <div class="parte-block">
        <h4>Debe a</h4>
        <p><strong>${input.clienteNombre}</strong></p>
        <p>Identificación: ${input.clienteDocumento}</p>
        <p>${input.clienteDomicilio}</p>
        <p>${input.clienteEmail} | ${input.clienteTelefono}</p>
      </div>
    </div>

    <div class="concepto-section">
      <h4>Concepto</h4>
      <div class="concepto-detalle">
        <p><strong>Contrato:</strong> ${input.contratoCodigo}</p>
        <p><strong>Objeto:</strong> ${input.contratoObjeto}</p>
        <p><strong>Hito ${input.hitoOrden}:</strong> ${input.hitoRazon}</p>
      </div>
    </div>

    <div class="valor-section">
      <h4>Valor de la Cuenta de Cobro</h4>
      <div class="valor-fila">
        <span class="label">Valor en número:</span>
        <span class="valor">${valorNumero}</span>
      </div>
      <div class="valor-fila total">
        <span class="label">Valor en letras:</span>
        <span class="valor">${input.valorLetras}</span>
      </div>
      <div class="valor-letras">
        Pagaderos a la cuenta autorizada de Hermanos García González S.A.S (NIT: ${input.emisorNit})
      </div>
    </div>

    <div class="bancos-section">
      <h4>Medio de Pago</h4>
      <div class="bancos-detalle">
        <p><strong>Entidad Bancaria:</strong> ${input.emisorBanco}</p>
        <p><strong>Tipo de Cuenta:</strong> ${input.emisorTipoCuenta}</p>
        <p><strong>Número de Cuenta:</strong> ${input.emisorNumeroCuenta}</p>
        <p><strong>Titular:</strong> ${input.emisorNombre} (NIT: ${input.emisorNit})</p>
      </div>
    </div>

    <div class="firmas-section">
      <div class="firma-box">
        <div class="firma-title">El Deudor (Cliente)</div>
        <div class="firma-line"></div>
        <div class="firma-img-wrap">
          <span class="firma-img" style="border:1px solid #999;width:24px;height:24px;display:inline-block;"></span>
          <span>Firma: ______________________</span>
        </div>
        <div class="firma-datos">
          Nombre: ${input.clienteNombre}<br />
          C.C. o NIT: ${input.clienteDocumento}
        </div>
      </div>
      <div class="firma-box">
        <div class="firma-title">El Contratista</div>
        <div class="firma-line"></div>
        <div class="firma-img-wrap">
          <img src="/firma_representante.png" alt="Firma" class="firma-img" />
          <span>Firma: ______________________</span>
        </div>
        <div class="firma-datos">
          <strong>Nombre: ${input.emisorRepLegal}</strong><br />
          Representante Legal - ${input.emisorNombre}<br />
          C.C. No. ${input.emisorCc}
        </div>
      </div>
    </div>

    <div class="pie-legal">
      Hermanos García González S.A.S · NIT 901421357-9 · Cra 72a #71A 57, Bogotá D.C., Colombia<br />
      Veta Dorada® es marca comercial registrada. Documento generado electrónicamente.
    </div>
  </div>
</body>
</html>
  `

  const template = {
    basePdf: undefined as unknown as never,
    schemas: [
      [
        {
          name: 'content',
          type: 'html',
          position: { x: 0, y: 0 },
          width: 612,
          height: 792,
          content: html,
        },
      ],
    ],
  }

  const pdfBuffer = await generate({ template, inputs: [{}] })
  return Buffer.from(pdfBuffer)
}
