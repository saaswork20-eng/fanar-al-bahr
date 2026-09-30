import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireAuth();
    const { productId } = await params;

    const inWishlist = await db.wishlist.hasItem({
      userId: session.userId,
      productId,
    });

    return NextResponse.json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireAuth();
    const { productId } = await params;

    const removed = await db.wishlist.removeItem({
      where: {
        userId: session.userId,
        productId,
      },
    });

    const totalCount = await db.wishlist.count({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      message: removed ? 'Product removed from wishlist' : 'Product was not in wishlist',
      wishlistCount: totalCount,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
