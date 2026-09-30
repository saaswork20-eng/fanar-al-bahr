import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

/**
 * GET /api/v1/admin/coupons
 * ADMIN ONLY: List all coupons.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const activeParam = searchParams.get('active');
    const isActive = activeParam !== null ? activeParam === 'true' : undefined;

    const coupons = await db.coupon.findMany({
      where: {
        isActive,
        search,
      },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch coupons.' }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/coupons
 * ADMIN ONLY: Create a new promotional discount coupon.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      isActive,
    } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Coupon code is required.' }, { status: 400 });
    }

    if (!discountType || (discountType !== 'PERCENTAGE' && discountType !== 'FIXED')) {
      return NextResponse.json({ success: false, error: 'Discount type must be PERCENTAGE or FIXED.' }, { status: 400 });
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json({ success: false, error: 'Discount value must be a positive number.' }, { status: 400 });
    }

    if (discountType === 'PERCENTAGE' && val > 100) {
      return NextResponse.json({ success: false, error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
    }

    const coupon = await db.coupon.create(
      {
        code,
        discountType,
        discountValue: val,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      {
        adminId: admin.userId,
        adminEmail: admin.email,
      }
    );

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create coupon.' }, { status: 400 });
  }
}
