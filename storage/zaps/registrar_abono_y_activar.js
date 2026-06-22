const abono = payload.record;
if (!abono?.id) { api.notify.error('Sin abono activo.'); return; }

const abonos = await api.query('abonos_contrato');
const thisAbono = abonos.find(a => a.id === abono.id);
if (!thisAbono) { api.notify.error('Abono no encontrado.'); return; }

if (String(thisAbono.numero_abono) !== '1') {
  api.notify.success('Abono ' + thisAbono.numero_abono + ' registrado.');
  return;
}

const contratos = await api.query('contratos');
const contrato = contratos.find(c => c.id === thisAbono.contrato_id);
if (!contrato) { api.notify.error('Contrato no encontrado.'); return; }

const cotizaciones = await api.query('cotizaciones');
const cotizacion = cotizaciones.find(c => c.id === contrato.cotizacion_id);
if (!cotizacion) { api.notify.error('Cotización no encontrada.'); return; }

const existingOrders = await api.query('ordenes_trabajo');
const existing = existingOrders.find(o => o.cotizacion_id === cotizacion.id);

if (!existing) {
  const year = new Date().getFullYear();
  const count = existingOrders.length + 1;
  const codigo = 'OT-' + year + '-' + String(count).padStart(3, '0');
  const dias = cotizacion.dias_entrega_estimados;
  let fechaEntrega = '';
  if (dias) {
    const d = new Date();
    d.setDate(d.getDate() + Number(dias));
    fechaEntrega = d.toISOString().split('T')[0];
  }
  await api.saveItem('ordenes_trabajo', {
    data: {
      cotizacion_id: cotizacion.id,
      codigo_orden: codigo,
      estado: 'pendiente',
      fecha_entrega: fechaEntrega,
      notas: 'Creada automáticamente al recibir primer anticipo de ' + contrato.codigo_contrato
    }
  });
}

await api.saveItem('cotizaciones', {
  id: cotizacion.id,
  data: { ...cotizacion, estado: 'produccion' }
});

await api.saveItem('contratos', {
  id: contrato.id,
  data: { ...contrato, estado: 'firmado' }
});

api.notify.success('Primer anticipo registrado. Proyecto ' + (cotizacion.nombre_proyecto || '') + ' enviado a Producción.');