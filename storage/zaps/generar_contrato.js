const cotizacion = payload.record;
if (!cotizacion?.id) {
  api.notify.error('No hay cotización activa seleccionada.');
  return;
}

const existingContratos = await api.query('contratos');
const existing = existingContratos.find(c => c.cotizacion_id === cotizacion.id);
if (existing) {
  api.notify.error('Ya existe el contrato ' + existing.codigo_contrato + ' para esta cotización. Ve a Comercial.');
  return;
}

const clientes = await api.query('clientes');
const client = clientes.find(c => c.id === cotizacion.cliente_id);

const espacioVariantes = await api.query('espacio_variantes');
const itemsVariante = await api.query('items_variante');
const productosCatalogo = await api.query('productos_catalogo');

const mySpaces = espacioVariantes.filter(ev => ev.cotizacion_id === cotizacion.id && ev.activa);
if (!mySpaces.length) {
  api.notify.error('No hay espacios con variante activa en esta cotización. Activa al menos una variante primero.');
  return;
}

const devService = productosCatalogo.find(p => p.sku === 'SERV-DEV');
const assemblyService = productosCatalogo.find(p => p.sku === 'SERV-ASSEMBLY');
const installService = productosCatalogo.find(p => p.sku === 'SERV-INSTALL');

let grandTotal = 0;
if (devService && assemblyService && installService) {
  const RATE_DEV = Number(devService.precio_publico);
  const RATE_ASSEMBLY = Number(assemblyService.precio_publico);
  const RATE_INSTALL = Number(installService.precio_publico);
  for (const sv of mySpaces) {
    const items = itemsVariante.filter(i => i.variante_id === sv.id);
    const mats = items.reduce((s, i) => s + (Number(i.cantidad || 0) * Number(i.precio_unitario || 0)), 0);
    const labor = (Number(sv.jornadas_desarrollo_tecnico || 0) * RATE_DEV)
                + (Number(sv.jornadas_ensamblaje_taller || 0) * RATE_ASSEMBLY)
                + (Number(sv.jornadas_instalacion_obra || 0) * RATE_INSTALL);
    grandTotal += mats + labor;
  }
  grandTotal += Number(cotizacion.costos_operativos || 0)
             + Number(cotizacion.imprevistos_instalacion || 0)
             - Number(cotizacion.descuento_comercial || 0)
             + Number(cotizacion.ajuste_arbitrario || 0);
} else {
  api.notify.error('No se encontraron las tarifas de mano de obra (SERV-DEV, SERV-ASSEMBLY, SERV-INSTALL) en el catálogo.');
  return;
}

const abono1 = Math.round(grandTotal * 0.50);
const abono2 = Math.round(grandTotal * 0.25);
const abono3 = grandTotal - abono1 - abono2;

const year = new Date().getFullYear();
const count = existingContratos.length + 1;
const codigo = 'CT-' + year + '-' + String(count).padStart(3, '0');

const clientNombre = client ? (client.nombre || '') : '';
const clientDoc = client ? (client.documento || '') : '';
const clientEmail = client ? (client.email || '') : '';
const clientDomicilio = client ? (client.domicilio || '') : '';

const objetoItems = mySpaces.map((s, i) => (i + 1) + '. ' + (s.nombre_espacio || 'Espacio')).join('\n');

const fmt = v => '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP';

const emailAsunto = 'Contrato de Fabricación e Instalación — ' + (cotizacion.nombre_proyecto || 'Proyecto');
const emailCuerpo = 'Estimado/a ' + (clientNombre || '{{nombre_cliente}}') + ',\n\nNos complace presentarle el contrato correspondiente al proyecto **' + (cotizacion.nombre_proyecto || '') + '**. Adjunto encontrará el documento con todas las cláusulas acordadas.\n\n**Resumen financiero:**\n- Valor total: ' + fmt(grandTotal) + '\n- Primer anticipo (50%): ' + fmt(abono1) + ' — *Este pago activa el contrato e inicia la fabricación.*\n- Segundo pago (25%): ' + fmt(abono2) + ' — Al despachar los muebles.\n- Pago final (25%): ' + fmt(abono3) + ' — Al finalizar la instalación.\n\nPor favor revise el contrato y ante cualquier duda no dude en contactarnos.\n\nCordialmente,\n**Hermanos García González S.A.S**\nhgarciasas@gmail.com';

await api.saveItem('contratos', {
  data: {
    cotizacion_id: cotizacion.id,
    codigo_contrato: codigo,
    fecha_contrato: new Date().toISOString().split('T')[0],
    contratante_domicilio: clientDomicilio,
    plazo_ejecucion_texto: '',
    holgura_dias: 6,
    garantia_anios: Number(cotizacion.garantia_anios || 2),
    objeto_items: objetoItems,
    especificaciones_estructura: '',
    especificaciones_herrajes: '',
    especificaciones_mesones: '',
    condiciones_desmonte: '',
    valor_total: grandTotal,
    estado: 'borrador',
    email_asunto: emailAsunto,
    email_cuerpo: emailCuerpo
  }
});

await api.saveItem('cotizaciones', {
  id: cotizacion.id,
  data: { ...cotizacion, estado: 'en_contrato' }
});

api.notify.success('Contrato ' + codigo + ' creado. Ve a Comercial para completarlo y enviarlo.');