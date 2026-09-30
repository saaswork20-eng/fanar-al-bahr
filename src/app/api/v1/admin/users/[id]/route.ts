import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const user = await db.user.findUnique({
      where: { id: params.id },
      include: { orders: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        orders: user.orders || [],
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();
    const targetUserId = params.id;
    const body = await req.json();
    const newStatus = body.status;

    if (!newStatus || !['ACTIVE', 'SUSPENDED'].includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Supported: ACTIVE, SUSPENDED' },
        { status: 400 }
      );
    }

    // CRITICAL SECURITY GUARD: Admin must NOT be able to suspend their own account!
    if (adminSession.userId === targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action prohibited: Administrators cannot suspend their own administrative account.',
        },
        { status: 403 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent demoting other admins
    if (targetUser.role === 'ADMIN' && newStatus === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Action prohibited: Peer administrator accounts cannot be suspended via standard user management.',
        },
        { status: 403 }
      );
    }

    // Update status in DB
    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { status: newStatus },
    });

    // Record Audit Log
    const action = newStatus === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED';
    await db.auditLog.create({
      data: {
        adminId: adminSession.userId,
        adminEmail: adminSession.email,
        action,
        targetType: 'USER',
        targetId: targetUser.id,
        targetName: targetUser.name || targetUser.email,
        details: body.reason || `User account status transitioned to ${newStatus}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User status updated to ${newStatus}`,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
