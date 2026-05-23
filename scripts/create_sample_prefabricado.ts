import { getStrategy } from '../src/server/getStrategy';
import crypto from 'crypto';

async function createSamplePrefabricado() {
  const adapter = getStrategy();
  console.log('Creating sample prefabricado...');

  // 1. Get a sample product from productos_catalogo to use as catalogo_id
  const productosCatalogo = await adapter.read('productos_catalogo') as any[];
  if (productosCatalogo.length === 0) {
    console.error('No products found in productos_catalogo. Cannot create sample prefabricado.');
    return;
  }

  // Use the first product as the master product for the prefabricado
  const sampleProduct = productosCatalogo[0];
  console.log(`Using product: ${sampleProduct.data.descripcion} (ID: ${sampleProduct.id}) as master for prefabricado.`);

  // 2. Create a sample prefabricado
  const prefabricado = {
    id: crypto.randomUUID(),
    data: {
      nombre: 'Cocina Estándar Pequeña',
      descripcion: 'Prefabricado para cocina estándar pequeña con módulos básicos.',
      catalogo_id: sampleProduct.id,
      imagen_url: 'https://ejemplo.com/cocina-estandar.jpg' // URL de ejemplo
    }
  };

  await adapter.write('prefabricados', prefabricado);
  console.log('Sample prefabricado created.');

  // 3. Add sample items to the prefabricado
  // Use the first 3 products from productos_catalogo as items
  const sampleItems = productosCatalogo.slice(1, 4).map((product: any) => ({
    id: crypto.randomUUID(),
    data: {
      prefabricado_id: prefabricado.id,
      catalogo_id: product.id,
      cantidad: 1,
      unidad_medida: product.data.unidad_medida || 'ud'
    }
  }));

  for (const item of sampleItems) {
    await adapter.write('prefabricados_items', item);
    console.log(`Added item: ${item.data.catalogo_id} to prefabricado.`);
  }

  console.log('Sample prefabricado and items created successfully.');
  console.log(`Prefabricado ID: ${prefabricado.id}`);
  console.log(`Items added: ${sampleItems.length}`);
}

createSamplePrefabricado().catch(console.error);