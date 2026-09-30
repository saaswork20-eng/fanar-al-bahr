import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await db.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const stats = await db.review.getProductStats(product.id);
    const reviewsResult = await db.review.findMany({
      where: {
        productId: product.id,
        isApproved: true,
      },
    });

    let userState = {
      canReview: false,
      alreadyReviewed: false,
      hasPurchased: false,
    };

    const session = await getOptionalSession();
    if (session) {
      userState = await db.review.checkCanReview(session.userId, product.id);
    }

    return NextResponse.json({
      success: true,
      productId: product.id,
      stats,
      reviews: reviewsResult.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        buyerDisplayName: r.buyerDisplayName || 'Customer',
      })),
      userState,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
