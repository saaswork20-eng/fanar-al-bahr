import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { z } from 'zod';

const addWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export async function GET() {
  try {
    const session = await requireAuth();

    const items = await db.wishlist.getItems({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const validated = addWishlistSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    // Verify product exists and is active
    const product = await db.product.findUnique({
      where: { id: validated.data.productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    const item = await db.wishlist.addItem({
      data: {
        userId: session.userId,
        productId: product.id,
      },
    });

    const totalCount = await db.wishlist.count({
      where: { userId: session.userId },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product added to wishlist',
        item,
        wishlistCount: totalCount,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();

    await db.wishlist.clear({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Wishlist cleared',
      count: 0,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
