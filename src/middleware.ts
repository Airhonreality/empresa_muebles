import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const baseDomain = process.env.BASE_DOMAIN ?? '';
  
  // Extract subdomain if host ends with the base domain
  const subdomain = baseDomain && host.endsWith(`.${baseDomain}`)
    ? host.slice(0, host.length - baseDomain.length - 1)
    : null;

  if (subdomain) {
    const headers = new Headers(request.headers);
    headers.set('x-tenant', subdomain);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};
