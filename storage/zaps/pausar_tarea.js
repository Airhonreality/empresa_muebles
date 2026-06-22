const tarea = payload.record;
if (!tarea?.id) { api.notify.error('Sin tarea activa.'); return; }
const tasks = await api.query('tareas_produccion');
const existing = tasks.find(t => t.id === tarea.id);
if (!existing) { api.notify.error('Tarea no encontrada.'); return; }
await api.saveItem('tareas_produccion', { id: tarea.id, data: { ...existing, estado: 'pausada' } });
api.notify.success('Tarea pausada.');