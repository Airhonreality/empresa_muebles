import { config } from 'dotenv'; config({ path: '.env.local' });
import { db, client } from '../lib/db/client';
import { portfolioPublico } from '../lib/db/schema';
import { sql } from 'drizzle-orm';
(async () => {
  const r = await db.select({ titulo: portfolioPublico.titulo, slug: portfolioPublico.slug }).from(portfolioPublico);
  console.log('Filas restantes:');
  for (const x of r) console.log(`  ${x.titulo}  ->  ${x.slug}`);
  const [d] = await db.select({ n: sql<number>`count(*)` }).from(portfolioPublico);
  console.log('total:', Number(d.n));
  await client.end();
})().catch(e => { console.error(e); client.end(); process.exit(1); });
