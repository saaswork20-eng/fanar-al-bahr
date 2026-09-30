import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getOptionalSession, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { z } from 'zod';

const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z.string().min(3, 'Review must be at least 3 characters').max(1000, 'Review cannot exceed 1000 characters').trim(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;
    const take = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : 0;

    const result = await db.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      take,
      skip,
    });

    return NextResponse.json({
      success: true,
      reviews: result.reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        buyerDisplayName: r.buyerDisplayName || 'Verified Buyer',
      })),
      total: result.total,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const validated = createReviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    try {
      const review = await db.review.create({
        data: {
          productId: validated.data.productId,
          buyerId: session.userId,
          rating: validated.data.rating,
          comment: validated.data.comment,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Review submitted successfully',
          review,
        },
        { status: 201 }
      );
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || 'Failed to submit review' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
