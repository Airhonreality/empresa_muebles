const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  try {
    const rows = await sql`
      SELECT id, namespace, data->>'nombre_proyecto' as nombre
      FROM agnostic_records 
      WHERE id = '1fcee8f9-dd9f-45f3-ad05-e8b3fffa45ed';
    `;
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
