const cotizacion = payload.record;
if (!cotizacion?.id) {
  api.notify.error('No hay cotización activa seleccionada.');
  return;
}

const existingContratos = await api.query('contratos');
const existing = existingContratos.find(c => c.proyecto_id === cotizacion.id);

const clientes = await api.query('clientes');
const client = clientes.find(c => c.id === cotizacion.cliente_id);

const espacioVariantes = await api.query('espacio_variantes');
const itemsVariante = await api.query('items_variante');
const productosCatalogo = await api.query('productos_catalogo');

const mySpaces = espacioVariantes.filter(ev => ev.proyecto_id === cotizacion.id && ev.activa);
if (!mySpaces.length) {
  api.notify.error('No hay espacios con variante activa en esta cotización. Activa al menos una variante primero.');
  return;
}

const devService = productosCatalogo.find(p => p.sku === 'SERV-DEV');
const assemblyService = productosCatalogo.find(p => p.sku === 'SERV-ASSEMBLY');
const installService = productosCatalogo.find(p => p.sku === 'SERV-INSTALL');

let grandTotal = 0;
const RATE_DEV = Number(devService ? (devService.precio_publico || devService.precio_directo) : 185000) || 185000;
const RATE_ASSEMBLY = Number(assemblyService ? (assemblyService.precio_publico || assemblyService.precio_directo) : 185000) || 185000;
const RATE_INSTALL = Number(installService ? (installService.precio_publico || installService.precio_directo) : 185000) || 185000;

for (const sv of mySpaces) {
  const items = itemsVariante.filter(i => i.variante_id === sv.id);
  const mats = items.reduce((s, i) => {
    const qty = Number(i.cantidad || 0);
    const price = Number(i.precio_unitario || 0);
    const lt = (i.total_linea !== undefined && i.total_linea !== null && i.total_linea !== '') ? Number(i.total_linea) : (qty * price);
    return s + lt;
  }, 0);
  const labor = (Number(sv.jornadas_desarrollo_tecnico || 0) * RATE_DEV)
              + (Number(sv.jornadas_ensamblaje_taller || 0) * RATE_ASSEMBLY)
              + (Number(sv.jornadas_instalacion_obra || 0) * RATE_INSTALL);
  grandTotal += mats + labor;
}
grandTotal += Number(cotizacion.costos_operativos || 0)
           + Number(cotizacion.imprevistos_instalacion || 0)
           - Number(cotizacion.descuento_comercial || 0)
           + Number(cotizacion.ajuste_arbitrario || 0);

// Si el usuario proporcionó datos del cliente en el payload, sincronizar cliente primero
let clientId = cotizacion.cliente_id || (client ? client.id : 'cli_' + Date.now());
if (payload.cliente && payload.cliente.nombre) {
  const existingCliData = client ? (client.data || client) : {};
  await api.saveItem('clientes', {
    id: clientId,
    data: {
      ...existingCliData,
      nombre: payload.cliente.nombre,
      documento: payload.cliente.documento || existingCliData.documento || '',
      domicilio: payload.cliente.domicilio || existingCliData.domicilio || '',
      email: payload.cliente.email || existingCliData.email || '',
      telefono: payload.cliente.telefono || existingCliData.telefono || ''
    }
  });
}

const cForm = payload.contrato || {};
const valorTotalFinal = Number(cForm.valor_total || grandTotal);

const abono1 = Math.round(valorTotalFinal * 0.50);
const abono2 = Math.round(valorTotalFinal * 0.25);
const abono3 = valorTotalFinal - abono1 - abono2;

const year = new Date().getFullYear();
const count = existingContratos.length + (existing ? 0 : 1);
const codigo = existing ? (existing.codigo_contrato || existing.data?.codigo_contrato) : ('CT-' + year + '-' + String(count).padStart(3, '0'));

const clientNombre = payload.cliente?.nombre || (client ? (client.nombre || '') : '');
const clientEmail = payload.cliente?.email || (client ? (client.email || '') : '');
const clientDomicilio = payload.cliente?.domicilio || (client ? (client.domicilio || '') : '');

const defaultObjeto = mySpaces.map((s, i) => (i + 1) + '. ' + (s.nombre_espacio || 'Espacio')).join('\n');
const objetoItems = cForm.objeto_items || defaultObjeto;

const fmt = v => '$' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' COP';

const emailAsunto = cForm.email_asunto || ('Contrato de Fabricación e Instalación — ' + (cotizacion.nombre_proyecto || 'Proyecto'));
const emailCuerpo = cForm.email_cuerpo || ('Estimado/a ' + (clientNombre || '{{nombre_cliente}}') + ',\n\nNos complace adjuntar el contrato digital correspondiente al proyecto **' + (cotizacion.nombre_proyecto || '') + '**.\n\n**Estructura de Abonos:**\n- Valor total: ' + fmt(valorTotalFinal) + '\n- Primer anticipo (50%): ' + fmt(abono1) + ' (Activa fabricación)\n- Segundo pago (25%): ' + fmt(abono2) + ' (Al iniciar instalación)\n- Pago final (25%): ' + fmt(abono3) + ' (Al finalizar la instalación)\n\nPor favor revise el documento legal y nos confirma su aceptación para proceder.\n\nCordialmente,\n**Hermanos García González S.A.S**\nvetadeoro.co@gmail.com');

const contratoId = existing ? existing.id : 'con_' + Date.now();
const savedContrato = await api.saveItem('contratos', {
  id: contratoId,
  data: {
    proyecto_id: cotizacion.id,
    codigo_contrato: codigo,
    fecha_contrato: cForm.fecha_contrato || (existing?.fecha_contrato || new Date().toISOString().split('T')[0]),
    contratante_domicilio: clientDomicilio,
    plazo_ejecucion_texto: cForm.plazo_ejecucion_texto || '4 a 5',
    holgura_dias: Number(cForm.holgura_dias ?? 8),
    garantia_anios: Number(cForm.garantia_anios ?? cotizacion.garantia_anios ?? 2),
    objeto_items: objetoItems,
    especificaciones_estructura: cForm.especificaciones_estructura || '',
    especificaciones_herrajes: cForm.especificaciones_herrajes || '',
    especificaciones_mesones: cForm.especificaciones_mesones || '',
    condiciones_desmonte: cForm.condiciones_desmonte || '',
    valor_total: valorTotalFinal,
    estado: existing ? (existing.estado || existing.data?.estado || 'borrador') : 'borrador',
    email_asunto: emailAsunto,
    email_cuerpo: emailCuerpo
  }
});

await api.saveItem('proyectos', {
  id: cotizacion.id,
  data: {
    ...cotizacion,
    cliente_id: clientId,
    direccion_obra: clientDomicilio || cotizacion.direccion_obra || '',
    garantia_anios: Number(cForm.garantia_anios ?? cotizacion.garantia_anios ?? 2),
    estado: 'en_contrato'
  }
});

api.notify.success('Contrato ' + codigo + ' compilado y guardado axiomáticamente.');