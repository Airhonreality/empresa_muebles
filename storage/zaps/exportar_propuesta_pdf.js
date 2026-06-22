const activeRecord = payload.record;
if (!activeRecord || !activeRecord.id) {
  api.notify.error("No hay ninguna cotización activa seleccionada para exportar.");
  return;
}

function safeEncodeURI(url) {
  if (!url) return "";
  try {
    return encodeURI(decodeURI(url));
  } catch (e) {
    return encodeURI(url);
  }
}

api.notify.success("Generando Layout Premium para Veta de Oro...");

const cotizaciones = await api.query("cotizaciones");
const activeCotizacion = cotizaciones.find(c => c.id === activeRecord.id);

if (!activeCotizacion) {
  api.notify.error("No se encontró el registro de la cotización activa.");
  return;
}

const clientes = await api.query("clientes");
const client = clientes.find(c => c.id === activeCotizacion.cliente_id);

const espacioVariantes = await api.query("espacio_variantes");
const itemsVariante = await api.query("items_variante");
const productosCatalogo = await api.query("productos_catalogo");
const imagenesEspacio = await api.query("imagenes_espacio");

// 🏛️ READ LABOR DAILY RATES STRICTLY FROM THE CATALOG MASTER SKUS
const devService = productosCatalogo.find(p => p.sku === "SERV-DEV");
const assemblyService = productosCatalogo.find(p => p.sku === "SERV-ASSEMBLY");
const installService = productosCatalogo.find(p => p.sku === "SERV-INSTALL");

if (!devService || !assemblyService || !installService) {
  api.notify.error("Error estructural: No se encontraron las tarifas de Mano de Obra (SERV-DEV, SERV-ASSEMBLY, SERV-INSTALL) en el catálogo.");
  return;
}

const RATE_DEV = Number(devService.precio_publico);
const RATE_ASSEMBLY = Number(assemblyService.precio_publico);
const RATE_INSTALL = Number(installService.precio_publico);

// 1. Group items by variants and spaces
const mySpaces = espacioVariantes
  .filter(ev => ev.cotizacion_id === activeCotizacion.id && ev.visible_pdf !== false)
  .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

// Resolve all variant names present in this quote (e.g. "Inicial", etc.)
const variantNames = Array.from(new Set(mySpaces.map(ev => ev.nombre_variante).filter(Boolean)));

const variantTotals = {};
const variantSpacesBreakdown = {};

// Calculate totals for each variant option
for (const vName of variantNames) {
  let subtotalMaterials = 0;
  let subtotalLabor = 0;
  const spacesList = [];

  const spacesInVariant = mySpaces.filter(ev => ev.nombre_variante === vName);

  for (const sv of spacesInVariant) {
    const items = itemsVariante.filter(item => item.variante_id === sv.id);
    let spaceMaterialsSum = 0;

    const itemsDetail = items.map(item => {
      const prod = productosCatalogo.find(p => p.id === item.catalogo_id);
      const desc = prod ? prod.descripcion : (item.nombre_personalizado || "Insumo");
      const unit = prod ? prod.unidad_medida : (item.unidad_medida || "ud");
      const qty = Number(item.cantidad || 0);
      const price = Number(item.precio_unitario || 0);
      const lineTotal = qty * price;

      spaceMaterialsSum += lineTotal;
      return {
        desc,
        unit,
        qty,
        price,
        lineTotal,
        catalogo_id: item.catalogo_id,
        sku: prod ? (prod.sku || "") : "",
        imagen_url: prod ? (prod.imagen_url || "") : ""
      };
    });

    let images = [];
    if (sv.imagenes) {
      try {
        const parsed = JSON.parse(sv.imagenes);
        if (Array.isArray(parsed)) {
          images = parsed.map((url, idx) => ({
            id: `sv-img-${idx}`,
            imagen_url: url,
            descripcion: "",
            orden: idx
          }));
        }
      } catch (e) {
        images = sv.imagenes.split(',').map((url, idx) => ({
          id: `sv-img-${idx}`,
          imagen_url: url.trim(),
          descripcion: "",
          orden: idx
        })).filter(img => img.imagen_url);
      }
    }
    if (images.length === 0) {
      images = imagenesEspacio
        .filter(img => img.espacio_variante_id === sv.id)
        .map(img => ({
          id: img.id,
          imagen_url: img.imagen_url || "",
          descripcion: img.descripcion || "",
          orden: Number(img.orden || 0)
        }))
        .sort((a, b) => a.orden - b.orden);
    }

    let colorsList = [];
    if (sv.colores) {
      try {
        const parsed = JSON.parse(sv.colores);
        if (Array.isArray(parsed)) {
          colorsList = parsed;
        }
      } catch (e) {}
    }

    const daysDev = Number(sv.jornadas_desarrollo_tecnico || 0);
    const daysAssembly = Number(sv.jornadas_ensamblaje_taller || 0);
    const daysInstall = Number(sv.jornadas_instalacion_obra || 0);

    const spaceLaborSum = (daysDev * RATE_DEV) + (daysAssembly * RATE_ASSEMBLY) + (daysInstall * RATE_INSTALL);
    const spaceTotal = spaceMaterialsSum + spaceLaborSum;

    subtotalMaterials += spaceMaterialsSum;
    subtotalLabor += spaceLaborSum;

    spacesList.push({
      id: sv.id,
      name: sv.nombre_espacio || "Espacio sin nombre",
      descripcion: sv.descripcion || "",
      descripcion_alternativa: sv.descripcion_alternativa || "",
      items: itemsDetail,
      images,
      colors: colorsList,
      materialsSum: spaceMaterialsSum,
      laborSum: spaceLaborSum,
      days: { dev: daysDev, assembly: daysAssembly, install: daysInstall },
      total: spaceTotal,
      isActive: !!sv.activa
    });
  }

  const baseSubtotal = subtotalMaterials + subtotalLabor;
  const opCosts = Number(activeCotizacion.costos_operativos || 0);
  const imprevistos = Number(activeCotizacion.imprevistos_instalacion || 0);
  const discount = Number(activeCotizacion.descuento_comercial || 0);
  const adjustment = Number(activeCotizacion.ajuste_arbitrario || 0);

  const grandTotal = baseSubtotal + opCosts + imprevistos - discount + adjustment;

  variantTotals[vName] = {
    materials: subtotalMaterials,
    labor: subtotalLabor,
    subtotal: baseSubtotal,
    grandTotal: grandTotal
  };
  variantSpacesBreakdown[vName] = spacesList;
}

