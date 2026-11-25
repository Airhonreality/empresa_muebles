// Extracción de solo lectura de la base de producción para el seguimiento de Ads.
// Solo agregados (conteos y sumas por semana). No devuelve nombres, teléfonos ni correos.
// Uso: node extraer_db.mjs <carpeta_salida> <fecha_inicio> <fecha_fin>
// Requiere DATABASE_URL_V3_PREVIEW en el entorno (cargado por run.sh desde .env.local).
import postgres from "../../node_modules/postgres/src/index.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [outDir, ini, fin] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sql = postgres(process.env.DATABASE_URL_V3_PREVIEW, { max: 1, idle_timeout: 5, connect_timeout: 15 });

try {
  const leadsSemana = await sql`
    SELECT date_trunc('week', created_at)::date AS semana,
           count(*) AS leads,
           count(*) FILTER (WHERE gclid IS NOT NULL OR gbraid IS NOT NULL OR wbraid IS NOT NULL) AS con_clic_google,
           count(*) FILTER (WHERE proyecto_id IS NOT NULL) AS con_proyecto
    FROM leads WHERE created_at::date BETWEEN ${ini}::date AND ${fin}::date
    GROUP BY 1 ORDER BY 1`;

  const proyectos = await sql`
    SELECT count(*) AS proyectos_nuevos FROM proyectos
    WHERE created_at::date BETWEEN ${ini}::date AND ${fin}::date`;

  const contratos = await sql`
    SELECT count(*) AS contratos_firmados, coalesce(sum(valor_total),0)::bigint AS valor_firmado
    FROM contratos c JOIN proyectos p ON p.id = c.proyecto_id
    WHERE c.estado::text = 'firmado' AND p.created_at::date BETWEEN ${ini}::date AND ${fin}::date`;

  const enlazados = await sql`
    SELECT count(*) AS leads_con_proyecto_total FROM leads WHERE proyecto_id IS NOT NULL`;

  const conv = await sql`SELECT count(*) AS conversiones_offline_registradas FROM eventos_conversion_offline`;

  const data = {
    rango: [ini, fin],
    leads_por_semana: leadsSemana,
    proyectos_nuevos: proyectos[0].proyectos_nuevos,
    contratos_firmados_de_proyectos_del_rango: contratos[0],
    leads_con_proyecto_enlazado_total: enlazados[0].leads_con_proyecto_total,
    conversiones_offline_registradas: conv[0].conversiones_offline_registradas,
  };
  const replacer = (k, v) => (typeof v === "bigint" ? Number(v) : v);
  writeFileSync(join(outDir, "datos_db.json"), JSON.stringify(data, replacer, 1), "utf-8");
  console.log("OK datos_db.json en", outDir);
} catch (e) {
  console.error("ERR_DB", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
