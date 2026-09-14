'use client'

import { useParams } from 'next/navigation'
import { CotizadorCompatProvider, useCotizadorCompat } from '@/lib/data/queries/cotizador-compat'
import { Button } from '@/components/veta/button'

// Plantilla del contrato de fabricación e instalación (t-163, 2026-09-14).
// Adaptada de la plantilla del sistema legacy (`legacy-agnostic-backup:
// src/server/scripts/exportar_contrato_pdf.js`), que coincide con el PDF de
// cliente proporcionado por Javier ("Contrato de fabricacion e instalación -
// Alberts Jamit Enríquez Chenas VF.pdf"). Cambio de marca: "Veta de Oro" → "Veta
// Dorada". Mecanismo elegido por el Supervisor: página imprimible + window.print()
// (mismo patrón que la propuesta pública), NO PDF binario.
//
// Principio axiomático (t-162): este documento NO recalcula el total. El cotizador
// es quien suma (materiales + MO + costos + imprevistos − descuento + ajuste + IVA)
// y el contrato absorbe ese valor final como dato de entrada. Los montos de los
// hitos se derivan del valorTotal absorbido y del porcentaje/monto fijo de cada
// hito persistido (tabla hitos_pago), nunca sumando materiales/mo por separado.

function numeroALetras(num: number): string {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const especiales: Record<number, string> = {
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
    25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve',
  }
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  function traducirSeccion(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cien'
    let res = ''
    const c = Math.floor(n / 100)
    const d = Math.floor((n % 100) / 10)
    const u = n % 10
    const du = n % 100
    if (c > 0) res += centenas[c] + ' '
    if (du > 0) {
      if (du < 10) {
        res += unidades[du]
      } else if (especiales[du]) {
        res += especiales[du]
      } else {
        res += decenas[d]
        if (u > 0) res += ' y ' + unidades[u]
      }
    }
    return res.trim()
  }

  if (num === 0) return 'cero pesos m/cte'
  const entero = Math.floor(num)
  let letras = ''
  const millones = Math.floor(entero / 1000000)
  const miles = Math.floor((entero % 1000000) / 1000)
  const unidadesResto = entero % 1000
  if (millones > 0) {
    letras += millones === 1 ? 'un millón ' : traducirSeccion(millones) + ' millones '
  }
  if (miles > 0) {
    letras += miles === 1 ? 'mil ' : traducirSeccion(miles) + ' mil '
  }
  if (unidadesResto > 0) letras += traducirSeccion(unidadesResto) + ' '
  return (letras.trim() + ' pesos m/cte').toUpperCase()
}

