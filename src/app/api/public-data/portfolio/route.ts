import { NextResponse } from 'next/server';
import { getPublicPortfolio } from '@/server/public-site-data';

export const dynamic = 'force-dynamic';

/** Public portfolio endpoint: the response is an explicit projection, never Vault records. */
export async function GET() {
  return NextResponse.json({ success: true, records: await getPublicPortfolio() });
}
