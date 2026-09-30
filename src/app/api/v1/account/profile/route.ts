import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { updateProfileSchema } from '@/lib/validations/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const orders = await db.order.findMany({ where: { buyerId: session.userId } });
    const wishlistCount = await db.wishlist.count({ where: { userId: session.userId } });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        totalOrders: orders.length,
        wishlistCount,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // Prevent modifying role, status, id, passwordHash directly
    delete body.role;
    delete body.status;
    delete body.id;
    delete body.passwordHash;
    delete body.email; // Email changes require dedicated verification flow if supported

    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updated = await db.user.updateProfile(session.userId, {
      firstName: validated.data.firstName,
      lastName: validated.data.lastName,
      phone: validated.data.phone,
    });

    if (validated.data.name && (!validated.data.firstName && !validated.data.lastName)) {
      await db.user.update({
        where: { id: session.userId },
        data: { name: validated.data.name },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        phone: updated.phone || '',
        role: updated.role,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
