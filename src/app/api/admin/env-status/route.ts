import { NextResponse } from 'next/server';
import { collectEnvPresence } from '@/lib/agnostic/env-contract';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(collectEnvPresence());
}
