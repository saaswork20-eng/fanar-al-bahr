import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Verification token is required.' }, { status: 400 });
    }

    const verificationRecord = await db.emailVerificationToken.findUnique({ where: { token } });
    if (!verificationRecord || verificationRecord.used) {
      return NextResponse.json(
        { success: false, error: 'Invalid or already used verification link.' },
        { status: 400 }
      );
    }

    if (new Date(verificationRecord.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'This verification link has expired.' },
        { status: 400 }
      );
    }

    // Mark email as verified on user
    await db.user.update({
      where: { id: verificationRecord.userId },
      data: { emailVerified: new Date().toISOString() },
    });

    await db.emailVerificationToken.update({
      where: { id: verificationRecord.id },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying email.' },
      { status: 500 }
    );
  }
}
