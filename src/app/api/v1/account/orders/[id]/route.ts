import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/account/orders/[id]
 * Retrieves details for a specific order.
 * Strictly protected against IDOR/BOLA:
 * Buyers can ONLY view their own orders. Admins can view any order.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const orderIdentifier = id;

    if (!orderIdentifier) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderIdentifier },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Strict IDOR Protection: Buyers can ONLY access their own orders
    if (session.role !== 'ADMIN' && order.buyerId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to access this order.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
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
