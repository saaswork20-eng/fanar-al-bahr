import { NextResponse } from 'next/server';
import { requireBuyer, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

/**
 * GET /api/v1/cart
 * Fetches the authenticated buyer's real persistent shopping cart with fully calculated
 * server-side prices, stock availability, subtotal, and tax/shipping snapshots.
 */
export async function GET() {
  try {
    const session = await requireBuyer();
    const cart = await db.cart.getWithDetails(session.userId);

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/cart
 * Clears all items from the authenticated buyer's cart.
 */
export async function DELETE() {
  try {
    const session = await requireBuyer();
    const cart = await db.cart.clear(session.userId);

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
      cart,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
