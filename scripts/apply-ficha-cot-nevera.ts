import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

// Ficha técnica por ítem cotizado — backfill de la cotización COT-2026-09-10-002
// (proyecto c9429e54-e1ef-4bc2-b8d4-fac30e186dab). Idempotente: se puede re-correr.
//
// Decisiones cerradas por el Supervisor (2026-09-22):
//  1. Eliminar ítem duplicado 6de31355 (1.00 und) — total 40.111.550 → 39.663.050
//  2. Renombrar catálogo AUTO-000064 "Puerta de vidrio bronce" → "Puerta de vidrio";
//     color = "Negro" en los ítems de vidrio
//  3. Piedra: marca = "Veta Surfaces", espesor = "12", color = null
//  4. Tableros: marca = "Duratex", espesor = "18", acabado = "RH con cantos rígidos 2mm"
//  5. Tablero fachadas (AUTO-000003): color = "Graffo"
//  6. Ciclo de aperturas (gama media, no Blum): oculta 60000, aluminio 50000,
//     bisagra 50000; marca herrajes Unihopper
//  7. Anotaciones del espacio → espacio_variantes.descripcion (3 líneas)
//
// Correr DESPUÉS de aplicar drizzle/v3/0021_items_variante_ficha_tecnica.sql.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL no está definida en .env.local');
  process.exit(1);
}

const PID = 'c9429e54-e1ef-4bc2-b8d4-fac30e186dab';
const ESPACIO_ID = 'd07f4204-4546-4df7-b0d2-c2770b6185d9';

const ACABADO_TABLERO = 'RH con cantos rígidos 2mm';

const ANOTACIONES = [
  'Estructura modular: Duratex, calibre 18 mm RH con cantos rígidos 2 mm',
  'Piedra sinterizada: Veta Surfaces, OEM garantizada por el proceso, espesor 12 mm',
  'Color a convenir según muestra — tono marquina (fondo oscuro con vetas)',
].join('\n');

type Ficha = {
  marca?: string | null;
  referencia?: string | null;
  color?: string | null;
  dimensiones?: string | null;
  acabado?: string | null;
  espesor?: string | null;
  campos?: Array<{ clave: string; valor: string }>;
};

const PIEDRA: Ficha = { marca: 'Veta Surfaces', espesor: '12', color: null };
const TABLERO: Ficha = { marca: 'Duratex', espesor: '18', acabado: ACABADO_TABLERO };
const TABLERO_FACHADA: Ficha = { ...TABLERO, color: 'Graffo' };
const VIDRIO: Ficha = { color: 'Negro' };

const HERRAJE_OCULTA: Ficha = {
  marca: 'Unihopper',
  campos: [{ clave: 'Ciclo de aperturas', valor: '60000' }],
};
const HERRAJE_ALUMINIO: Ficha = {
  marca: 'Unihopper',
  campos: [{ clave: 'Ciclo de aperturas', valor: '50000' }],
};
const HERRAJE_BISAGRA: Ficha = {
  marca: 'Unihopper',
  campos: [{ clave: 'Ciclo de aperturas', valor: '50000' }],
};

// item_id → ficha (los no listados quedan sin ficha: lavaplatos, insumos, LED)
const FICHAS: Array<{ id: string; ficha: Ficha }> = [
  // Piedra
  { id: '04979980-46ac-4109-b7bf-62d97010d75b', ficha: PIEDRA },
  { id: '299dbe90-92b7-4088-9328-61717f9c96ae', ficha: PIEDRA },
  { id: '50970438-47b0-42c6-995b-b8c1cc1d1811', ficha: PIEDRA },
  { id: '872396b3-2737-4a1d-bfa8-c64b30fb79aa', ficha: PIEDRA },
  // Tableros
  { id: '08850c3b-64e9-4ec2-878f-0a6c4f8340f2', ficha: TABLERO },
  { id: 'a984306a-5db0-4cf3-b4cd-3dc585cf85d2', ficha: TABLERO },
  { id: '12564019-75f9-4654-ac6d-a71817d623c0', ficha: TABLERO },
  { id: '1550a360-cd60-4598-9ff0-7ab1d4067a45', ficha: TABLERO },
  { id: '35308221-7b62-45d4-850d-d11f50b04e62', ficha: TABLERO },
  { id: 'fc5810b7-ac94-4dcb-a1b8-41bb952a7939', ficha: TABLERO },
  { id: 'a6ec9589-dd13-48ca-b669-0532fbd9a5fa', ficha: TABLERO_FACHADA },
  // Herrajes (ciclo de aperturas)
  { id: '15f5d299-e998-4b8d-a290-94c5ce14a61b', ficha: HERRAJE_OCULTA },
  { id: '38fb32fe-8b95-48ec-bfd4-74be5a94e9c7', ficha: HERRAJE_ALUMINIO },
  { id: 'd9e1b5a5-6a1b-4b88-a71d-8d967fb6004b', ficha: HERRAJE_BISAGRA },
  // Vidrio
  { id: 'd5f7a1b7-4865-424f-823b-f96a8e77b9b6', ficha: VIDRIO },
  { id: '9f392840-03b6-4e83-bb08-95b8b55e265f', ficha: VIDRIO },
];

