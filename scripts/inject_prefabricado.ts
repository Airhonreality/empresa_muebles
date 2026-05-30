import { getStrategy } from '../src/server/getStrategy';
import crypto from 'crypto';

async function injectPrefabricado(prefabricadoId: string, varianteId: string) {
  const adapter = getStrategy();
  console.log(`Injecting prefabricado ${prefabricadoId} into variante ${varianteId}...`);

  // 1. Get the prefabricado to retrieve its imagen_url
  const prefabricados = await adapter.read('prefabricados') as any[];
  const prefabricado = prefabricados.find((p: any) => p.id === prefabricadoId);

  if (!prefabricado) {
    console.error(`Prefabricado with ID ${prefabricadoId} not found.`);
    return;
  }

  // 2. Get all prefabricados_items for this prefabricado
  const prefabricadosItems = await adapter.read('prefabricados_items') as any[];
  const itemsToInject = prefabricadosItems.filter((item: any) => item.data.prefabricado_id === prefabricadoId);

  if (itemsToInject.length === 0) {
    console.log(`No items found for prefabricado ${prefabricadoId}.`);
    return;
  }

  // 3. Inject each item into items_variante
  const newItemsVariante: any[] = [];

  for (const item of itemsToInject) {
    const newItemVariante = {
      id: crypto.randomUUID(), // Generate a new UUID for the items_variante record
      data: {
        variante_id: varianteId,
        catalogo_id: item.data.catalogo_id,
        unidad_medida: item.data.unidad_medida || '',
        cantidad: item.data.cantidad,
        precio_unitario: 0, // Placeholder; should be calculated based on productos_catalogo
        total_linea: 0,     // Placeholder; should be calculated as precio_unitario * cantidad
        origen_prefabricado_id: prefabricadoId,
        imagen_url: prefabricado.data.imagen_url || '' // Inject the prefabricado's imagen_url
      }
    };

    // Calculate precio_unitario and total_linea based on productos_catalogo
    const productosCatalogo = await adapter.read('productos_catalogo') as any[];
    const producto = productosCatalogo.find((p: any) => p.id === item.data.catalogo_id);

    if (producto) {
      newItemVariante.data.precio_unitario = producto.data.precio_directo || 0;
      newItemVariante.data.total_linea = newItemVariante.data.precio_unitario * newItemVariante.data.cantidad;
    }

    newItemsVariante.push(newItemVariante);
  }

  // 4. Write all new items_variante records
  for (const newItem of newItemsVariante) {
    await adapter.write('items_variante', newItem);
    console.log(`Injected item: ${newItem.data.catalogo_id} (x${newItem.data.cantidad})`);
  }

  console.log(`Successfully injected ${newItemsVariante.length} items from prefabricado ${prefabricadoId} into variante ${varianteId}.`);
}

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: npx tsx scripts/inject_prefabricado.ts <prefabricado_id> <variante_id>');
  process.exit(1);
}

const prefabricadoId = args[0];
const varianteId = args[1];

injectPrefabricado(prefabricadoId, varianteId).catch(console.error);