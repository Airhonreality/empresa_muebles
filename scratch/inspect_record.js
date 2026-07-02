const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  try {
    const rows = await sql`
      SELECT * FROM agnostic_records WHERE id = '9256b1d6-4503-4097-972d-943bfe7856c2';
    `;
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
