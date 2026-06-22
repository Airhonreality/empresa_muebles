const cotizacion = payload.record;
if (!cotizacion?.id) {
  api.notify.error('No hay cotización activa seleccionada.');
  return;
}

const existingOrders = await api.query('ordenes_trabajo');
const existing = existingOrders.find(o => o.cotizacion_id === cotizacion.id);
if (existing) {
  api.notify.error('Ya existe la orden ' + existing.codigo_orden + ' para esta cotización. Ve a Producción.');
  return;
}

const year = new Date().getFullYear();
const count = existingOrders.length + 1;
const codigo = 'OT-' + year + '-' + String(count).padStart(3, '0');

const dias = cotizacion.data?.dias_entrega_estimados;
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
    notas: ''
  }
});

api.notify.success('Orden ' + codigo + ' creada exitosamente. Ve a Producción para gestionarla.');