// 2. Identify the active/selected variant
const activeSpace = mySpaces.find(ev => ev.activa);
let activeVariantName = activeSpace ? (activeSpace.nombre_variante || "Inicial") : (variantNames[0] || "Inicial");
const activeTotals = variantTotals[activeVariantName] || { materials: 0, labor: 0, subtotal: 0, grandTotal: 0 };

// 3. Compile dynamic pdfTitle using project name + client name
const projectName = activeCotizacion.nombre_proyecto || "";
const clientName = client ? (client.nombre || "") : "";
const pdfTitle = [projectName, clientName].filter(Boolean).join(" - ").trim() || "Propuesta Comercial";

// 4. Compile executive options delta
const baselineName = variantNames[0] || "Inicial";
const optionsHtml = Object.entries(variantTotals).map(([vName, totals]) => {
  const isSelected = vName === activeVariantName;
  const diff = totals.grandTotal - (variantTotals[baselineName] ? variantTotals[baselineName].grandTotal : totals.grandTotal);
  const diffFormatted = diff === 0 
    ? "Línea Base" 
    : (diff > 0 ? "+ $" + diff.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "- $" + Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2 }));

  return `
    <div class="option-card ${isSelected ? 'selected' : ''}">
      <div class="option-header">
        <span class="option-title">${vName.toUpperCase()}</span>
        ${isSelected && variantNames.length > 1 ? '<span class="selected-badge">SELECCIONADA</span>' : ''}
      </div>
      <div class="option-price">$ ${totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="option-diff">Ajuste sobre ${baselineName}: <strong>${diffFormatted}</strong></div>
    </div>
  `;
}).join("");

