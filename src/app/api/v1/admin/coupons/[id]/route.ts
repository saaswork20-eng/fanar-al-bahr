import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/coupons/[id]
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/coupons/[id]
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const updated = await db.coupon.update(id, body, {
      adminId: admin.userId,
      adminEmail: admin.email,
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to update coupon.' }, { status: 400 });
  }
}

/**
 * DELETE /api/v1/admin/coupons/[id]
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    await db.coupon.delete(id, {
      adminId: admin.userId,
      adminEmail: admin.email,
    });

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete coupon.' }, { status: 400 });
  }
}
