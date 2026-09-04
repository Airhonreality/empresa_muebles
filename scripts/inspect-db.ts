import { db } from '../lib/db/client'
import * as s from '../lib/db/schema'
async function main() {
  const items = await db.select().from(s.itemsVariante).limit(10);
  console.log(items);
  process.exit(0);
}
main();
