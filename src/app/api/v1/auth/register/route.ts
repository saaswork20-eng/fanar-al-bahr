import { NextRequest, NextResponse } from 'next/server';
import { registerBuyerSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signSessionToken, applySessionCookie } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateResult = checkRateLimit({
      key: `register:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 per hour
    });
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts from this address. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = registerBuyerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || 'Validation failed',
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user in real database
    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'BUYER',
        status: 'ACTIVE',
      },
    });

    // Send welcome email abstraction
    sendWelcomeEmail(newUser.email, newUser.name || '').catch(() => {});

    // Create session token
    const token = await signSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      redirectTo: '/account',
    });

    return applySessionCookie(response, token);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