// 5. Compile detailed spaces breakdown HTML for ALL variants
let spacesHtml = '';
let isFirstVariant = true;
for (const vName of variantNames) {
  const spacesList = variantSpacesBreakdown[vName] || [];
  
  const pageBreakStyle = isFirstVariant ? '' : 'page-break-before: always; break-before: page; ';
  isFirstVariant = false;
  
  spacesHtml += ' \
    <div class="variant-breakdown-section" style="' + pageBreakStyle + 'margin-top: 30px;">' +
      '<h3 class="section-title" style="margin-bottom: 25px; border-bottom: 2px solid #C5A059; padding-bottom: 8px; font-size: 15px; color: #4A4238;">' +
        'Detalle de Propuesta: Alternativa ' + vName.toUpperCase() +
      '</h3>';
  
  const spacesBreakdownHtml = spacesList.map((space, sIdx) => {
    const itemsRows = space.items.map(item => `
      <tr>
        <td>${item.desc}</td>
        <td class="center">${item.qty} ${item.unit}</td>
        <td class="right">$ ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="right">$ ${item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    let imagesHtml = '';
    let colorsHtml = '';

    if (space.colors && space.colors.length > 0) {
      colorsHtml = `
        <div class="space-colors-section" style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
          <h4 style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8C7E6B; font-weight: 700;">Colores y Acabados Seleccionados:</h4>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            ${space.colors.map(col => ' \
              <div style="display: flex; flex-direction: column; background-color: #FCFAF6; border: 1px solid #E5DEC9; border-radius: 8px; width: 120px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03); text-align: center; page-break-inside: avoid; break-inside: avoid;">' +
                '<div style="width: 100%; height: 90px; border-bottom: 1px solid #E5DEC9; overflow: hidden; background-color: #eee;">' +
                  '<img src="' + safeEncodeURI(col.imagen_url) + '" style="width: 100%; height: 100%; object-fit: cover;" />' +
                '</div>' +
                '<div style="padding: 6px 4px; font-size: 10px; font-weight: 600; color: #4A4238; word-break: break-word; line-height: 1.2;">' +
                  col.nombre +
                '</div>' +
              '</div>'
            ).join("")}
          </div>
        </div>
      `;
    }

    if (space.images && space.images.length > 0) {
      imagesHtml = `
        <div class="space-gallery" style="width: 100%; margin-bottom: 25px;">
          ${space.images.map(img => ' \
            <div style="width: 100%; margin-bottom: 15px; border-radius: 8px; overflow: hidden;">' +
              '<img src="' + safeEncodeURI(img.imagen_url) + '" style="width: 100%; height: auto; display: block;" />' +
            '</div>'
          ).join("")}
        </div>
      `;
    }

    const descHtml = space.descripcion 
      ? '<p style="font-size: 11px; color: #666666; margin-bottom: 10px; line-height: 1.5; font-style: italic;">' + space.descripcion + '</p>'
      : '';
    const descAltHtml = space.descripcion_alternativa
      ? '<p style="font-size: 11px; color: #8A7A5F; margin-bottom: 12px; line-height: 1.5; background-color: #FAF8F5; border-left: 2px solid #C5A059; padding: 6px 12px; border-radius: 0 4px 4px 0;"><strong>Detalles de Alternativa:</strong> ' + space.descripcion_alternativa + '</p>'
      : '';

    return `
      <div class="space-section">
        <h3 class="space-title">Espacio: ${space.name}</h3>
        ${descHtml}
        ${descAltHtml}
        ${imagesHtml}
        ${colorsHtml}
        <table class="items-table">
          <thead>
            <tr>
              <th>Ítem / Componente</th>
              <th class="center" style="width: 100px;">Cantidad</th>
              <th class="right" style="width: 150px;">Precio Unit.</th>
              <th class="right" style="width: 150px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows.length > 0 ? itemsRows : '<tr><td colspan="4" class="empty-row">No hay insumos cargados en este espacio.</td></tr>'}
          </tbody>
        </table>

        <div class="labor-bar-collapsed">
          <span class="labor-summary-title">Mano de Obra Estimada:</span>
          <span class="labor-summary-days">
            $ ${space.laborSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div class="space-totals">
          <div class="space-total-line">Subtotal Materiales: <span>$ ${space.materialsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
          <div class="space-total-line">Subtotal Mano de Obra: <span>$ ${space.laborSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
          <div class="space-total-line space-grand">Subtotal Espacio: <span>$ ${space.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
        </div>
      </div>
    `;
  }).join("");

  spacesHtml += spacesBreakdownHtml;

  const totals = variantTotals[vName] || { materials: 0, labor: 0, subtotal: 0, grandTotal: 0 };
  const discountVal = Number(activeCotizacion.descuento_comercial || 0);
  const descuentoRow = discountVal > 0 
    ? `
    <div class="final-line discount">
      <span>Descuento Comercial:</span>
      <span>- $ ${discountVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>
    ` : '';

  const adjustmentVal = Number(activeCotizacion.ajuste_arbitrario || 0);
  const ajusteRow = adjustmentVal !== 0 
    ? `
    <div class="final-line">
      <span>Ajuste Técnico:</span>
      <span>$ ${adjustmentVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>
    ` : '';

  const consolidatedCardHtml = `
    <div class="final-totals-container" style="margin-top: 40px; page-break-inside: avoid; break-inside: avoid;">
      <div class="final-totals-card">
        <div class="final-totals-header">Resumen Financiero (${vName.toUpperCase()})</div>
        <div class="totals-grid-layout">
          <div class="totals-details-col">
            <div class="final-line">
              <span>Subtotal Materiales:</span>
              <span>$ ${totals.materials.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="final-line">
              <span>Subtotal Mano de Obra:</span>
              <span>$ ${totals.labor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="final-line">
              <span>Costos Operativos Globales:</span>
              <span>$ ${Number(activeCotizacion.costos_operativos || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="final-line">
              <span>Imprevistos de Instalación:</span>
              <span>$ ${Number(activeCotizacion.imprevistos_instalacion || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div class="totals-grand-col">
            ${descuentoRow}
            ${ajusteRow}
            <div class="final-line grand-total">
              <span>Total Neto Propuesta:</span>
              <span>$ ${totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  spacesHtml += consolidatedCardHtml;
  spacesHtml += '</div>'; // Close variant-breakdown-section
}

const _tpls = await api.query('templates');
const _tpl = _tpls.find(t => t.name === 'propuesta_comercial');
if (!_tpl || !_tpl.html) { api.notify.error('Template propuesta_comercial no encontrado.'); return; }
let template = _tpl.html;

// 7. Compile dynamic client and obra columns (removing blank fields completely)
let clientHtml = "";
const clientDoc = client ? (client.documento || "") : "";
const clientTel = client ? (client.telefono || "") : "";
const clientMail = client ? (client.email || "") : "";

if (clientName || clientDoc || clientTel || clientMail) {
  clientHtml = `
    <div class="info-block">
      <h4>Información del Cliente</h4>
      ${clientName ? `<p><strong>Cliente:</strong> ${clientName}</p>` : ''}
      ${clientDoc ? `<p><strong>Documento:</strong> ${clientDoc}</p>` : ''}
      ${clientTel ? `<p><strong>Teléfono:</strong> ${clientTel}</p>` : ''}
      ${clientMail ? `<p><strong>Correo:</strong> ${clientMail}</p>` : ''}
    </div>
  `;
}

let obraHtml = "";
const obraAddress = activeCotizacion.direccion_obra || "";
const obraDays = activeCotizacion.dias_entrega_estimados ? activeCotizacion.dias_entrega_estimados + " días hábiles" : "";
const obraGarantia = activeCotizacion.garantia_anios ? activeCotizacion.garantia_anios + " años" : "";

if (projectName || obraAddress || obraDays || obraGarantia) {
  obraHtml = `
    <div class="info-block">
      <h4>Condiciones de la Obra</h4>
      ${projectName ? `<p><strong>Proyecto:</strong> ${projectName}</p>` : ''}
      ${obraAddress ? `<p><strong>Dirección:</strong> ${obraAddress}</p>` : ''}
      ${obraDays ? `<p><strong>Días de Entrega:</strong> ${obraDays}</p>` : ''}
      ${obraGarantia ? `<p><strong>Garantía Estructura:</strong> ${obraGarantia}</p>` : ''}
    </div>
  `;
}

let infoGridHtml = "";
if (clientHtml && obraHtml) {
  infoGridHtml = clientHtml + obraHtml;
} else if (clientHtml || obraHtml) {
  infoGridHtml = (clientHtml || obraHtml).replace('class="info-block"', 'class="info-block full-width"');
}

// Spaces list on cover
const activeSpacesList = variantSpacesBreakdown[activeVariantName] || [];
const uniqueSpaceNames = Array.from(new Set(mySpaces.map(ev => ev.nombre_espacio?.trim()).filter(Boolean)));
const spacesListHtml = uniqueSpaceNames.map(name => `
  <div class="cover-space-item">
    <span class="bullet">✦</span>
    <span class="name">${name}</span>
  </div>
`).join("");

const fullHtml = template
  .replace('{{pdfTitle}}', pdfTitle)
  .replace('{{spacesListHtml}}', spacesListHtml)
  .replace('{{proposalNumber}}', '2026-A' + activeCotizacion.id.substring(0, 4).toUpperCase())
  .replace('{{proposalDate}}', new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }))
  .replace('{{infoGridHtml}}', infoGridHtml)
  .replace('{{optionsHtml}}', optionsHtml)
  .replace('{{activeVariantName}}', 'Alternativas')
  .replace('{{activeVariantName}}', 'Alternativas')
  .replace('{{spacesHtml}}', spacesHtml);

api.dispatchEvent("print_pdf", { html: fullHtml });
api.notify.success("¡Propuesta Comercial exportada exitosamente a PDF!");