const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = postgres(url);
  try {
    const productos = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'productos_catalogo' LIMIT 5;
    `;
    console.log(JSON.stringify(productos, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
