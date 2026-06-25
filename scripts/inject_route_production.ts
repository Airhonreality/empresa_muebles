import { getStrategy } from '../src/server/getStrategy';
import { randomUUID } from 'crypto';

async function run() {
  const strategy = getStrategy();
  
  // 1. Verificar si la ruta /app/production ya existe
  const routes = await strategy.read('page_routes');
  const existingRoute = routes.find(r => r.data.path === '/app/production');

  const blocks = [
    {
      id: randomUUID(),
      type: "production_kanban",
      context: "proyectos"
    },
    {
      id: randomUUID(),
      type: "widget_armado_orden_compra",
      context: "obligaciones_pendientes"
    }
  ];

  if (existingRoute) {
    // Si existe, actualizar sus bloques
    existingRoute.data.blocks = blocks;
    await strategy.write('page_routes', existingRoute);
    console.log('Ruta /app/production actualizada exitosamente.');
  } else {
    // Si no existe, crearla
    await strategy.write('page_routes', {
      id: randomUUID(),
      context: 'page_routes',
      data: {
        path: '/app/production',
        blocks: blocks
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Ruta /app/production creada exitosamente.');
  }
}

run().catch(console.error);
