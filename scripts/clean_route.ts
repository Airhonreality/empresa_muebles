import { getStrategy } from '../src/server/getStrategy';

async function run() {
  const strategy = getStrategy();
  const routes = await strategy.read('page_routes');
  const route = routes.find(r => r.data.path === '/app/production');
  if (route) {
    const routeData = route.data as { blocks?: any[] };
    routeData.blocks = (routeData.blocks || []).filter((b: any) => b.type === 'production_kanban');
    await strategy.write('page_routes', route);
    console.log('Cleaned route /app/production');
  }
}

run().catch(console.error);
