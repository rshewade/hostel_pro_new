import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// All public paths that do NOT require authentication
const publicPaths = [
  // Landing & Static Pages
  '/',
  '/about',
  '/contact',
  '/faq',
  '/donations',
  '/facilities',
  '/gallery',
  '/news',
  '/trustees',
  '/dpdp-policy',
  '/design-system',
  '/demo',
  '/communication-demo',
  '/communication-advanced-demo',

  // Auth Pages
  '/login',
  '/verify',

  // Application Flow (public — anyone can apply)
  '/apply',
  '/track',
  '/admissions',
  '/institutions',

  // Public API Routes
  '/api/auth',
  '/api/health',
  '/api/applications', // Public: create, track, list
  '/api/otp',
  '/api/config/leave-types',
  '/api/config/notification-rules',
  '/api/config/blackout-dates',
  '/api/rooms', // Public: view room availability
  '/api/fees', // Public: view fees (filtered by student_id param)
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public paths
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
