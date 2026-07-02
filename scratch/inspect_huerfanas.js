const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  try {
    const rows = await sql`
      SELECT id, namespace, context, data
      FROM agnostic_records 
      WHERE namespace = 'cotizaciones';
    `;
    const ids = [
      '7558d6d4-9245-4025-ba9b-b0eee692e86e',
      'fc15c434-50be-4fe2-8339-b218e82fcb2a',
      '62bfe5fe-a947-45a6-be5d-27255c1a3ba4'
    ];
    const filtered = rows.filter(r => ids.includes(r.id));
    console.log(JSON.stringify(filtered, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
