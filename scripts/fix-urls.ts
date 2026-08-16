import { config } from 'dotenv';
config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { portafolio } from '../lib/db/schema';

const PUBLIC_DOMAIN = 'https://pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev';

async function run() {
  const all = await db.select().from(portafolio);
  for (const p of all) {
    if (!p.galeriaPortafolioUrl || !Array.isArray(p.galeriaPortafolioUrl)) continue;

    const newGal = (p.galeriaPortafolioUrl as string[]).map((url: string) => 
      url.replace('https://veta-dorada.r2.cloudflarestorage.com', PUBLIC_DOMAIN)
    );
    const newIm = p.imagenPortafolioUrl ? p.imagenPortafolioUrl.replace('https://veta-dorada.r2.cloudflarestorage.com', PUBLIC_DOMAIN) : null;

    console.log(`Actualizando ${p.slug}...`);
    const { eq } = await import('drizzle-orm');
    await db.update(portafolio)
      .set({ galeriaPortafolioUrl: newGal, imagenPortafolioUrl: newIm })
      .where(eq(portafolio.id, p.id));
  }
  console.log("¡Arreglado exitosamente!");
  await client.end();
}

run().catch(e => {
  console.error(e);
  client.end();
  process.exit(1);
});
