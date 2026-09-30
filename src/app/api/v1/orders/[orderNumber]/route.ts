import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: {
    orderNumber: string;
  };
}

/**
 * GET /api/v1/orders/[orderNumber]
 * Retrieves order details by human-readable order number (e.g. FAB-ORD-XXXX).
 * Protected: user must be authenticated and own the order (or be Admin).
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const orderNumber = params.orderNumber;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'Order number is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // IDOR protection
    if (session.role !== 'ADMIN' && order.buyerId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to view this order.' },
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
