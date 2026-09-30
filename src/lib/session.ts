import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'fanar_session';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

const SECRET_STRING = process.env.NEXTAUTH_SECRET || 'dev-jwt-secret-fanar-al-bhar-ecommerce-token-2026';
const JWT_SECRET = new TextEncoder().encode(SECRET_STRING);

export type UserRole = 'ADMIN' | 'BUYER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: AccountStatus;
}

/**
 * Signs a session payload into a JWT.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a session JWT.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (!payload.userId || !payload.email || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
      role: payload.role as UserRole,
      status: (payload.status as AccountStatus) || 'ACTIVE',
    };
  } catch {
    return null;
  }
}

let _testSessionContext: SessionPayload | null = null;

export function setTestSessionContext(session: SessionPayload | null) {
  _testSessionContext = session;
}

/**
 * Gets the current session from incoming request cookies or headers.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  if (_testSessionContext) {
    return _testSessionContext;
  }

  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) return await verifySessionToken(token);
  } catch {}

  try {
    const headerStore = headers();
    const authHeader =
      headerStore.get('authorization') ||
      headerStore.get('cookie') ||
      headerStore.get('x-fanar-session');

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const decoded = await verifySessionToken(authHeader.substring(7));
        if (decoded) return decoded;
      }
      const match = authHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match && match[1]) {
        const decoded = await verifySessionToken(match[1]);
        if (decoded) return decoded;
      }
      const decoded = await verifySessionToken(authHeader);
      if (decoded) return decoded;
    }
  } catch {}

  return null;
}

export const getOptionalSession = getCurrentSession;
export const getSession = getCurrentSession;

/**
 * Attaches the session cookie to a NextResponse.
 */
export function applySessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}

/**
 * Clears the session cookie on a NextResponse.
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

// --------------------------------------------------------
// SERVER-SIDE AUTHORIZATION GUARDS (SINGLE-VENDOR)
// --------------------------------------------------------

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

/**
 * Asserts that a user is authenticated. Throws AuthError if not.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw new AuthError('Authentication required. Please log in.', 401);
  }

  if (session.status === 'SUSPENDED' || session.status === 'BANNED') {
    throw new AuthError('Your account has been suspended or banned. Please contact support.', 403);
  }

  return session;
}

/**
 * Asserts that a user has one of the allowed roles.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(`Forbidden. Access requires one of: ${allowedRoles.join(', ')}`, 403);
  }
  return session;
}

/**
 * Asserts that the current session belongs to the platform ADMIN (Fanar Al Bhar Store Owner).
 */
export async function requireAdmin(): Promise<SessionPayload> {
  return requireRole(['ADMIN']);
}

/**
 * Asserts that the current session belongs to a BUYER (Customer).
 */
export async function requireBuyer(): Promise<SessionPayload> {
  return requireRole(['BUYER']);
}

/**
 * Asserts that a user owns the resource or is the platform ADMIN.
 */
export async function requireOwnershipOrAdmin(ownerId: string): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role === 'ADMIN') {
    return session;
  }
  if (session.userId !== ownerId) {
    throw new AuthError('Forbidden. You do not have permission to access or modify this resource.', 403);
  }
  return session;
}