const DUPLICADO_ID = '6de31355-b740-4814-972e-2f85e480251b';
const SKU_PUERTA = 'AUTO-000064';

async function main() {
  console.log('🔄 Backfill ficha técnica COT-2026-09-10-002…');
  const sql = postgres(connectionString as string, { max: 1 });

  try {
    await sql.begin(async (tx) => {
      await tx`LOCK TABLE "items_variante" IN SHARE ROW EXCLUSIVE MODE;`;

      // 1) Eliminar ítem duplicado (hard delete en cotización preliminar)
      const borrados = await tx`
        DELETE FROM "items_variante"
        WHERE id = ${DUPLICADO_ID}
          AND variante_id IN (
            SELECT id FROM "espacio_variantes" WHERE proyecto_id = ${PID}
          )
        RETURNING id;
      `;
      console.log(`✅ Duplicado eliminado: ${borrados.length} fila(s) ${DUPLICADO_ID}`);

      // 2) Renombrar catálogo AUTO-000064
      const ren = await tx`
        UPDATE "productos_catalogo"
        SET descripcion = 'Puerta de vidrio', updated_at = now()
        WHERE sku = ${SKU_PUERTA} AND descripcion <> 'Puerta de vidrio'
        RETURNING id, sku, descripcion;
      `;
      console.log(`✅ Catálogo renombrado: ${ren.length} fila(s)`);

      // 3) Anotaciones del espacio → descripcion
      await tx`
        UPDATE "espacio_variantes"
        SET descripcion = ${ANOTACIONES}, updated_at = now()
        WHERE id = ${ESPACIO_ID};
      `;
      console.log('✅ Anotaciones escritas en espacio_variantes.descripcion');

      // 4) Ficha por ítem (solo ids del proyecto — doble filtro por seguridad)
      let ok = 0;
      for (const { id, ficha } of FICHAS) {
        const r = await tx`
          UPDATE "items_variante" SET
            marca = ${ficha.marca ?? null},
            referencia = ${ficha.referencia ?? null},
            color = ${ficha.color ?? null},
            dimensiones = ${ficha.dimensiones ?? null},
            acabado = ${ficha.acabado ?? null},
            espesor = ${ficha.espesor ?? null},
            campos_personalizados = ${JSON.stringify(ficha.campos ?? [])}::jsonb,
            updated_at = now()
          WHERE id = ${id}
            AND variante_id IN (
              SELECT id FROM "espacio_variantes" WHERE proyecto_id = ${PID}
            )
          RETURNING id;
        `;
        ok += r.length;
        if (r.length === 0) console.warn(`⚠️  Ítem no encontrado (¿ya borrado?): ${id}`);
      }
      console.log(`✅ Ficha actualizada en ${ok}/${FICHAS.length} ítems`);

      // 5) Verificación DENTRO de la transacción
      const total = await tx`
        SELECT count(*)::int AS n FROM "items_variante"
        WHERE variante_id IN (
          SELECT id FROM "espacio_variantes" WHERE proyecto_id = ${PID}
        );
      `;
      const sum = await tx`
        SELECT coalesce(sum(total_linea), 0)::numeric AS s FROM "items_variante"
        WHERE anulado = false AND NOT es_referencial
          AND variante_id IN (
            SELECT id FROM "espacio_variantes" WHERE proyecto_id = ${PID}
          );
      `;
      console.log(`📊 Ítems restantes: ${total[0].n} (esperado 19)`);
      // Suma real de contractuales tras borrar 6de31355 (448500): 40938425 - 448500.
      // (El 39663005 de la nota previa estaba desactualizado.)
      console.log(`💰 Suma contractuales: ${sum[0].s} (esperado 40489925)`);
      if (total[0].n !== 19) throw new Error(`Esperaba 19 ítems, hay ${total[0].n}`);
      if (Number(sum[0].s) !== 40489925) {
        throw new Error(`Esperaba total 40489925, hay ${sum[0].s}`);
      }
    });

    console.log('✅ Backfill completado (commit).');
  } catch (error) {
    console.error('❌ Error (rollback):', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
