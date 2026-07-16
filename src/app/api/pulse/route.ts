/**
 * GET /api/pulse?namespace=X
 *
 * Returns the current SHA fingerprint of a namespace file.
 * Clients poll this endpoint every N seconds and refetch data only when SHA changes.
 * Sub-100ms response: no content decode, no Zustand interaction.
 *
 * SHA semantics per strategy:
 *   GitHubStrategy → Git blob SHA (changes on every commit)
 *   LocalStrategy  → mtime+size fingerprint (changes on every write)
 *   Other          → null (polling skipped by client)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';
import { requireManagementAccess } from '@/lib/agnostic/require-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireManagementAccess(req);
    const url = new URL(req.url);
    const namespace = url.searchParams.get('namespace') || '';

    if (!namespace) {
      return NextResponse.json({ error: 'namespace param required' }, { status: 400 });
    }

    const strategy = getStrategy() as any;

    const sha: string | null = typeof strategy.getNamespaceSha === 'function'
      ? await strategy.getNamespaceSha(namespace)
      : null;

    return NextResponse.json({ namespace, sha });
  } catch (err) {
    if (err instanceof Error && err.message === 'AUTHENTICATION_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Pulse check failed' },
      { status: 500 }
    );
  }
}
