const postgres = require('postgres');
const crypto = require('crypto');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL no está definido.');
    process.exit(1);
  }
  const sql = postgres(url);
  const PROYECTO_ID = '286b5b77-02da-49e4-a32e-d54020e713a7'; // Lorena Vaca
  const ESPACIO_ID = '29209ca8-d9f3-422a-bca0-97d26c86c5e5'; // Espacio huérfano "Cocina integral"

  try {
    console.log('--- POBLANDO PROYECTO LORENA VACA EN NEON ---');

    // 1. Actualizar el espacio huérfano para apuntar al proyecto de Lorena Vaca
    console.log(`[1] Vinculando espacio ${ESPACIO_ID} a proyecto ${PROYECTO_ID}...`);
    const espacioRows = await sql`
      SELECT id, data FROM agnostic_records WHERE id = ${ESPACIO_ID};
    `;
    if (espacioRows.length > 0) {
      const eData = {
        ...espacioRows[0].data,
        proyecto_id: PROYECTO_ID,
        cotizacion_id: PROYECTO_ID,
        nombre_espacio: 'Cocina integral',
        nombre_variante: 'Con puerta corrediza'
      };
      await sql`
        UPDATE agnostic_records
        SET data = ${sql.json(eData)}, updated_at = NOW()
        WHERE id = ${ESPACIO_ID};
      `;
    }

    // 2. Eliminar los items incompletos actuales de ese espacio para evitar duplicados/entropía
    console.log(`[2] Limpiando ítems previos incompletos del espacio...`);
    const itemsPrevios = await sql`
      SELECT id FROM agnostic_records WHERE namespace = 'items_variante' AND data->>'variante_id' = ${ESPACIO_ID};
    `;
    for (const item of itemsPrevios) {
      await sql`DELETE FROM agnostic_records WHERE id = ${item.id};`;
    }

    // 3. Insertar los 10 ítems exactos de la cotización firmada (Resumen Financiero Gama Alta)
    console.log(`[3] Insertando los 10 ítems exactos de la cotización...`);
    const itemsCotizacion = [
      {
        nombre: 'Tablero melamínico 18mm RH',
        catalogo_id: '6bd7ed01-9406-4e80-a96f-5a3de1b3a314',
        cantidad: 8.7,
        unidad_medida: 'tablero',
        precio_unitario: 517500,
        total_linea: 4502250
      },
      {
        nombre: 'Sinterizado',
        catalogo_id: '522f109b-c0b9-4c9c-8cad-60108c38d21b',
        cantidad: 4,
        unidad_medida: 'metro lineal',
        precio_unitario: 1150000,
        total_linea: 4600000
      },
      {
        nombre: 'Grifería Estandar',
        catalogo_id: '121882bd-070d-4002-969c-081e60d77c06',
        cantidad: 1,
        unidad_medida: 'unidad',
        precio_unitario: 172500,
        total_linea: 172500
      },
      {
        nombre: 'Lavaplatos estándar y complementos',
        catalogo_id: '3c8273dc-a7cd-4e9a-8bc8-a5d491d6dfdc',
        cantidad: 1,
        unidad_medida: 'unidad',
        precio_unitario: 287500,
        total_linea: 287500
      },
      {
        nombre: 'Bisagras puerta batiente',
        catalogo_id: 'd9d0f2ab-3aaf-48c5-a429-a82bac5cda41',
        cantidad: 17,
        unidad_medida: 'juegos',
        precio_unitario: 11500,
        total_linea: 195500
      },
      {
        nombre: 'Corredera cajón cierre suave aluminio',
        catalogo_id: 'a022cc73-d383-427d-8bbc-e12ce21e701e',
        cantidad: 3,
        unidad_medida: 'juegos',
        precio_unitario: 155250,
        total_linea: 465750
      },
      {
        nombre: 'Lamina HQ 18mm',
        catalogo_id: '171e7cb7-5489-46c0-9a3d-6fb9c95bed76',
        cantidad: 1.4,
        unidad_medida: 'tablero',
        precio_unitario: 1265000,
        total_linea: 1771000
      },
      {
        nombre: 'Platillero organizador de loza',
        catalogo_id: '9ec4cd58-9200-4b35-89ee-859d853b6173',
        cantidad: 1,
        unidad_medida: 'unidad',
        precio_unitario: 57500,
        total_linea: 57500
      },
      {
        nombre: 'Kit rodamientos x und puerta corrediza',
        catalogo_id: 'e75bb0cc-5250-4c67-bb80-a0f38ffd2ab5',
        cantidad: 1,
        unidad_medida: 'unidad',
        precio_unitario: 40250,
        total_linea: 40250
      },
      {
        nombre: 'Cubiertero',
        catalogo_id: '87a84793-e470-4b51-a4fd-50638e1252c7',
        cantidad: 2,
        unidad_medida: 'unidad',
        precio_unitario: 54750,
        total_linea: 109500
      }
    ];

    let totalMateriales = 0;
    for (const item of itemsCotizacion) {
      const itemId = crypto.randomUUID();
      const itemData = {
        variante_id: ESPACIO_ID,
        catalogo_id: item.catalogo_id,
        cantidad: item.cantidad,
        unidad_medida: item.unidad_medida,
        precio_unitario: item.precio_unitario,
        total_linea: item.total_linea
      };
      await sql`
        INSERT INTO agnostic_records (id, namespace, context, data, created_at, updated_at)
        VALUES (${itemId}, 'items_variante', 'items_variante', ${sql.json(itemData)}, NOW(), NOW());
      `;
      totalMateriales += item.total_linea;
      console.log(`  + Insertado ítem: ${item.nombre} | Cant: ${item.cantidad} | Total: $${item.total_linea.toLocaleString()}`);
    }

    console.log(`\nSubtotal Materiales: $${totalMateriales.toLocaleString()}`);
    console.log(`Mano de Obra Estimada: $3,235,000`);
    console.log(`Total Propuesta: $${(totalMateriales + 3235000).toLocaleString()}`);
    console.log('\n--- POBLADO COMPLETADO CON ÉXITO EN NEON ---');

  } catch (err) {
    console.error('Error poblando Lorena Vaca:', err);
  } finally {
    await sql.end();
  }
}
main();
