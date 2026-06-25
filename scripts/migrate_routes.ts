import { getStrategy } from '../src/server/getStrategy';

async function run() {
  const strategy = getStrategy();
  const routes = await strategy.read('page_routes');
  
  for (const route of routes) {
    if (route.data.path === '/app/production') {
      route.data.path = '/app/erp/taller';
      await strategy.write('page_routes', route);
      console.log('Migrada ruta de producción a /app/erp/taller');
    }
    if (route.data.path === '/app/proyectos') {
      route.data.path = '/app/erp/comercial';
      await strategy.write('page_routes', route);
      console.log('Migrada ruta comercial a /app/erp/comercial');
    }
    if (route.data.path === '/app/finanzas') {
      route.data.path = '/app/erp/finanzas';
      await strategy.write('page_routes', route);
      console.log('Migrada ruta de finanzas a /app/erp/finanzas');
    }
  }
}

run().catch(console.error);
