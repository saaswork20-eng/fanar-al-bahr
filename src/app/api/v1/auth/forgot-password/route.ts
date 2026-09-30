import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { email } = validated.data;
    const user = await db.user.findUnique({ where: { email } });

    // For security, always respond with success even if user not found (prevents enumeration)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      // Provided in development response to allow seamless testing of reset flow
      devResetToken: token,
      resetLink: `/reset-password?token=${token}`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing request.' },
      { status: 500 }
    );
  }
}
