import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/agnostic/session';

/**
 * Route protection — engine defaults + fork additions via env vars.
 * ─────────────────────────────────────────────────────────────────
 * A fork adds its own protected/public/public-share prefixes through env vars
 * (comma-separated) so it NEVER edits this engine file. Middleware runs on the
 * edge runtime, so config comes from process.env (not storage/fs):
 *
 *   AGNOSTIC_PROTECTED_PATHS       e.g. "/app,/setup"
 *   AGNOSTIC_PROTECTED_API_PATHS   e.g. "/api/billing"
 *   AGNOSTIC_PUBLIC_PATHS          e.g. "/pricing"
 *   AGNOSTIC_PUBLIC_SHARE_PATHS    e.g. "/propuesta"   (SSR public-share mode)
 */
const ENGINE_PROTECTED_PATHS = ['/schema', '/_data'];
const ENGINE_PROTECTED_API_PATHS = ['/api/admin', '/api/engine', '/api/public-links', '/api/pulse'];
const ENGINE_PUBLIC_PATHS = ['/login', '/api/auth'];
const ENGINE_PUBLIC_SHARE_PATHS = ['/share'];

function envPaths(key: string): string[] {
  return (process.env[key] ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

const PROTECTED_PATHS = [...ENGINE_PROTECTED_PATHS, ...envPaths('AGNOSTIC_PROTECTED_PATHS')];
const PROTECTED_API_PATHS = [...ENGINE_PROTECTED_API_PATHS, ...envPaths('AGNOSTIC_PROTECTED_API_PATHS')];
const PUBLIC_PATHS = [...ENGINE_PUBLIC_PATHS, ...envPaths('AGNOSTIC_PUBLIC_PATHS')];
const PUBLIC_SHARE_PATHS = [...ENGINE_PUBLIC_SHARE_PATHS, ...envPaths('AGNOSTIC_PUBLIC_SHARE_PATHS')];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicShare = PUBLIC_SHARE_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));

  if (isPublicShare) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-agnostic-public-share', '1');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isProtected =
    PROTECTED_PATHS.some(p => pathname.startsWith(p)) ||
    PROTECTED_API_PATHS.some(p => pathname.startsWith(p)) ||
    pathname === '/api/vault';
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};
