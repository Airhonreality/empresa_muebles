import { config } from 'dotenv';
config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { portafolio } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const all = await db.select().from(portafolio);
  const cacheBuster = `?v=${Date.now()}`;

  for (const p of all) {
    if (!p.galeriaPortafolioUrl || !Array.isArray(p.galeriaPortafolioUrl)) continue;

    // Remove existing query params if any, and append the new one
    const newGal = (p.galeriaPortafolioUrl as string[]).map((url: string) => {
      const base = url.split('?')[0];
      return `${base}${cacheBuster}`;
    });

    let newIm = null;
    if (p.imagenPortafolioUrl) {
      newIm = `${p.imagenPortafolioUrl.split('?')[0]}${cacheBuster}`;
    }

    console.log(`Rompiendo caché para ${p.slug}...`);
    await db.update(portafolio)
      .set({ galeriaPortafolioUrl: newGal, imagenPortafolioUrl: newIm })
      .where(eq(portafolio.id, p.id));
  }
  console.log("¡Caché roto exitosamente en la BD!");
  await client.end();
}

run().catch(e => {
  console.error(e);
  client.end();
  process.exit(1);
});
