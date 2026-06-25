import { getStrategy } from '../src/server/getStrategy';

async function run() {
  const strategy = getStrategy();
  const routes = await strategy.read('page_routes');
  
  const route = routes.find(r => r.data.path === '/app/erp/taller');
  if (route) {
    const kanbanBlock = route.data.blocks.find((b: any) => b.type === 'production_kanban');
    if (kanbanBlock) {
      kanbanBlock.context = 'ordenes_trabajo'; // ¡Esto es crucial!
    }
    await strategy.write('page_routes', route);
    console.log('Contexto corregido a ordenes_trabajo en /app/erp/taller');
  }
}

run().catch(console.error);
