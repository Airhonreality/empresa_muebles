import { NextRequest, NextResponse } from 'next/server';
import { readPublicModel } from '@/server/public-read-models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params;
    const result = await readPublicModel(resource, request.nextUrl.searchParams);
    if (!result) return NextResponse.json({ success: false, error: 'Public resource not found' }, { status: 404 });
    return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid public query' }, { status: 400 });
  }
}
