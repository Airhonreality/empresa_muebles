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
import { isDefinitionNamespace } from '@agnostic/core';
import { createPersistenceTopology } from '@/server/definitions/topology';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const namespace = url.searchParams.get('namespace') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    if (!namespace) {
      return NextResponse.json({ error: 'namespace param required' }, { status: 400 });
    }

    let history: unknown[];
    const topology = createPersistenceTopology();
    if (isDefinitionNamespace(namespace) && topology.mode === 'revision') {
      const revision = await topology.definitionReader.readActiveRevision();
      history = [{
        sha: revision.id,
        message: `Active definition revision (${revision.consistency})`,
        author: revision.source.kind,
        timestamp: null,
        url: null,
      }];
    } else {
      const strategy = getStrategy() as any;
      history = typeof strategy.getHistory === 'function'
        ? await strategy.getHistory(namespace, limit)
        : [];
    }

    return NextResponse.json({ namespace, history });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'History fetch failed' },
      { status: 500 }
    );
  }
}
