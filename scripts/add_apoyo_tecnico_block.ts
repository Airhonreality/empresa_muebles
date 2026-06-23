import { getStrategy } from '../src/server/getStrategy';

async function main() {
  const adapter = getStrategy();
  console.log('Reading page_routes...');
  const routes = await adapter.read('page_routes') as any[];
  
  const route = routes.find((r: any) => r.data?.path === '/app/quoting/:id');
  if (!route) {
    console.error('Route /app/quoting/:id not found!');
    process.exit(1);
  }
  
  // Check if block_apoyo_tecnico already exists to prevent duplicate insertion
  const exists = route.data.blocks.some((b: any) => b.id === 'block_apoyo_tecnico');
  if (exists) {
    console.log('Block block_apoyo_tecnico already exists in /app/quoting/:id.');
    return;
  }
  
  const headerFormIndex = route.data.blocks.findIndex((b: any) => b.id === 'block_header_form');
  if (headerFormIndex === -1) {
    console.error('block_header_form not found in /app/quoting/:id!');
    process.exit(1);
  }
  
  const newBlock = {
    id: 'block_apoyo_tecnico',
    type: 'collection',
    context: 'apoyo_tecnico',
    schema_id: 'c694a5dd-c6cb-430e-806e-892cebb1147c',
    config: {
      parent_key: 'cotizacion_id',
      intent: 'create_and_list',
      title: 'Apoyo Técnico — Retoma y Requisitos',
      subtitle: 'Fotografías de retoma, diagramas, visitas y lista de requisitos del cliente',
      isCollapsible: true,
      defaultCollapsed: true,
      singular: 'Registro'
    }
  };
  
  // Insert right after block_header_form
  route.data.blocks.splice(headerFormIndex + 1, 0, newBlock);
  route.updated_at = new Date().toISOString();
  
  await adapter.write('page_routes', route);
  console.log('Successfully injected block_apoyo_tecnico into /app/quoting/:id!');
}

main().catch(console.error);
