import { sql } from 'drizzle-orm';
import { db } from '../lib/db/client';

const projectId = 'c9429e54-e1ef-4bc2-b8d4-fac30e186dab';

const afectados = await db.execute(sql`
  SELECT id, item_number, nombre_personalizado
  FROM cotizacion_items
  WHERE proyecto_id = ${projectId}
    AND nombre_personalizado ILIKE '%bronce%'
`);

console.log('Encontrados:', afectados);

if (afectados.length > 0) {
  const upd = await db.execute(sql`
    UPDATE cotizacion_items
    SET nombre_personalizado = NULL
    WHERE proyecto_id = ${projectId}
      AND nombre_personalizado ILIKE '%bronce%'
    RETURNING id, nombre_personalizado
  `);
  console.log('Actualizados:', upd);

  for (const r of upd) {
    console.log(`  ${r.item_number}: display="${r.nombre_personalizado ?? r.catalogo}" (nombre_personalizado=${r.nombre_personalizado === null ? 'NULL→catálogo' : `"${r.nombre_personalizado}"`})`);
  }
}

const verify = await db.execute(sql`
  SELECT i.id, i.item_number, i.nombre_personalizado, p.descripcion AS catalogo
  FROM cotizacion_items i
  LEFT JOIN productos_catalogo p ON p.id = i.producto_catalogo_id
  WHERE i.proyecto_id = ${projectId}
    AND (i.nombre_personalizado ILIKE '%bronce%' OR p.descripcion ILIKE '%bronce%'
         OR i.nombre_personalizado IS NULL AND i.producto_catalogo_id IS NOT NULL)
  ORDER BY i.item_number
`);
console.log('Verificación (ítems con catálogo):');
for (const r of verify) {
  console.log(`  ${r.item_number}: display="${r.nombre_personalizado ?? r.catalogo}" (nombre_personalizado=${r.nombre_personalizado === null ? 'NULL→catálogo' : `"${r.nombre_personalizado}"`})`);
}