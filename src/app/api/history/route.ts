/**
 * GET /api/history?namespace=X&limit=20
 *
 * Returns the version log for a namespace.
 *
 * Per strategy:
 *   GitHubStrategy → GitHub Commits API for db/{namespace}.json
 *   LocalStrategy  → activity-log filtered by namespace (local dev only)
 *   Other          → empty array
 *
 * Each entry: { sha, message, author, email, timestamp, url }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const namespace = url.searchParams.get('namespace') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    if (!namespace) {
      return NextResponse.json({ error: 'namespace param required' }, { status: 400 });
    }

    const strategy = getStrategy() as any;

    const history = typeof strategy.getHistory === 'function'
      ? await strategy.getHistory(namespace, limit)
      : [];

    return NextResponse.json({ namespace, history });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'History fetch failed' },
      { status: 500 }
    );
  }
}
