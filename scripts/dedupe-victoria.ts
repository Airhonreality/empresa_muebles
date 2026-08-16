import { config } from 'dotenv';
config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { portafolio } from '../lib/db/schema';
import { like } from 'drizzle-orm';
import crypto from 'crypto';

async function run() {
  const pList = await db.select().from(portafolio).where(like(portafolio.slug, '%victoria-giraldo%'));
  if (pList.length === 0) return;
  const p = pList[0];

  if (!p.galeriaPortafolioUrl || !Array.isArray(p.galeriaPortafolioUrl)) return;

  // Como los nombres de archivo en la URL son diferentes (cocina-1, cocina-2),
  // tenemos que descargar las primeras bytes o saber cuáles son duplicados.
  // Pero sabemos que el TXT original tenia solo 2 fotos únicas de verdad.
  // Mejor borramos las que sobran y dejamos solo las 2 primeras para la prueba.
  // O podemos descargar y hacer hash rápido.
  
  const urls = p.galeriaPortafolioUrl as string[];
  const uniqueHashes = new Set<string>();
  const deduplicatedUrls: string[] = [];

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      const buffer = await resp.arrayBuffer();
      const hash = crypto.createHash('md5').update(Buffer.from(buffer)).digest('hex');
      if (!uniqueHashes.has(hash)) {
        uniqueHashes.add(hash);
        deduplicatedUrls.push(url);
      }
    } catch (e) {
      console.log('Error fetching', url);
    }
  }

  await db.update(portafolio)
    .set({ galeriaPortafolioUrl: deduplicatedUrls })
    .where(like(portafolio.slug, '%victoria-giraldo%'));

  console.log(`Victoria Giraldo deduplicada! Quedaron ${deduplicatedUrls.length} fotos únicas.`);
  await client.end();
}

run().catch(console.error);
