const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  const LORENA_PROYECTO_ID = '286b5b77-02da-49e4-a32e-d54020e713a7';

  try {
    console.log('--- DIAGNÓSTICO COMPLETO: PROYECTO LORENA VACA ---');
    console.log(`ID del proyecto: ${LORENA_PROYECTO_ID}`);

    // Todos los espacios en la DB
    const allEspacios = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'espacio_variantes';
    `;
    console.log(`\nTotal espacios en Neon: ${allEspacios.length}`);

    // ¿Hay alguno que apunte a Lorena?
    const lorenaEspacios = allEspacios.filter(e => {
      return (
        e.data.proyecto_id === LORENA_PROYECTO_ID ||
        e.data.cotizacion_id === LORENA_PROYECTO_ID
      );
    });
    console.log(`Espacios que apuntan al proyecto de Lorena Vaca: ${lorenaEspacios.length}`);

    // Listar todos los proyecto_id y cotizacion_id únicos en espacio_variantes
    console.log('\nTodas las referencias (proyecto_id / cotizacion_id) en espacio_variantes:');
    const refs = allEspacios.map(e => ({
      espacio_id: e.id.slice(0, 8),
      nombre_espacio: e.data.nombre_espacio,
      proyecto_id: e.data.proyecto_id ? e.data.proyecto_id.slice(0, 8) : null,
      cotizacion_id: e.data.cotizacion_id ? e.data.cotizacion_id.slice(0, 8) : null,
    }));
    console.table(refs);

    // Resumen: ¿hay algún espacio sin proyecto_id NI cotizacion_id?
    const sinReferencia = allEspacios.filter(e => !e.data.proyecto_id && !e.data.cotizacion_id);
    console.log(`\nEspacios sin proyecto_id ni cotizacion_id: ${sinReferencia.length}`);
    if (sinReferencia.length > 0) {
      sinReferencia.forEach(e => console.log(`  - ${e.id}: ${e.data.nombre_espacio}`));
    }

    // ¿La cotizacion de Lorena tenía ID diferente antes?
    // Buscamos en todas las ordenes de trabajo, contratos, y tareas relacionadas
    const contratos = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'contratos';
    `;
    const loreContratos = contratos.filter(c =>
      c.data.proyecto_id === LORENA_PROYECTO_ID ||
      c.data.cotizacion_id === LORENA_PROYECTO_ID ||
      (c.data.cliente_id && c.data.cliente_id === '5fc1b7cb-5a9e-441e-a519-9329105c7c08')
    );
    console.log(`\nContratos de Lorena Vaca: ${loreContratos.length}`);
    console.log(JSON.stringify(loreContratos.map(c => ({
      id: c.id,
      estado: c.data.estado,
      proyecto_id: c.data.proyecto_id,
      cotizacion_id: c.data.cotizacion_id,
      nombre: c.data.email_asunto
    })), null, 2));

    // Buscar ordenes de trabajo por el proyecto
    const ordenes = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'ordenes_trabajo';
    `;
    const loreOrdenes = ordenes.filter(o =>
      o.data.proyecto_id === LORENA_PROYECTO_ID ||
      o.data.cotizacion_id === LORENA_PROYECTO_ID
    );
    console.log(`\nOrdenes de trabajo de Lorena: ${loreOrdenes.length}`);
    console.log(JSON.stringify(loreOrdenes, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
