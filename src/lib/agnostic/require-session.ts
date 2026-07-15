import 'server-only';

import { timingSafeEqual } from 'crypto';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/agnostic/session';

/** Verifies the signed session in the server runtime; middleware only provides an early redirect. */
export async function requireSession(): Promise<NonNullable<SessionData['user']>> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) throw new Error('AUTHENTICATION_REQUIRED');
  return session.user;
}

export async function requireManagementAccess(request: Request): Promise<void> {
  const configuredSecret = process.env.API_SECRET_KEY;
  const receivedSecret = request.headers.get('x-api-secret');
  if (configuredSecret && receivedSecret) {
    const expected = Buffer.from(configuredSecret);
    const actual = Buffer.from(receivedSecret);
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) return;
  }
  await requireSession();
}
