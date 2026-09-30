import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/v1/admin/orders/[id]
 * Retrieves comprehensive order details for Admin fulfillment.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id: orderIdentifier } = await params;

    if (!orderIdentifier) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderIdentifier },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Enrich customer profile info if needed
    const buyer = await db.user.findUnique({ where: { id: order.buyerId } });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        buyer: buyer
          ? {
              id: buyer.id,
              name: buyer.name,
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              email: buyer.email,
              phone: buyer.phone,
            }
          : null,
      },
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
 * PATCH /api/v1/admin/orders/[id]
 * Updates order status with strict workflow validation.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id: orderIdentifier } = await params;

    if (!orderIdentifier) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, paymentStatus, notes, trackingNumber, shippingMethod } = body;

    const validStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid order status. Allowed: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await db.order.updateStatus(orderIdentifier, status, {
      adminId: session.userId,
      adminEmail: session.email,
      paymentStatus: paymentStatus || undefined,
      notes: notes || undefined,
      trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
      shippingMethod: shippingMethod !== undefined ? shippingMethod : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order' },
      { status: statusCode }
    );
  }
}

