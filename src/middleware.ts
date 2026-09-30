import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'fanar_session';
const SECRET_STRING = process.env.NEXTAUTH_SECRET || 'dev-jwt-secret-fanar-al-bhar-ecommerce-token-2026';
const JWT_SECRET = new TextEncoder().encode(SECRET_STRING);

interface DecodedToken {
  userId: string;
  email: string;
  role: 'ADMIN' | 'BUYER';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
}

async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return payload as unknown as DecodedToken;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifyToken(sessionCookie) : null;

  // 1. ADMIN ROUTE PROTECTION (/admin/*)
  if (pathname.startsWith('/admin')) {
    // Allow public access to /admin/login
    if (pathname === '/admin/login') {
      if (session && session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Require ADMIN role for all other /admin/* routes
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'ADMIN') {
      const forbiddenUrl = new URL('/admin/login', request.url);
      forbiddenUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 2. BUYER ACCOUNT PROTECTION (/account/*)
  if (pathname.startsWith('/account')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. AUTH PAGES REDIRECT IF ALREADY LOGGED IN
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/login',
    '/register',
  ],
};
