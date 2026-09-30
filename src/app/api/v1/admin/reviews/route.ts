import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get('productId') || undefined;
    const isApprovedParam = searchParams.get('isApproved');
    const isApproved =
      isApprovedParam !== null && isApprovedParam !== undefined
        ? isApprovedParam === 'true'
        : undefined;

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;

    const result = await db.review.findMany({
      where: {
        productId,
        isApproved,
      },
      take: limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      reviews: result.reviews,
      total: result.total,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