function fmtCOP(v: number): string {
  return '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP'
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function fechaLarga(iso: string | null): { dia: string; mes: string; anio: string } | null {
  if (!iso) return null
  const [year, month, day] = iso.slice(0, 10).split('-')
  if (!year || !month || !day) return null
  return { dia: day, mes: MESES[parseInt(month, 10) - 1] ?? month, anio: year }
}

export default function ContratoPrintPage() {
  const params = useParams()
  const proyectoId = params.proyectoId as string
  return (
    <CotizadorCompatProvider proyectoId={proyectoId}>
      <ContratoPrintInner proyectoId={proyectoId} />
    </CotizadorCompatProvider>
  )
}

function ContratoPrintInner({ proyectoId }: { proyectoId: string }) {
  const { store, cargando } = useCotizadorCompat()
  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cliente = proyecto?.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
  const contrato = store.contratos.porProyecto(proyectoId)
  const hitosList = contrato ? store.hitos.porContrato(contrato.id) : []

  if (cargando) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-text-muted">Cargando contrato…</p>
  }

  if (!contrato || !proyecto) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-text-muted">Contrato no generado para este proyecto.</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={() => window.history.back()}>
            ← Volver
          </Button>
        </div>
      </div>
    )
  }

  const totalNeto = parseNum(contrato.valorTotal)
  const fecha = fechaLarga(contrato.fechaContrato)

  const objetoItems = (contrato.objetoItems ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let objetoHtml = ''
  if (objetoItems.length > 0) {
    objetoHtml = '<ul>' + objetoItems.map((item) => `<li>${item}</li>`).join('') + '</ul>'
  } else {
    objetoHtml = '<p>Fabricación e instalación de mobiliario a medida de acuerdo con la propuesta aprobada.</p>'
  }

  // Tabla de pagos: cada hito persistido con su % o monto fijo; el monto COP se deriva
  // del valorTotal absorbido de la cotización (t-162) — nunca se suma material por acá.
  const filas = hitosList
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((h) => {
      const pct = h.tipo === 'percentage' ? parseNum(h.montoOPorcentaje) : null
      const monto = h.tipo === 'percentage' ? Math.round((totalNeto * (pct ?? 0)) / 100) : parseNum(h.montoOPorcentaje)
      return {
        etiqueta: h.razon || (h.tipo === 'percentage' ? `${pct}%` : 'Pago'),
        etiquetaCorta: '',
        descripcion: h.razon || '',
        porcentaje: pct !== null ? `${pct}%` : '—',
        montoCop: fmtCOP(monto),
      }
    })
  if (filas.length === 0) {
    filas.push({
      etiqueta: 'Primer Anticipo (Firma y Planificación)',
      etiquetaCorta: '',
      descripcion: 'Indispensable para realizar compra de tableros e iniciar fabricación en taller.',
      porcentaje: '50%',
      montoCop: fmtCOP(Math.round(totalNeto * 0.5)),
    })
    filas.push({
      etiqueta: 'Segundo Pago (Ingreso y Montaje)',
      etiquetaCorta: '',
      descripcion: 'Al momento del ingreso del mobiliario al domicilio de obra e inicio de instalación en sitio.',
      porcentaje: '25%',
      montoCop: fmtCOP(Math.round(totalNeto * 0.25)),
    })
    filas.push({
      etiqueta: 'Pago Final (Finalización de Obra)',
      etiquetaCorta: '',
      descripcion: 'Al concluir la instalación principal del mobiliario dejándolo en condiciones operativas y funcionales.',
      porcentaje: '25%',
      montoCop: fmtCOP(totalNeto - Math.round(totalNeto * 0.5) - Math.round(totalNeto * 0.25)),
    })
  }

  const hayEspecificaciones = !!(contrato.especificacionesEstructura || contrato.especificacionesHerrajes || contrato.especificacionesMesones || contrato.especificacionesDesmonte)

  return (
    <>
      {/* Barra de acciones — oculta al imprimir */}
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

      <div className="contract-print">
        <div className="header-brand">
          <h1>Veta Dorada</h1>
          <p className="subtitle">Estética y Confort</p>
        </div>

        <div className="contract-title">
          Contrato de Fabricación e Instalación de Mobiliario a Medida
          <br />
          <span className="ref">Código de Referencia: {contrato.codigoContrato}</span>
        </div>

        {fecha && (
          <div className="meta-date">
            Bogotá D.C., {fecha.dia} de {fecha.mes} de {fecha.anio}
          </div>
        )}

        <div className="section-title">1. Partes Contratantes</div>

        <table className="parties-table">
          <tbody>
            <tr>
              <td className="col-title">EL CONTRATANTE:</td>
              <td>
                <strong>{cliente?.nombre ?? ''}</strong><br />
                Identificación: {cliente?.documento ?? ''}<br />
                Domicilio de Obra: {contrato.contratanteDomicilio || cliente?.domicilio || ''}<br />
                Correo: {cliente?.email ?? ''}<br />
                Teléfono: {cliente?.telefono ?? ''}
              </td>
            </tr>
            <tr style={{ height: 15 }}><td /><td /></tr>
            <tr>
              <td className="col-title">EL CONTRATISTA:</td>
              <td>
                <strong>Hermanos García González S.A.S</strong><br />
                NIT: 901421357-9<br />
                Domicilio Principal: Cra 72a 71a 57, Bogotá D.C., Colombia<br />
                Representante Legal: Airhon Javier García Rozo<br />
                C.C. No. 123.350.6023<br />
                Correo: Vetadeoro.co@gmail.com | Teléfono: 302 5922101
              </td>
            </tr>
          </tbody>
        </table>

        <div className="section-title">2. Consideraciones Generales</div>
        <p>
          Las partes contratantes obran de estricta buena fe, con plena capacidad legal y técnica para la ejecución satisfactoria del proyecto descrito en este contrato, basándose en la Propuesta de Diseño y Presupuesto anexa de la cotización <strong>{proyecto.nombreProyecto}</strong>, la cual hace parte integral y vinculante de este documento.
        </p>

        <div className="section-title">3. Cláusulas del Contrato</div>

        <div className="clausula-header">PRIMERA. OBJETO DEL CONTRATO</div>
        <p>
          El Contratista se obliga a realizar la fabricación e instalación del siguiente mobiliario a medida de acuerdo con los requerimientos técnicos coordinados y validados:
        </p>

        <div dangerouslySetInnerHTML={{ __html: objetoHtml }} />

        <p className="italic-note">
          Las especificaciones exactas de dimensiones, modulaciones, colores y herrajes corresponden a las descritas y renderizadas en la Propuesta de Diseño aprobada por el Contratante.
        </p>

        <p>
          <strong>Exclusiones y Suministros del Cliente:</strong> Se excluyen del alcance de este contrato todo tipo de obras civiles, plomería, instalaciones de gas, conexiones eléctricas y pintura de muros ajenos al mobiliario en sí.
          <em> Importante:</em> Los electrodomésticos, lavaplatos, herrajes especiales o cubiertas suministrados por el Contratante deberán contar con sus respectivas fichas técnicas oficiales entregadas al Contratista antes del inicio de la fabricación. Cualquier reproceso, ajuste o retraso derivado de medidas erróneas, omisión de fichas técnicas o entrega tardía de estos elementos por parte del Contratante generará un cobro adicional por concepto de mano de obra y materiales de modificación, y suspenderá los plazos pactados.
        </p>

        {hayEspecificaciones && (
          <div className="tech-specs">
            <div className="tech-specs-title">Especificaciones Técnicas Acordadas</div>
            <div className="tech-grid">
              {contrato.especificacionesEstructura && (
                <div className="tech-item"><strong>Estructura y Material:</strong> {contrato.especificacionesEstructura}</div>
              )}
              {contrato.especificacionesHerrajes && (
                <div className="tech-item"><strong>Herrajes y Bisagras:</strong> {contrato.especificacionesHerrajes}</div>
              )}
              {contrato.especificacionesMesones && (
                <div className="tech-item"><strong>Mesones / Superficies:</strong> {contrato.especificacionesMesones}</div>
              )}
              {contrato.especificacionesDesmonte && (
                <div className="tech-item"><strong>Desmonte / Disposición:</strong> {contrato.especificacionesDesmonte}</div>
              )}
            </div>
          </div>
        )}

        <div className="clausula-header">SEGUNDA. PLAZOS Y CONDICIONES DE ENTREGA</div>
        <p>
          El presente contrato entrará en vigencia a partir del momento en que se confirme el pago del primer anticipo (50%) y se realice la validación técnica final de diseños y medidas en el sitio de la obra.
          El plazo de ejecución estimado para la entrega e instalación es de <strong>{contrato.plazoEjecucionTexto || '4 a 5'} semanas hábiles</strong>.
        </p>
        <p>
          <strong>Holgura Operativa:</strong> Se establece un margen de holgura operativa de hasta <strong>{contrato.holguraDias || 8} días hábiles adicionales</strong> sobre el plazo de entrega original para realizar ajustes menores, calibración de bisagras o remates visuales finales. Estos pequeños detalles no darán lugar a penalizaciones ni retrasarán la exigibilidad del pago final.
        </p>
        <p>
          <strong>Recepción Tácita y Acta:</strong> La entrega formal del proyecto se surtirá mediante la suscripción conjunta del Acta de Entrega de Mobiliario. En caso de que el Contratante se negase a suscribir dicha acta sin justificación técnica y objetiva, o si comenzare a hacer uso, ocupación o explotación física del mobiliario instalado, se entenderá por recibida la obra de manera tácita y a entera satisfacción, habilitando el cobro inmediato del saldo restante.
        </p>

        <div className="clausula-header">TERCERA. MANEJO DE ADICIONALES</div>
        <p>
          Cualquier modificación sobre los diseños aprobados, cambio de color/textura posterior al inicio de producción, o trabajo extra no contemplado en la propuesta original, deberá ser solicitado y aprobado formalmente por escrito (correo electrónico o servicio de mensajería instantánea de datos). Sin este acuerdo que exprese el nuevo precio y el impacto sobre los tiempos de entrega, el Contratista no estará obligado a ejecutar dichos cambios.
        </p>

        <div className="clausula-header">CUARTA. GARANTÍA DEL SERVICIO</div>
        <p>
          El Contratista otorga una garantía de calidad y estabilidad de <strong>{contrato.garantiaAnios || 2} años</strong> a partir del Acta de Entrega, la cual cubre defectos de fabricación de la estructura modular y fallos derivados directamente de la instalación física.
        </p>
        <p>
          <strong>Exclusiones de Garantía:</strong> Esta garantía no cubre daños provocados por mal uso, limpieza con químicos abrasivos, humedad estructural proveniente de muros o tuberías de la edificación, exposición excesiva a la luz solar directa, plagas de insectos, accidentes o manipulación técnica realizada por terceros ajenos al Contratista.
        </p>
        <p>
          <strong>Herrajes e Iluminación:</strong> La garantía de sistemas electrónicos, iluminación LED, electrodomésticos o herrajes mecánicos de marca corresponderá estrictamente a la ofrecida de forma directa por el fabricante de dichos insumos.
        </p>

        <div className="clausula-header">QUINTA. CONDICIONES DE PAGO</div>
        <p>
          El valor total del presente contrato asciende a la suma de <strong>{fmtCOP(totalNeto)}</strong> (<em>{numeroALetras(totalNeto)}</em>), pagaderos a la cuenta autorizada de Hermanos García González S.A.S bajo los siguientes hitos de avance:
        </p>

        <table className="payment-table">
          <thead>
            <tr>
              <th>Hito de Pago</th>
              <th>Porcentaje</th>
              <th style={{ textAlign: 'right' }}>Monto (COP)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td>{f.etiqueta}{f.descripcion ? `: ${f.descripcion}` : ''}</td>
                <td>{f.porcentaje}</td>
                <td className="amount">{f.montoCop}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="clausula-header">SEXTA. CORRESPONSABILIDAD Y RESOLUCIÓN CONTRACTUAL</div>
        <p>
          Las partes acuerdan que el retraso en la entrega no generará penalidades contra el Contratista si obedece a retrasos de los importadores de tableros/herrajes debidamente demostrados, falta de acceso físico al inmueble en los horarios permitidos, retrasos en las obras de terceros (ej. mesones no instalados a tiempo o muros sin plomo) o fuerza mayor.
        </p>
        <p>
          <strong>Ruptura de la Buena Fe:</strong> El Contratista se reserva el derecho de suspender de forma temporal o definitiva la instalación o liquidar el contrato en el estado en que se encuentre si el Contratante ejerce hostilidad, maltrato o acoso hacia el personal de instalación, o si condiciona el pago del segundo abono o saldo final a exigencias imprevistas no pactadas.
        </p>

        <div className="clausula-header">SÉPTIMA. MÉRITO EJECUTIVO</div>
        <p>
          Las partes acuerdan que el presente contrato presta mérito ejecutivo de acuerdo con la legislación colombiana para la exigencia judicial del cumplimiento de todas las obligaciones de dar, hacer y pagar contenidas en él.
        </p>

        <div className="section-title">4. Medios de Pago Autorizados</div>
        <p>
          Los pagos deberán ser transferidos directamente a la cuenta corporativa oficial del contratista:
        </p>
        <p>
          <strong>Entidad Bancaria:</strong> Bancolombia<br />
          <strong>Tipo de Cuenta:</strong> Cuenta de Ahorros<br />
          <strong>Número de Cuenta:</strong> 62700003257<br />
          <strong>Titular:</strong> Hermanos García González S.A.S (NIT: 901421357-9)
        </p>

        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-title">EL CONTRATANTE</div>
            <br /><br /><br />
            Firma: ___________________________<br />
            Nombre: {cliente?.nombre ?? ''}<br />
            C.C. o NIT: {cliente?.documento ?? ''}
          </div>

          <div className="signature-box">
            <div className="signature-title">EL CONTRATISTA</div>
            <br /><br /><br />
            <span className="firma-wrap">
              <img src="/firma_representante.png" alt="Firma" className="firma-img" />
              Firma: ___________________________
            </span><br />
            Nombre: Airhon Javier García Rozo<br />
            Representante Legal - Hermanos García González S.A.S<br />
            C.C. No. 123.350.6023
          </div>
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 1.5cm 2cm;
        }
        .contract-print {
          max-width: 800px;
          margin: 0 auto;
          padding: 50px 20px 20px;
          font-family: Georgia, serif;
          color: #222222;
          line-height: 1.6;
          font-size: 13.5px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-brand {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #C5A059;
          padding-bottom: 20px;
        }
        .header-brand h1 {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1A1A1A;
          margin: 0;
        }
        .header-brand p.subtitle {
          font-family: Inter, sans-serif;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #C5A059;
          margin: 5px 0 0;
        }
        .contract-title {
          text-align: center;
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #111111;
        }
        .contract-title .ref {
          font-size: 12px;
          font-weight: normal;
          color: #555555;
          text-transform: none;
        }
        .meta-date {
          text-align: right;
          font-size: 12px;
          margin-bottom: 20px;
          color: #555555;
          font-style: italic;
        }
        .section-title {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 25px;
          margin-bottom: 10px;
          color: #111111;
          border-bottom: 1px solid #EAEAEA;
          padding-bottom: 4px;
        }
        .parties-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .parties-table td {
          padding: 6px 12px;
          vertical-align: top;
          font-size: 13px;
        }
        .parties-table td.col-title {
          font-weight: bold;
          width: 180px;
          color: #333333;
        }
        .contract-print p, .contract-print li {
          margin-bottom: 10px;
          text-align: justify;
        }
        .contract-print ul, .contract-print ol {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        .contract-print li {
          margin-bottom: 6px;
        }
        .clausula-header {
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
          color: #111111;
        }
        .italic-note {
          font-size: 12px;
          color: #444444;
          margin-top: 10px;
          font-style: italic;
        }
        .tech-specs {
          background-color: #FAF9F6;
          border: 1px solid #EAE6DF;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 12.5px;
        }
        .tech-specs-title {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8C7343;
          margin-bottom: 8px;
        }
        .tech-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
        }
        .tech-item strong {
          color: #444444;
        }
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .payment-table th, .payment-table td {
          border: 1px solid #EAEAEA;
          padding: 8px 12px;
          font-size: 12px;
        }
        .payment-table th {
          background-color: #FAFAFA;
          font-weight: bold;
          text-align: left;
        }
        .payment-table td.amount {
          font-family: Inter, sans-serif;
          font-weight: 600;
          text-align: right;
        }
        .signatures-section {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          page-break-inside: avoid;
        }
        .signature-box {
          border-top: 1px solid #222222;
          padding-top: 10px;
          font-size: 12px;
          position: relative;
        }
        .signature-title {
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .firma-wrap {
          position: relative;
          display: inline-block;
        }
        .firma-img {
          height: 75px;
          position: absolute;
          bottom: -10px;
          left: 40px;
          mix-blend-mode: multiply;
        }
        @media print {
          .contract-print {
            max-width: 100%;
            padding: 0;
          }
          .tech-specs {
            background-color: #FAF9F6 !important;
            border: 1px solid #EAE6DF !important;
          }
          .payment-table th {
            background-color: #FAFAFA !important;
          }
        }
      `}</style>
    </>
  )
}