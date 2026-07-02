const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = postgres(url);
  try {
    const productos = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'productos_catalogo';
    `;

    const targetNames = [
      'Tablero melamínico 18mm RH',
      'Sinterizado',
      'Grifería',
      'Lavaplatos',
      'Bisagras puerta batiente',
      'Corredera cajón cierre suave',
      'Lamina HQ',
      'Platillero organizador',
      'rodamientos',
      'Cubiertero'
    ];

    for (const name of targetNames) {
      const matches = productos.filter(p => {
        const n = p.data.descripcion || '';
        return n.toLowerCase().includes(name.toLowerCase());
      });
      console.log(`\nBúsqueda "${name}" (${matches.length} matches):`);
      matches.slice(0, 3).forEach(m => {
        console.log(`  - ID: ${m.id} | Desc: ${m.data.descripcion} | Precio Pub: ${m.data.precio_publico} | Unidad: ${m.data.unidad_medida}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
