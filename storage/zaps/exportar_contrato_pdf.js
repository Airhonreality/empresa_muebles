function numeroALetras(num) {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = {
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
    25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiéster', 28: 'veintiocho', 29: 'veintinueve'
  };
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function traducirSeccion(n) {
    if (n === 0) return '';
    if (n === 100) return 'cien';
    
    let res = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (c > 0) {
      res += centenas[c] + ' ';
    }

    if (du > 0) {
      if (du < 10) {
        res += unidades[du];
      } else if (especiales[du]) {
        res += especiales[du];
      } else {
        res += decenas[d];
        if (u > 0) {
          res += ' y ' + unidades[u];
        }
      }
    }
    return res.trim();
  }

  if (num === 0) return 'cero pesos m/cte';
  
  let entero = Math.floor(num);
  let letras = '';

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidadesResto = entero % 1000;

  if (millones > 0) {
    if (millones === 1) {
      letras += 'un millón ';
    } else {
      letras += traducirSeccion(millones) + ' millones ';
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      letras += 'mil ';
    } else {
      letras += traducirSeccion(miles) + ' mil ';
    }
  }

  if (unidadesResto > 0) {
    letras += traducirSeccion(unidadesResto) + ' ';
  }

  return (letras.trim() + ' pesos m/cte').toUpperCase();
}

const contratoId = payload.contratoId;
if (!contratoId) {
  api.notify.error('Falta el ID del contrato para exportar.');
  return;
}

const contratos = await api.query('contratos');
const contrato = contratos.find(c => c.id === contratoId);
if (!contrato) {
  api.notify.error('Contrato no encontrado.');
  return;
}

const cotizaciones = await api.query('cotizaciones');
const cotizacion = cotizaciones.find(c => c.id === contrato.cotizacion_id);
if (!cotizacion) {
  api.notify.error('Cotización origen no encontrada.');
  return;
}

const clientes = await api.query('clientes');
const cliente = clientes.find(c => c.id === cotizacion.cliente_id);
if (!cliente) {
  api.notify.error('Cliente asociado no encontrado.');
  return;
}

// Formateo de fechas
const fechaStr = contrato.fecha_contrato || new Date().toISOString().split('T')[0];
const [year, month, day] = fechaStr.split('-');
const mesesStr = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
const diaContrato = parseInt(day, 10);
const mesContrato = mesesStr[parseInt(month, 10) - 1];
const anioContrato = year;

const fmtCOP = (v) => '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP';

const totalNeto = Number(contrato.valor_total || 0);
const abono1 = Math.round(totalNeto * 0.50);
const abono2 = Math.round(totalNeto * 0.25);
const abono3 = totalNeto - abono1 - abono2;

// Dividir items del objeto para pintarlos de forma limpia
const objetoItems = (contrato.objeto_items || '')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

let objetoHtml = '';
if (objetoItems.length > 0) {
  objetoHtml = '<ul>' + objetoItems.map(item => `<li>${item}</li>`).join('') + '</ul>';
} else {
  objetoHtml = '<p>Fabricación e instalación de mobiliario a medida de acuerdo con la propuesta aprobada.</p>';
}

const emailAsunto = contrato.email_asunto || `Contrato de Fabricación e Instalación — ${cotizacion.nombre_proyecto || 'Proyecto'}`;
const emailCuerpo = contrato.email_cuerpo || '';

