import { NextResponse } from 'next/server';
import { getPublicStoreProducts } from '@/server/public-site-data';

export const dynamic = 'force-dynamic';

/** Public catalog endpoint. Its response is a server-enforced projection, never Vault data. */
export async function GET() {
  return NextResponse.json({ success: true, records: await getPublicStoreProducts() });
}
