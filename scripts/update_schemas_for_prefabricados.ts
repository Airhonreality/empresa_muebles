import { getStrategy } from '../src/server/getStrategy';
import crypto from 'crypto';

async function updateSchemas() {
  const adapter = getStrategy();
  console.log('Starting schema update for prefabricados...');

  // 1. Define 'prefabricados' schema
  const prefabricadosSchemaTemplate = {
    id: '', // Will be filled dynamically
    data: {
      name: 'prefabricados',
      fields: [
        { key: 'nombre', type: 'text', required: true, label: 'Nombre del Prefabricado' },
        { key: 'descripcion', type: 'text', required: false, label: 'Descripción' },
        {
          key: 'catalogo_id',
          type: 'relation',
          required: true,
          label: 'Producto Maestro del Catálogo',
          config: { relation: { entity: 'productos_catalogo', parentKey: 'id' } }
        },
        { key: 'imagen_url', type: 'text', required: false, label: 'URL de Imagen' }
      ]
    },
    updated_at: new Date().toISOString(),
  };

  // 2. Define 'prefabricados_items' schema
  const prefabricadosItemsSchemaTemplate = {
    id: '', // Will be filled dynamically
    data: {
      name: 'prefabricados_items',
      fields: [
        {
        key: 'prefabricado_id',
          type: 'relation',
          required: true,
          label: 'Prefabricado Asociado',
          config: { relation: { entity: 'prefabricados', parentKey: 'id' } }
        },
        {
          key: 'catalogo_id',
          type: 'relation',
          required: true,
          label: 'Producto del Catálogo',
          config: { relation: { entity: 'productos_catalogo', parentKey: 'id' } }
        },
        { key: 'cantidad', type: 'number', required: true, label: 'Cantidad' },
        { key: 'unidad_medida', type: 'text', required: false, label: 'Unidad de Medida' }
      ]
    },
    updated_at: new Date().toISOString(),
  };

  // Helper to get an existing schema's ID or generate a new one, and merge fields
  const getOrCreateSchemaRecord = async (schemaName: string, schemaTemplate: any) => {
  const allSchemas = await adapter.read('schema_definitions') as any[];
    let existingSchema = allSchemas.find((s: any) => s.data?.name === schemaName);

    if (existingSchema) {
      console.log(`Schema "${schemaName}" found. Updating existing record.`);
      // Merge template fields into existing schema, add/update fields
      const updatedFields = [...existingSchema.data.fields];
      schemaTemplate.data.fields.forEach((newField: any) => {
        const existingFieldIdx = updatedFields.findIndex(f => f.key === newField.key);
        if (existingFieldIdx !== -1) {
          // Update existing field properties (e.g., type, required, label, config)
          updatedFields[existingFieldIdx] = { ...updatedFields[existingFieldIdx], ...newField };
  } else {
          // Add new field
          updatedFields.push(newField);
  }
      });
      existingSchema.data.fields = updatedFields;
      existingSchema.updated_at = new Date().toISOString();
      return existingSchema;
  } else {
      console.log(`Schema "${schemaName}" not found. Creating new record.`);
      schemaTemplate.id = crypto.randomUUID();
      return schemaTemplate;
  }
  };

  // Get or create 'prefabricados' schema
  let prefabricadosSchema = await getOrCreateSchemaRecord('prefabricados', prefabricadosSchemaTemplate);
  await adapter.write('schema_definitions', prefabricadosSchema);
  console.log('Schema "prefabricados" created/updated.');

  // Get or create 'prefabricados_items' schema
  let prefabricadosItemsSchema = await getOrCreateSchemaRecord('prefabricados_items', prefabricadosItemsSchemaTemplate);
  await adapter.write('schema_definitions', prefabricadosItemsSchema);
  console.log('Schema "prefabricados_items" created/updated.');

  // Update 'items_variante' schema
  const allSchemas = await adapter.read('schema_definitions') as any[]; // Re-read to ensure latest state
  let itemsVarianteSchema = allSchemas.find((s: any) => s.data?.name === 'items_variante');

  if (!itemsVarianteSchema) {
    console.error('Error: items_variante schema not found. Cannot update.');
    return;
}

  // Add 'origen_prefabricado_id' if it doesn't exist
  if (!itemsVarianteSchema.data.fields.some((f: any) => f.key === 'origen_prefabricado_id')) {
    itemsVarianteSchema.data.fields.push({
      key: 'origen_prefabricado_id',
      type: 'relation',
      required: false,
      label: 'Origen Prefabricado',
      config: { relation: { entity: 'prefabricados', parentKey: 'id' } }
    });
    console.log('Added origen_prefabricado_id to items_variante.');
  } else {
    console.log('origen_prefabricado_id already exists in items_variante.');
  }

  // Add 'imagen_url' if it doesn't exist
  if (!itemsVarianteSchema.data.fields.some((f: any) => f.key === 'imagen_url')) {
    itemsVarianteSchema.data.fields.push({
      key: 'imagen_url',
      type: 'text',
      required: false,
      label: 'URL de Imagen del Ítem'
    });
    console.log('Added imagen_url to items_variante.');
  } else {
    console.log('imagen_url already exists in items_variante.');
  }

  itemsVarianteSchema.updated_at = new Date().toISOString();
  await adapter.write('schema_definitions', itemsVarianteSchema);
  console.log('Schema "items_variante" updated with new fields.');

  console.log('Schema update completed.');
}

updateSchemas().catch(console.error);