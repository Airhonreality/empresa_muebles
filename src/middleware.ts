import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/agnostic/session';

const PROTECTED_PATHS = ['/app', '/schema', '/_data', '/setup'];
const PROTECTED_API_PATHS = ['/api/admin', '/api/engine', '/api/pulse'];
const PUBLIC_PATHS    = ['/login', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPage = !pathname.startsWith('/api/') && !PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));

  const isProtected =
    PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`)) ||
    PROTECTED_API_PATHS.some(p => pathname.startsWith(p)) ||
    pathname === '/api/vault';
    const isPublic    = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  if (isProtected && !isPublic) {
      // ── M2toM2 (CLI/API) Auth Bypass ────────────────────────────────────────
      const apiSecret = process.env.API_SECRET_KEY;
      const requestSecret = request.headers.get('x-api-secret');
      if (apiSecret && requestSecret === apiSecret) {
        return NextResponse.next();
      }

      // ── B2B (Browser) Auth ──────────────────────────────────────────────────
      const cookie = request.cookies.get(SESSION_COOKIE);
    if (!cookie?.value) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isPublicPage) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-agnostic-public-site', '1');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};
