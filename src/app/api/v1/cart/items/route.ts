import { NextRequest, NextResponse } from 'next/server';
import { requireBuyer, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

/**
 * POST /api/v1/cart/items
 * Adds a product to the authenticated buyer's cart with server-side validation.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireBuyer();
    const body = await req.json().catch(() => ({}));
    const { productId, quantity = 1 } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Product ID is required and must be a string' },
        { status: 400 }
      );
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive integer' },
        { status: 400 }
      );
    }

    const cart = await db.cart.addItem(session.userId, productId, qty);

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      cart,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    // Business logic errors (e.g., out of stock, unpublished, invalid)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add item to cart' },
      { status: 400 }
    );
  }
}
