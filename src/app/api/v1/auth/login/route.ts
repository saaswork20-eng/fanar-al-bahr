import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { signSessionToken, applySessionCookie } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();

    const rateResult = checkRateLimit({
      key: `login:${ip}:${(body.email || '').toLowerCase()}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const portal = body.portal as 'ADMIN' | 'BUYER' | undefined;

    // Retrieve user from database
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return NextResponse.json(
        {
          success: false,
          error: `Your account is currently ${user.status.toLowerCase()}. Please contact support.`,
        },
        { status: 403 }
      );
    }

    // Portal role guard
    if (portal === 'ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    // Determine redirect destination
    const redirectTo = user.role === 'ADMIN' ? '/admin/dashboard' : '/account';

    // Sign session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirectTo,
    });

    return applySessionCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
