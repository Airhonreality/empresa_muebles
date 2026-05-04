import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';
import type { DataItem } from '@/core/types';

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('host') || undefined;
    const strategy = await getStrategy(host);
    const data = await strategy.read();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Read failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || undefined;
    const strategy = await getStrategy(host);
    const body = (await req.json()) as Record<string, DataItem[]>;
    await strategy.write(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Write failed' },
      { status: 500 }
    );
  }
}
