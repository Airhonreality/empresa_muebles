const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not defined in env.');
    process.exit(1);
  }

  const sql = postgres(url);
  try {
    console.log('--- INICIANDO ALINEACIÓN Y MIGRACIÓN DE DATOS (COTIZACIONES -> PROYECTOS) ---');

    // 1. Clonar las 3 cotizaciones huérfanas en el namespace de 'proyectos'
    console.log('\n[Paso 1] Migrando cotizaciones huérfanas al namespace "proyectos"...');
    const huerfanas = await sql`
      SELECT id, data, created_at, updated_at
      FROM agnostic_records
      WHERE namespace = 'cotizaciones'
        AND id IN (
          '7558d6d4-9245-4025-ba9b-b0eee692e86e',
          'fc15c434-50be-4fe2-8339-b218e82fcb2a',
          '62bfe5fe-a947-45a6-be5d-27255c1a3ba4'
        );
    `;

    for (const row of huerfanas) {
      console.log(`- Insertando/actualizando proyecto: ${row.id} (${row.data.nombre_proyecto})`);
      await sql`
        INSERT INTO agnostic_records (id, namespace, context, data, created_at, updated_at)
        VALUES (
          ${row.id}, 
          'proyectos', 
          'proyectos', 
          ${sql.json(row.data)}, 
          ${row.created_at}, 
          ${row.updated_at || null}
        )
        ON CONFLICT (namespace, id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `;
    }

    // 2. Copiar cotizacion_id a proyecto_id en espacio_variantes
    console.log('\n[Paso 2] Actualizando referencias en "espacio_variantes" (cotizacion_id -> proyecto_id)...');
    const espacios = await sql`
      SELECT id, data
      FROM agnostic_records
      WHERE namespace = 'espacio_variantes' AND data ? 'cotizacion_id';
    `;

    let updatedEspacios = 0;
    for (const e of espacios) {
      const cotId = e.data.cotizacion_id;
      if (cotId && e.data.proyecto_id !== cotId) {
        const newData = { ...e.data, proyecto_id: cotId };
        await sql`
          UPDATE agnostic_records
          SET data = ${sql.json(newData)}, updated_at = NOW()
          WHERE namespace = 'espacio_variantes' AND id = ${e.id};
        `;
        console.log(`- Espacio ${e.id.slice(0, 8)} (${e.data.nombre_espacio}): asignado proyecto_id = ${cotId.slice(0, 8)}`);
        updatedEspacios++;
      }
    }
    console.log(`Total de espacio_variantes actualizados: ${updatedEspacios}`);

    // 3. Copiar cotizacion_id a proyecto_id en contratos
    console.log('\n[Paso 3] Actualizando referencias en "contratos" (cotizacion_id -> proyecto_id)...');
    const contratos = await sql`
      SELECT id, data
      FROM agnostic_records
      WHERE namespace = 'contratos' AND data ? 'cotizacion_id';
    `;

    let updatedContratos = 0;
    for (const c of contratos) {
      const cotId = c.data.cotizacion_id;
      if (cotId && c.data.proyecto_id !== cotId) {
        const newData = { ...c.data, proyecto_id: cotId };
        await sql`
          UPDATE agnostic_records
          SET data = ${sql.json(newData)}, updated_at = NOW()
          WHERE namespace = 'contratos' AND id = ${c.id};
        `;
        console.log(`- Contrato ${c.id.slice(0, 8)}: asignado proyecto_id = ${cotId.slice(0, 8)}`);
        updatedContratos++;
      }
    }
    console.log(`Total de contratos actualizados: ${updatedContratos}`);

    console.log('\n--- ALINEACIÓN COMPLETADA CON ÉXITO ---');
  } catch (err) {
    console.error('Error durante la alineación:', err);
  } finally {
    await sql.end();
  }
}

main();
