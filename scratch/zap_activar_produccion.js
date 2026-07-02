const cotizacion = payload.record;
if (!cotizacion?.id) {
  api.notify.error('No hay cotización activa seleccionada.');
  return;
}

const contratos = await api.query('contratos');
const contrato = contratos.find(c => c.proyecto_id === cotizacion.id);
if (!contrato) {
  api.notify.error('No se encontró ningún contrato para este proyecto. Genera primero el contrato.');
  return;
}

// 1. Firmar el contrato
await api.saveItem('contratos', {
  id: contrato.id,
  data: { ...contrato, estado: 'firmado' }
});

// 2. Transicionar el proyecto a producción
const proyectos = await api.query('proyectos');
const proyecto = proyectos.find(p => p.id === cotizacion.id);
if (proyecto) {
  await api.saveItem('proyectos', {
    id: proyecto.id,
    data: { ...proyecto, estado: 'produccion' }
  });
}

// 3. Crear Orden de Trabajo automática si no existe
const existingOrders = await api.query('ordenes_trabajo');
const existing = existingOrders.find(o => o.proyecto_id === cotizacion.id);
if (!existing) {
  const year = new Date().getFullYear();
  const count = existingOrders.length + 1;
  const codigo = 'OT-' + year + '-' + String(count).padStart(3, '0');
  const dias = cotizacion.dias_entrega_estimados || cotizacion.data?.dias_entrega_estimados;
  let fechaEntrega = '';
  if (dias) {
    const d = new Date();
    d.setDate(d.getDate() + Number(dias));
    fechaEntrega = d.toISOString().split('T')[0];
  }
  await api.saveItem('ordenes_trabajo', {
    data: {
      proyecto_id: cotizacion.id,
      codigo_orden: codigo,
      estado: 'pendiente',
      fecha_entrega: fechaEntrega,
      notas: 'Creada automáticamente por el comercial al enviar a producción.'
    }
  });
}

api.notify.success('Proyecto enviado a producción y contrato firmado exitosamente.');