// Generar HTML completo con el diseño legal premium
const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Fabricación e Instalación — ${contrato.codigo_contrato}</title>
  <link href="https://fonts.googleapis.com/css2?family=Georgia&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Georgia', serif;
      background-color: #FFFFFF;
      color: #222222;
      line-height: 1.6;
      padding: 50px;
      font-size: 13.5px;
      -webkit-print-color-adjust: exact;
    }
    .contract-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header-brand {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #C5A059;
      padding-bottom: 20px;
    }
    .header-brand h1 {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 20px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #1A1A1A;
    }
    .header-brand p.subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: #C5A059;
      margin-top: 5px;
    }
    .contract-title {
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 30px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #111111;
    }
    .meta-date {
      text-align: right;
      font-size: 12px;
      margin-bottom: 20px;
      color: #555555;
      font-style: italic;
    }
    .section-title {
      font-family: 'Inter', sans-serif;
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
    p, li {
      margin-bottom: 10px;
      text-align: justify;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 6px;
    }
    .clausula-header {
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 8px;
      color: #111111;
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
      font-family: 'Inter', sans-serif;
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
      font-family: 'Inter', sans-serif;
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
    @page {
      size: letter;
      margin: 1.5cm 2cm;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .contract-container {
        padding: 0;
        max-width: 100%;
      }
      .tech-specs {
        background-color: #FAF9F6 !important;
        border: 1px solid #EAE6DF !important;
      }
      .payment-table th {
        background-color: #FAFAFA !important;
      }
    }
  </style>
</head>
<body>
  <div class="contract-container">
    <div class="header-brand">
      <h1>Veta de Oro</h1>
      <p class="subtitle">Estética y Confort</p>
    </div>

    <div class="contract-title">
      Contrato de Fabricación e Instalación de Mobiliario a Medida<br>
      <span style="font-size: 12px; font-weight: normal; color: #555555; text-transform: none;">
        Código de Referencia: ${contrato.codigo_contrato}
      </span>
    </div>

    <div class="meta-date">
      Bogotá D.C., ${diaContrato} de ${mesContrato} de ${anioContrato}
    </div>

    <div class="section-title">1. Partes Contratantes</div>
    
    <table class="parties-table">
      <tr>
        <td class="col-title">EL CONTRATANTE:</td>
        <td>
          <strong>${cliente.nombre || ''}</strong><br>
          Identificación: ${cliente.documento || ''}<br>
          Domicilio de Obra: ${contrato.contratante_domicilio || cliente.domicilio || ''}<br>
          Correo: ${cliente.email || ''}<br>
          Teléfono: ${cliente.telefono || ''}
        </td>
      </tr>
      <tr style="height: 15px;"><td></td><td></td></tr>
      <tr>
        <td class="col-title">EL CONTRATISTA:</td>
        <td>
          <strong>Hermanos García González S.A.S</strong><br>
          NIT: 901421357-9<br>
          Domicilio Principal: Cra 72a 71a 57, Bogotá D.C., Colombia<br>
          Representante Legal: Airhon Javier García Rozo<br>
          C.C. No. 123.350.6023<br>
          Correo: Vetadeoro.co@gmail.com | Teléfono: 302 5922101
        </td>
      </tr>
    </table>

    <div class="section-title">2. Consideraciones Generales</div>
    <p>
      Las partes contratantes obran de estricta buena fe, con plena capacidad legal y técnica para la ejecución satisfactoria del proyecto descrito en este contrato, basándose en la Propuesta de Diseño y Presupuesto anexa de la cotización <strong>${cotizacion.nombre_proyecto || 'referenciada'}</strong>, la cual hace parte integral y vinculante de este documento.
    </p>

    <div class="section-title">3. Cláusulas del Contrato</div>

    <div class="clausula-header">PRIMERA. OBJETO DEL CONTRATO</div>
    <p>
      El Contratista se obliga a realizar la fabricación e instalación del siguiente mobiliario a medida de acuerdo con los requerimientos técnicos coordinados y validados:
    </p>
    
    ${objetoHtml}

    <p style="font-size: 12px; color: #444444; margin-top: 10px; font-style: italic;">
      Las especificaciones exactas de dimensiones, modulaciones, colores y herrajes corresponden a las descritas y renderizadas en la Propuesta de Diseño aprobada por el Contratante.
    </p>

    <p>
      <strong>Alcance y Suministros del Cliente:</strong> Nuestro servicio se enfoca en la excelencia del mobiliario, por lo que las obras civiles, plomería, instalaciones de gas, conexiones eléctricas y acabados de muros de la vivienda no están incluidos. 
      <em>Trabajo en equipo:</em> Para garantizar que su proyecto quede perfecto, le solicitamos amablemente compartirnos las fichas técnicas de los electrodomésticos, lavaplatos o herrajes que usted adquiera por su cuenta antes de iniciar la fabricación. Esto nos permite diseñar a la medida exacta y evitar posibles reprocesos, costos adicionales o tiempos de espera originados por elementos que no encajen. ¡Su colaboración oportuna es clave para el éxito del diseño!
    </p>

    ${(contrato.especificaciones_estructura || contrato.especificaciones_herrajes || contrato.especificaciones_mesones || contrato.condiciones_desmonte) ? `
      <div class="tech-specs">
        <div class="tech-specs-title">Especificaciones Técnicas Acordadas</div>
        <div class="tech-grid">
          ${contrato.especificaciones_estructura ? `<div class="tech-item"><strong>Estructura y Material:</strong> ${contrato.especificaciones_estructura}</div>` : ''}
          ${contrato.especificaciones_herrajes ? `<div class="tech-item"><strong>Herrajes y Bisagras:</strong> ${contrato.especificaciones_herrajes}</div>` : ''}
          ${contrato.especificaciones_mesones ? `<div class="tech-item"><strong>Mesones / Superficies:</strong> ${contrato.especificaciones_mesones}</div>` : ''}
          ${contrato.condiciones_desmonte ? `<div class="tech-item"><strong>Desmonte / Disposición:</strong> ${contrato.condiciones_desmonte}</div>` : ''}
        </div>
      </div>
    ` : ''}

    <div class="clausula-header">SEGUNDA. PLAZOS Y CONDICIONES DE ENTREGA</div>
    <p>
      El presente contrato entrará en vigencia a partir del momento en que se confirme el pago del primer anticipo (50%) y se realice la validación técnica final de diseños y medidas en el sitio de la obra. 
      El plazo de ejecución estimado para la entrega e instalación es de <strong>${contrato.plazo_ejecucion_texto || '4 a 5'} semanas hábiles</strong>.
    </p>
    <p>
      <strong>Holgura Operativa:</strong> Se establece un margen de holgura operativa de hasta <strong>${contrato.holgura_dias || 8} días hábiles adicionales</strong> sobre el plazo de entrega original para realizar ajustes menores, calibración de bisagras o remates visuales finales. Estos pequeños detalles no darán lugar a penalizaciones ni retrasarán la exigibilidad del pago final.
    </p>
    <p>
      <strong>Recepción Tácita y Acta:</strong> La entrega formal del proyecto se surtirá mediante la suscripción conjunta del Acta de Entrega de Mobiliario. En caso de que el Contratante se negase a suscribir dicha acta sin justificación técnica y objetiva, o si comenzare a hacer uso, ocupación o explotación física del mobiliario instalado, se entenderá por recibida la obra de manera tácita y a entera satisfacción, habilitando el cobro inmediato del saldo restante.
    </p>

    <div class="clausula-header">TERCERA. MANEJO DE ADICIONALES</div>
    <p>
      Cualquier modificación sobre los diseños aprobados, cambio de color/textura posterior al inicio de producción, o trabajo extra no contemplado en la propuesta original, deberá ser solicitado y aprobado formalmente por escrito (correo electrónico o servicio de mensajería instantánea de datos). Sin este acuerdo que exprese el nuevo precio y el impacto sobre los tiempos de entrega, el Contratista no estará obligado a ejecutar dichos cambios.
    </p>

    <div class="clausula-header">CUARTA. GARANTÍA DEL SERVICIO</div>
    <p>
      El Contratista otorga una garantía de calidad y estabilidad de <strong>${contrato.garantia_anios || 2} años</strong> a partir del Acta de Entrega, la cual cubre defectos de fabricación de la estructura modular y fallos derivados directamente de la instalación física.
    </p>
    <p>
      <strong>Exclusiones de Garantía:</strong> Esta garantía no cubre daños provocados por mal uso, limpieza con químicos abrasivos, humedad estructural proveniente de muros o tuberías de la edificación, exposición excesiva a la luz solar directa, plagas de insectos, accidentes o manipulación técnica realizada por terceros ajenos al Contratista.
    </p>
    <p>
      <strong>Herrajes e Iluminación:</strong> La garantía de sistemas electrónicos, iluminación LED, electrodomésticos o herrajes mecánicos de marca corresponderá estrictamente a la ofrecida de forma directa por el fabricante de dichos insumos.
    </p>

    <div class="clausula-header">QUINTA. CONDICIONES DE PAGO</div>
    <p>
      El valor total del presente contrato asciende a la suma de <strong>${fmtCOP(totalNeto)}</strong> (<em>${numeroALetras(totalNeto)}</em>), pagaderos a la cuenta autorizada de Hermanos García González S.A.S bajo los siguientes hitos de avance:
    </p>

    <table class="payment-table">
      <thead>
        <tr>
          <th>Hito de Pago</th>
          <th>Porcentaje</th>
          <th style="text-align: right;">Monto (COP)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Primer Anticipo (Firma y Planificación):</strong> Indispensable para realizar compra de tableros e iniciar fabricación en taller.</td>
          <td>50%</td>
          <td class="amount">${fmtCOP(abono1)}</td>
        </tr>
        <tr>
          <td><strong>Segundo Pago (Ingreso y Montaje):</strong> Al momento del ingreso del mobiliario al domicilio de obra e inicio de instalación en sitio.</td>
          <td>25%</td>
          <td class="amount">${fmtCOP(abono2)}</td>
        </tr>
        <tr>
          <td><strong>Pago Final (Finalización de Obra):</strong> Al concluir la instalación principal del mobiliario dejándolo en condiciones operativas y funcionales.</td>
          <td>25%</td>
          <td class="amount">${fmtCOP(abono3)}</td>
        </tr>
      </tbody>
    </table>

    <div class="clausula-header">SEXTA. CORRESPONSABILIDAD Y RESOLUCIÓN CONTRACTUAL</div>
    <p>
      Las partes acuerdan que el retraso en la entrega no generará penalidades contra el Contratista si obedece a retrasos de los importadores de tableros/herrajes debidamente demostrados, falta de acceso físico al inmueble en los horarios permitidos, retrasos en las obras de terceros (ej. mesones no instalados a tiempo o muros sin plomo) o fuerza mayor.
    </p>
    <p>
      <strong>Ruptura de la Buena Fe:</strong> El Contratista se reserva el derecho de suspender de forma temporal o definitiva la instalación o liquidar el contrato en el estado en que se encuentre si el Contratante ejerce hostilidad, maltrato o acoso hacia el personal de instalación, o si condiciona el pago del segundo abono o saldo final a exigencias imprevistas no pactadas.
    </p>

    <div class="clausula-header">SÉPTIMA. MÉRITO EJECUTIVO</div>
    <p>
      Las partes acuerdan que el presente contrato presta mérito ejecutivo de acuerdo con la legislación colombiana para la exigencia judicial del cumplimiento de todas las obligaciones de dar, hacer y pagar contenidas en él.
    </p>

    <div class="section-title">4. Medios de Pago Autorizados</div>
    <p>
      Los pagos deberán ser transferidos directamente a la cuenta corporativa oficial del contratista:
      <br><strong>Entidad Bancaria:</strong> Bancolombia
      <br><strong>Tipo de Cuenta:</strong> Cuenta de Ahorros
      <br><strong>Número de Cuenta:</strong> 62700003257
      <br><strong>Titular:</strong> Hermanos García González S.A.S (NIT: 901421357-9)
    </p>

    <div class="signatures-section">
      <div class="signature-box" style="margin-top: 30px;">
        <div class="signature-title">EL CONTRATANTE</div>
        <br><br><br>
        Firma: ___________________________<br>
        Nombre: ${cliente.nombre || ''}<br>
        C.C. o NIT: ${cliente.documento || ''}
      </div>
      
      <div class="signature-box" style="margin-top: 30px;">
        <div class="signature-title">EL CONTRATISTA</div>
        <br><br><br>
        <span style="position: relative; display: inline-block;">
          <img src="/firma_representante.png" style="height: 75px; position: absolute; bottom: -10px; left: 40px; mix-blend-mode: multiply;" />
          Firma: ___________________________
        </span><br>
        Nombre: Airhon Javier García Rozo<br>
        Representante Legal - Hermanos García González S.A.S<br>
        C.C. No. 123.350.6023
      </div>
    </div>
  </div>
</body>
</html>`;

api.dispatchEvent('print_pdf', { html: fullHtml });
api.notify.success(`Contrato ${contrato.codigo_contrato} generado e impreso correctamente.`);
