/**
 * Generador de PDF para cotizaciones
 * Usa @pdfme/generator con templates definidos como objetos TypeScript
 * Tokens D4 aplicados directamente (no variables CSS con fallbacks)
 */

import { generate } from '@pdfme/generator';
import type { Template } from '@pdfme/common';

// Tokens D4 como constantes (ya definidos en globals.css)
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
};

// Datos de entrada para la plantilla
export interface CotizacionPDFInput {
  pdfTitle: string;
  proposalNumber: string;
  proposalDate: string;
  infoGridHtml: string;
  optionsHtml: string;
  spacesHtml: string;
  activeVariantName: string;
}

// Función principal para generar PDF de cotización
export async function generarPDFCotizacion(input: CotizacionPDFInput): Promise<Buffer> {
  // Crear el HTML con los datos
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${input.pdfTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;700;800;900&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: ${D4_TOKENS.bgRaised};
      color: ${D4_TOKENS.textPrimary};
      line-height: 1.6;
      padding: 40px;
      -webkit-print-color-adjust: exact;
    }

    .quote-container {
      max-width: 900px;
      margin: 0 auto;
      border: 1px solid ${D4_TOKENS.borderSubtle};
      padding: 50px;
      background: ${D4_TOKENS.bgRaised};
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    }

    .brand-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid ${D4_TOKENS.brand};
      padding-bottom: 25px;
      margin-bottom: 40px;
    }

    .brand-logo h1 {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 0.15em;
      color: ${D4_TOKENS.textPrimary};
      text-transform: uppercase;
    }

    .brand-subtitle {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: ${D4_TOKENS.brand};
      margin-top: 4px;
    }

    .brand-contact {
      font-size: 9.5px;
      font-weight: 600;
      color: ${D4_TOKENS.textMuted};
      margin-top: 8px;
      letter-spacing: 0.05em;
      text-transform: none;
    }

    .proposal-meta {
      text-align: right;
    }

    .proposal-meta h2 {
      font-family: 'Alegreya Sans', sans-serif;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 0.05em;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 6px;
    }

    .proposal-meta p {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: ${D4_TOKENS.textMuted};
      letter-spacing: 0.1em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }

    .info-block h4 {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 10px;
      border-bottom: 1px solid ${D4_TOKENS.gold300};
      padding-bottom: 4px;
    }

    .info-block p {
      font-size: 12px;
      color: ${D4_TOKENS.textMuted};
      margin-bottom: 4px;
    }

    .info-block strong {
      color: ${D4_TOKENS.textPrimary};
      font-weight: 700;
    }

    .info-block.full-width {
      grid-column: span 2;
    }

    .section-title {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 20px;
      border-left: 3.5px solid ${D4_TOKENS.brand};
      padding-left: 12px;
    }

    .options-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 45px;
    }

    .option-card {
      border: 1px solid ${D4_TOKENS.borderSubtle};
      border-radius: 6px;
      padding: 20px;
      background: ${D4_TOKENS.bgAlt};
      transition: all 0.3s ease;
    }

    .option-card.selected {
      border-color: ${D4_TOKENS.brand};
      background: ${D4_TOKENS.gold100};
      box-shadow: 0 4px 15px rgba(139, 105, 20, 0.08);
    }

    .option-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .option-title {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.textMuted};
    }

    .option-card.selected .option-title {
      color: ${D4_TOKENS.brand};
    }

    .selected-badge {
      font-size: 8px;
      font-weight: 900;
      color: #FFFFFF;
      background: ${D4_TOKENS.brand};
      padding: 2px 6px;
      border-radius: 20px;
      letter-spacing: 0.05em;
    }

    .option-price {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 6px;
    }

    .space-section {
      border: 1px solid ${D4_TOKENS.borderSubtle};
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 35px;
    }

    .space-title {
      font-family: 'Alegreya Sans', sans-serif;
      font-weight: 800;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 15px;
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
      padding-bottom: 8px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }

    .items-table th {
      background: ${D4_TOKENS.bgAlt};
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.textMuted};
      padding: 10px 15px;
      text-align: left;
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
    }

    .items-table td {
      padding: 12px 15px;
      font-size: 11.5px;
      color: ${D4_TOKENS.textMuted};
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
    }

    .items-table tr:last-child td {
      border-bottom: none;
    }

    .items-table .center { text-align: center; }
    .items-table .right { text-align: right; }

    .space-totals {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    .space-total-line {
      font-size: 11px;
      color: ${D4_TOKENS.textMuted};
      width: 250px;
      display: flex;
      justify-content: space-between;
    }

    .space-total-line span {
      font-weight: 600;
      color: ${D4_TOKENS.textPrimary};
    }

    .space-total-line.space-grand {
      font-weight: 600;
      border-top: 1px solid ${D4_TOKENS.borderSubtle};
      padding-top: 6px;
      color: ${D4_TOKENS.textPrimary};
      font-size: 12px;
    }

    .space-total-line.space-grand span {
      color: ${D4_TOKENS.brand};
      font-weight: 800;
    }

    .notes-section {
      background: ${D4_TOKENS.bgAlt};
      border-left: 2px solid ${D4_TOKENS.brand};
      padding: 20px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 45px;
      page-break-inside: avoid;
    }

    .notes-section h4 {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 12px;
    }

    .notes-section ol { padding-left: 15px; }
    .notes-section li {
      font-size: 11px;
      color: ${D4_TOKENS.textMuted};
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .final-totals-container {
      display: flex;
      justify-content: center;
      page-break-inside: avoid;
      margin-top: 30px;
      margin-bottom: 45px;
    }

    .final-totals-card {
      border: 1.5px solid ${D4_TOKENS.brand};
      background: ${D4_TOKENS.gold100};
      width: 100%;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(139, 105, 20, 0.04);
    }

    .totals-grid-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 40px;
    }

    .totals-details-col {
      border-right: 1px solid ${D4_TOKENS.gold300};
      padding-right: 40px;
    }

    .final-totals-header {
      font-family: 'Alegreya Sans', sans-serif;
      font-weight: 800;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
      padding-bottom: 10px;
      margin-bottom: 15px;
      color: ${D4_TOKENS.textPrimary};
    }

    .final-line {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: ${D4_TOKENS.textMuted};
      margin-bottom: 8px;
    }

    .final-line.discount {
      color: #660000;
      font-weight: 600;
    }

    .final-line.grand-total {
      border-top: 2px solid ${D4_TOKENS.brand};
      padding-top: 12px;
      margin-top: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: ${D4_TOKENS.textPrimary};
    }

    .final-line.grand-total span {
      color: ${D4_TOKENS.brand};
      font-weight: 800;
    }

    .technical-notes-wrapper {
      page-break-before: always;
      page-break-inside: avoid;
      min-height: 720px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
      position: relative;
      padding: 40px 0;
    }

    .technical-notes-wrapper::before,
    .technical-notes-wrapper::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, ${D4_TOKENS.brand}, transparent);
    }

    .technical-notes-wrapper::before { top: 0; }
    .technical-notes-wrapper::after { bottom: 0; }

    .technical-notes-section {
      background: ${D4_TOKENS.gold100};
      border-left: 3px solid ${D4_TOKENS.brand};
      border-right: 1px solid ${D4_TOKENS.borderSubtle};
      border-top: 1px solid ${D4_TOKENS.borderSubtle};
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
      padding: 25px 30px;
      border-radius: 0 8px 8px 0;
      margin: 0;
    }

    .technical-notes-section h4 {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 15px;
      border-bottom: 1px solid ${D4_TOKENS.borderSubtle};
      padding-bottom: 8px;
    }

    .closing-page { page-break-before: always; padding-top: 40px; }

    .closing-title {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-align: center;
      color: ${D4_TOKENS.textPrimary};
      margin-bottom: 50px;
      border-bottom: 2px solid ${D4_TOKENS.brand};
      padding-bottom: 20px;
      text-transform: uppercase;
    }

    .policy-block {
      max-width: 700px;
      margin: 0 auto;
    }

    .policy-block h4 {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 20px;
      border-bottom: 1px solid ${D4_TOKENS.gold300};
      padding-bottom: 8px;
      text-align: center;
    }

    .policy-text {
      font-size: 12px;
      color: ${D4_TOKENS.textMuted};
      line-height: 1.8;
      text-align: justify;
    }

    .policy-text p { margin-bottom: 16px; }
    .notes-list { padding-left: 20px; }
    .notes-list li {
      font-size: 11px;
      color: ${D4_TOKENS.textMuted};
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .financial-terms-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      border-top: 1px solid ${D4_TOKENS.borderSubtle};
      padding-top: 30px;
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .term-block h5 {
      font-family: 'Alegreya Sans', sans-serif;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${D4_TOKENS.brand};
      margin-bottom: 15px;
    }

    .term-block p {
      font-size: 12px;
      color: ${D4_TOKENS.textMuted};
      margin-bottom: 8px;
      line-height: 1.6;
    }

    .term-block p strong { color: ${D4_TOKENS.textPrimary}; }

    .legal-footer {
      text-align: center;
      font-size: 9.5px;
      color: ${D4_TOKENS.textMuted};
      border-top: 1px solid ${D4_TOKENS.borderSubtle};
      padding-top: 20px;
      letter-spacing: 0.05em;
      margin-top: 40px;
      font-weight: 600;
    }

    @page { size: letter; margin: 1.8cm 2cm; }
    @media print {
      body { padding: 0; background: transparent; }
      .quote-container { border: none; box-shadow: none; padding: 30px 40px; max-width: 100%; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="quote-container">
    <header class="brand-section">
      <div class="brand-logo">
        <h1>Veta de Oro</h1>
        <p class="brand-subtitle">Estetica y Confort</p>
        <p class="brand-contact">302 5922101 &nbsp;&nbsp;|&nbsp;&nbsp; www.vetadeoro.co &nbsp;&nbsp;|&nbsp;&nbsp; Cra 72A 71A 57</p>
      </div>
      <div class="proposal-meta">
        <h2>PROPUESTA COMERCIAL</h2>
        <p>Nº de Propuesta: ${input.proposalNumber}</p>
        <p>Fecha de Emisión: ${input.proposalDate}</p>
      </div>
    </header>

    <section class="info-grid">
      ${input.infoGridHtml}
    </section>

    <h3 class="section-title">1. Resumen de Cotización</h3>
    <section class="options-container">
      ${input.optionsHtml}
    </section>

    <h3 class="section-title">2. Desglose Detallado de Propuesta (${input.activeVariantName})</h3>
    <section class="breakdown-container">
      ${input.spacesHtml}
    </section>

    <div class="technical-notes-wrapper">
      <section class="technical-notes-section">
        <h4>Consideraciones Importantes</h4>
        <ol class="notes-list">
          <li><strong>Mano de Obra Civil</strong> Esta cotización contempla únicamente los servicios de fabricación e instalación de la cocina integral. Si se requiere obra civil, debe realizarse con un profesional especializado, veta de oro podrá suministrar contactos de confianza, sin embargo el contrato con terceros será ajeno a la empresa.</li>
          <li><strong>Selección de Acabados:</strong> La textura final y tonos se elegirán sobre muestras físicas que presentaremos antes de la producción.</li>
          <li><strong>Vigencia:</strong> Esta propuesta tiene una validez de 15 días hábiles a partir de la fecha de emisión.</li>
        </ol>
      </section>
    </div>

    <section class="closing-page">
      <div class="closing-grid">
        <div class="policy-block">
          <h4>Políticas Veta de Oro</h4>
          <div class="policy-text">
            <p>En Veta de Oro diseñamos y fabricamos sin intermediarios. Nuestro proceso es directo, preciso y sin margen para errores: lo que diseñamos es exactamente lo que usted recibe.</p>
            <p>Más de 25 años de experiencia respaldan nuestra calidad. Contamos con un equipo especializado en carpintería, enchapado y acabados, asegurando ejecución impecable en cada detalle.</p>
            <p>Lo que nos distingue no es solo la estética, sino la precisión. Creamos espacios con carácter, hechos para durar, reflejando su estilo sin concesiones.</p>
          </div>
        </div>
      </div>

      <div class="financial-terms-grid">
        <div class="term-block">
          <h5>Avances y Anticipos</h5>
          <p><strong>50%</strong> producción</p>
          <p><strong>25%</strong> Pre-entrega</p>
          <p><strong>25%</strong> Entrega</p>
        </div>
        <div class="term-block">
          <h5>Medios de Pago</h5>
          <p>Bancolombia</p>
          <p>Efectivo</p>
          <p>Tarjeta de crédito <em>(incrementará 2% x cobros de comisión)</em></p>
        </div>
      </div>

      <div class="legal-footer">
        Veta de Oro es una firma de diseño de Hermanos García Gonzalez SAS | NIT 901421357-9
      </div>
    </section>
  </div>
</body>
</html>
`;

  // Usar @pdfme/generator para crear el PDF
  // Para HTML simple, usamos un template básico
  const template = {
    basePdf: null as never,
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
  };

  const pdfBuffer = await generate({ template, inputs: [{}] });
  return Buffer.from(pdfBuffer);
}

export default { generarPDFCotizacion };
