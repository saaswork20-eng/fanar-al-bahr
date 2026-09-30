import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await requireAdmin();
    const user = await db.user.findUnique({ where: { id: session.userId } });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Admin profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { firstName, lastName, name, phone } = body;

    // Strict security: Role and email cannot be changed through this frontend profile route
    const updated = await db.user.updateProfile(session.userId, {
      firstName: firstName !== undefined ? firstName : undefined,
      lastName: lastName !== undefined ? lastName : undefined,
      phone: phone !== undefined ? phone : undefined,
    });

    if (name && !firstName && !lastName) {
      await db.user.update({
        where: { id: session.userId },
        data: { name: String(name).trim() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile updated successfully',
      profile: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        role: updated.role,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
