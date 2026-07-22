/**
 * 🔍 NEON PUBLIC DEBUG
 * Endpoint público para inspeccionar Neon
 * GET /api/public-debug/neon
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      return Response.json(
        { error: 'DATABASE_URL no configurado', step: 'env-check' },
        { status: 500 }
      );
    }

    const postgres = await import('postgres');
    const sql = postgres.default(DATABASE_URL);

    console.log('[Neon Debug] Conectando a Neon...');

    // 1. Contar page_routes
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM agnostic_records
      WHERE namespace = 'page_routes'
    `;
    const count = countResult[0]?.total || 0;

    // 2. Ver primeras 3 rutas
    const routes = await sql`
      SELECT
        id,
        namespace,
        context,
        data
      FROM agnostic_records
      WHERE namespace = 'page_routes'
      ORDER BY created_at DESC
      LIMIT 3
    `;

    await sql.end();

    // Procesar datos
    const routeDetails = routes.map((route: any) => {
      let parsed = route.data;
      if (typeof route.data === 'string') {
        try {
          parsed = JSON.parse(route.data);
        } catch (e) {
          parsed = { error: 'Failed to parse', raw: route.data };
        }
      }

      return {
        id: route.id,
        context: route.context,
        path: parsed?.path || 'SIN PATH',
        title: parsed?.title || 'SIN TITLE ❌',
        has_title: !!parsed?.title,
        keys: parsed && typeof parsed === 'object' ? Object.keys(parsed).sort() : []
      };
    });

    const totalWithTitle = routeDetails.filter((r: any) => r.has_title).length;

    return Response.json({
      status: 'OK',
      connection: 'Conectado a Neon ✓',
      total_page_routes: count,
      routes_with_title: totalWithTitle,
      routes_without_title: count - totalWithTitle,
      sample: routeDetails,
      issue_detected: (count - totalWithTitle) > 0 ? `${count - totalWithTitle} rutas SIN title` : 'NONE'
    });
  } catch (error) {
    console.error('[Neon Debug Error]', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
        status: 'CONNECTION_FAILED'
      },
      { status: 500 }
    );
  }
}
