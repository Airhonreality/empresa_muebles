import { NextRequest, NextResponse } from 'next/server';
import { getPublicModelRevision } from '@/server/public-read-models';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const result = await getPublicModelRevision(resource);
  if (!result.exists) return NextResponse.json({ success: false, error: 'Public resource not found' }, { status: 404 });
  return NextResponse.json({ success: true, resource, revision: result.revision }, { headers: { 'Cache-Control': 'no-store' } });
}
