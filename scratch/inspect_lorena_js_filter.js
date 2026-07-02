const postgres = require('postgres');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url);
  try {
    console.log('--- DIAGNÓSTICO JAVASCRIPT FILTER LORENA VACA ---');

    // 1. Obtener todos los clientes que se llamen Lorena Vaca
    const clientes = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'clientes';
    `;
    const lorenaClientes = clientes.filter(c => {
      const nombre = c.data && c.data.nombre;
      return nombre && (nombre.toLowerCase().includes('lorena') || nombre.toLowerCase().includes('vaca'));
    });
    console.log('Clientes Lorena Vaca:', lorenaClientes.map(c => ({ id: c.id, nombre: c.data.nombre })));
    const lorenaIds = lorenaClientes.map(c => c.id);

    // 2. Obtener todos los proyectos
    const proyectos = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'proyectos';
    `;
    console.log(`Total proyectos en DB: ${proyectos.length}`);

    // Filtrar proyectos por cliente_id o por nombre_proyecto
    const proyectosLorena = proyectos.filter(p => {
      if (!p.data) return false;
      const cId = p.data.cliente_id;
      const nombreProy = p.data.nombre_proyecto || '';
      return lorenaIds.includes(cId) || nombreProy.toLowerCase().includes('lorena') || nombreProy.toLowerCase().includes('vaca') || nombreProy.toLowerCase().includes('cocina');
    });

    console.log('\nProyectos que coinciden con Lorena o Cocina:');
    console.log(JSON.stringify(proyectosLorena, null, 2));

    // 3. Obtener todas las cotizaciones
    const cotizaciones = await sql`
      SELECT id, data FROM agnostic_records WHERE namespace = 'cotizaciones';
    `;
    const cotizacionesLorena = cotizaciones.filter(c => {
      if (!c.data) return false;
      const cId = c.data.cliente_id;
      const nombreProy = c.data.nombre_proyecto || '';
      return lorenaIds.includes(cId) || nombreProy.toLowerCase().includes('lorena') || nombreProy.toLowerCase().includes('vaca') || nombreProy.toLowerCase().includes('cocina');
    });

    console.log('\nCotizaciones que coinciden con Lorena o Cocina:');
    console.log(JSON.stringify(cotizacionesLorena, null, 2));

    // 4. Si hay proyectos que coinciden, buscar sus espacios y sus items
    const matchIds = [...proyectosLorena, ...cotizacionesLorena].map(x => x.id);
    const uniqueMatchIds = [...new Set(matchIds)];
    console.log('\nIDs únicos de proyectos/cotizaciones a buscar:', uniqueMatchIds);

    if (uniqueMatchIds.length > 0) {
      const espacios = await sql`
        SELECT id, data FROM agnostic_records WHERE namespace = 'espacio_variantes';
      `;
      const espaciosRelacionados = espacios.filter(e => {
        if (!e.data) return false;
        return uniqueMatchIds.includes(e.data.proyecto_id) || uniqueMatchIds.includes(e.data.cotizacion_id);
      });
      console.log(`\nEspacios encontrados para estos proyectos: ${espaciosRelacionados.length}`);
      console.log(JSON.stringify(espaciosRelacionados, null, 2));

      const espacioIds = espaciosRelacionados.map(e => e.id);
      if (espacioIds.length > 0) {
        const items = await sql`
          SELECT id, data FROM agnostic_records WHERE namespace = 'items_variante';
        `;
        const itemsRelacionados = items.filter(i => {
          if (!i.data) return false;
          return espacioIds.includes(i.data.variante_id);
        });
        console.log(`\nItems de variante encontrados: ${itemsRelacionados.length}`);
        console.log(JSON.stringify(itemsRelacionados.slice(0, 10), null, 2));
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
