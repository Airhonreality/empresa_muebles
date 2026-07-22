/**
 * 🔍 DEBUG NEON - Endpoint para inspeccionar Neon en Vercel
 * GET /api/admin/neon-debug
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      return Response.json(
        { error: 'DATABASE_URL no configurado' },
        { status: 500 }
      );
    }

    const postgres = await import('postgres');
    const sql = postgres.default(DATABASE_URL);

    // 1. Estructura de tabla
    const structure = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agnostic_records'
      ORDER BY ordinal_position
    `;

    // 2. Contar page_routes
    const count = await sql`
      SELECT COUNT(*) as total
      FROM agnostic_records
      WHERE namespace = 'page_routes'
    `;

    // 3. Ver primeras 3 rutas
    const routes = await sql`
      SELECT
        id,
        namespace,
        context,
        data,
        created_at,
        updated_at
      FROM agnostic_records
      WHERE namespace = 'page_routes'
      ORDER BY created_at DESC
      LIMIT 3
    `;

    await sql.end();

    // Procesar datos
    const routesWithParsing = routes.map((route: any) => {
      let parsed = route.data;
      if (typeof route.data === 'string') {
        try {
          parsed = JSON.parse(route.data);
        } catch (e) {
          parsed = { error: 'Failed to parse JSON', raw: route.data };
        }
      }

      return {
        id: route.id,
        context: route.context,
        data_type_from_db: typeof route.data,
        path: parsed?.path || 'SIN PATH',
        title: parsed?.title || 'SIN TITLE ❌',
        has_title: !!parsed?.title,
        data_keys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : []
      };
    });

    const titleCount = routesWithParsing.filter((r: any) => r.has_title).length;
    const noTitleCount = routesWithParsing.filter((r: any) => !r.has_title).length;

    return Response.json({
      status: 'OK',
      table_structure: structure,
      total_page_routes: count[0]?.total || 0,
      routes_sample: routesWithParsing,
      summary: {
        total: routesWithParsing.length,
        with_title: titleCount,
        without_title: noTitleCount,
        problem_detected: noTitleCount > 0
      }
    });
  } catch (error) {
    console.error('[Neon Debug Error]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
