import { getStrategy } from '../src/server/getStrategy';
import crypto from 'crypto';

async function createPrefabricadosRoute() {
  const adapter = getStrategy();
  console.log('Creating /prefabricados route...');

  // Define the route
  const prefabricadosRoute = {
    id: crypto.randomUUID(),
    data: {
      path: '/prefabricados',
      blocks: [
        {
          id: crypto.randomUUID(),
          type: 'collection',
          context: 'prefabricados',
          intent: 'list',
          segmentation_key: 'prefabricados',
          visible_fields: ['nombre', 'descripcion', 'catalogo_id'],
          label: 'Prefabricados'
        },
        {
          id: crypto.randomUUID(),
          type: 'form',
          context: 'prefabricados',
          intent: 'create',
          visible_fields: ['nombre', 'descripcion', 'catalogo_id', 'imagen_url'],
          label: 'Crear Prefabricado'
        },
        {
          id: crypto.randomUUID(),
          type: 'collection',
          context: 'prefabricados_items',
          intent: 'list',
          segmentation_key: 'prefabricados_items',
          visible_fields: ['prefabricado_id', 'catalogo_id', 'cantidad', 'unidad_medida'],
          label: 'Ítems del Prefabricado'
        },
        {
          id: crypto.randomUUID(),
          type: 'form',
          context: 'prefabricados_items',
          intent: 'create',
          visible_fields: ['prefabricado_id', 'catalogo_id', 'cantidad', 'unidad_medida'],
          label: 'Añadir Ítem al Prefabricado'
        }
      ]
    },
    updated_at: new Date().toISOString()
  };

  // Save the route
  await adapter.write('page_routes', prefabricadosRoute);
  console.log('Route /prefabricados created successfully.');
}

createPrefabricadosRoute().catch(console.error);