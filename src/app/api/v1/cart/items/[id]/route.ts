import { NextRequest, NextResponse } from 'next/server';
import { requireBuyer, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/v1/cart/items/[id]
 * Updates the quantity of a specific cart item for the authenticated buyer.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireBuyer();
    const itemId = params.id;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Cart item ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { quantity } = body;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive integer greater than zero' },
        { status: 400 }
      );
    }

    const cart = await db.cart.updateQuantity(session.userId, itemId, qty);

    return NextResponse.json({
      success: true,
      message: 'Cart item quantity updated',
      cart,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cart item' },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/v1/cart/items/[id]
 * Removes a specific cart item from the authenticated buyer's cart.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireBuyer();
    const itemId = params.id;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Cart item ID is required' }, { status: 400 });
    }

    const cart = await db.cart.removeItem(session.userId, itemId);

    return NextResponse.json({
      success: true,
      message: 'Cart item removed successfully',
      cart,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove cart item' },
      { status: statusCode }
    );
  }
}
