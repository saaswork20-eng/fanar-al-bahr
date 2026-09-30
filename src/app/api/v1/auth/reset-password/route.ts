import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { token, password } = validated.data;

    // Check token in DB
    const resetRecord = await db.passwordResetToken.findUnique({ where: { token } });
    if (!resetRecord || resetRecord.used) {
      return NextResponse.json(
        { success: false, error: 'Invalid or already used password reset link.' },
        { status: 400 }
      );
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(password);

    // Update user password
    await db.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error resetting password.' },
      { status: 500 }
    );
  }
}
