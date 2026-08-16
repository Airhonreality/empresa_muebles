import { config } from 'dotenv';
config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { portafolio } from '../lib/db/schema';
import { like } from 'drizzle-orm';

async function run() {
  console.log("Rellenando el proyecto de Victoria Giraldo...");

  const descripcion = `Esta cocina fue diseñada con un enfoque abierto que conecta el área de preparación con la zona social. El reto principal fue maximizar el almacenamiento sin sacrificar la estética minimalista y limpia. 

Utilizamos tonos cálidos y texturas orgánicas para contrastar con el frío de la piedra natural, logrando un equilibrio perfecto. Los frentes sin tiradores (sistema gola) y la iluminación LED oculta en los gabinetes superiores aportan un aire de modernidad y sofisticación absoluta. 

Un espacio donde la ergonomía y la alta ebanistería se encuentran para crear no solo un lugar de trabajo, sino el verdadero corazón del hogar.`;

  const materiales = [
    "Poliuretano Supermate color Humo",
    "Chapa de madera natural Teka Catedral",
    "Mesón en Piedra Sinterizada Dekton",
    "Herrajes Blum Legrabox con cierre suave",
    "Perfilería Gola de aluminio anodizado champaña"
  ];

  await db.update(portafolio)
    .set({
      descripcionComercial: descripcion,
      materialesDestacados: materiales,
      precioReferencial: "Desde $45.000.000 COP",
      barrio: "Santa Bárbara Alta, Bogotá",
      tipoProyecto: "Remodelación Integral de Cocina",
      categoriaEspacio: "Cocina y Zona Social",
      destacado: true
    })
    .where(like(portafolio.slug, '%victoria-giraldo%'));

  console.log("¡Proyecto Victoria Giraldo actualizado con éxito!");
  await client.end();
}

run().catch(e => {
  console.error(e);
  client.end();
  process.exit(1);
});
