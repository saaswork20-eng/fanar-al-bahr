import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/v1/coupons/validate
 * Validates a coupon code against current subtotal server-side.
 * Rate limited to 20 attempts per 5 minutes per IP/User to prevent brute forcing.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const session = await getSession();
    const rateLimitKey = session ? `coupon:${session.userId}` : `coupon:${ip}`;

    const rateResult = checkRateLimit({
      key: rateLimitKey,
      limit: 20,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many coupon validation attempts. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { code, subtotal } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const numericSubtotal = Number(subtotal);
    if (isNaN(numericSubtotal) || numericSubtotal < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid numeric order subtotal is required.' },
        { status: 400 }
      );
    }

    const result = await db.coupon.validateCoupon(
      code,
      numericSubtotal,
      session?.userId
    );

    if (!result.valid || !result.coupon) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired coupon code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        discount: result.discount,
        minOrderAmount: result.coupon.minOrderAmount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate coupon.' },
      { status: 500 }
    );
  }
}
