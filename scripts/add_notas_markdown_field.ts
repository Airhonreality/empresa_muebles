import { getStrategy } from '../src/server/getStrategy';

async function addNotasMarkdownField() {
  const adapter = getStrategy();
  console.log('Adding notas_markdown field to espacio_variantes...');

  // Read the existing espacio_variantes schema
  const allSchemas = await adapter.read('schema_definitions') as any[];
  let espacioVariantesSchema = allSchemas.find((s: any) => s.data?.name === 'espacio_variantes');

  if (!espacioVariantesSchema) {
    console.error('Error: espacio_variantes schema not found. Cannot update.');
    return;
  }

  // Add the notas_markdown field if it doesn't exist
  if (!espacioVariantesSchema.data.fields.some((f: any) => f.key === 'notas_markdown')) {
    espacioVariantesSchema.data.fields.push({
      key: 'notas_markdown',
      type: 'text',
      required: false,
      label: 'Notas en Markdown'
    });
    console.log('Added notas_markdown field to espacio_variantes.');
  } else {
    console.log('notas_markdown field already exists in espacio_variantes.');
  }

  espacioVariantesSchema.updated_at = new Date().toISOString();
  await adapter.write('schema_definitions', espacioVariantesSchema);
  console.log('Schema "espacio_variantes" updated with notas_markdown field.');
}

addNotasMarkdownField().catch(console.error);
