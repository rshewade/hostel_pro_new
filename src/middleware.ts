import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/login',
  '/verify',
  '/api/auth',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, static assets, and API auth routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
