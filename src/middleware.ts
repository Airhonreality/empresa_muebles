import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/agnostic/session';

const PROTECTED_PATHS = ['/schema'];
const PROTECTED_API_PATHS = ['/api/admin', '/api/engine'];
const PUBLIC_PATHS    = ['/login', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Auth guard for /schema ────────────────────────────────────────────────
  // Only active when SESSION_SECRET is set (opt-in for production).
  // Without SESSION_SECRET the panel stays open (dev mode).
  const authEnabled = !!process.env.SESSION_SECRET;

  if (authEnabled) {
    const isProtected =
      PROTECTED_PATHS.some(p => pathname.startsWith(p)) ||
      PROTECTED_API_PATHS.some(p => pathname.startsWith(p)) ||
      (pathname === '/api/vault' && request.method !== 'GET');
    const isPublic    = PUBLIC_PATHS.some(p => pathname.startsWith(p));

    if (isProtected && !isPublic) {
      const cookie = request.cookies.get(SESSION_COOKIE);
      if (!cookie?.value) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};
