import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { decryptDigitalKey } from '@/lib/crypto-vault';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/account/orders/[id]/keys
 * Securely reveals decrypted digital serial keys for an order.
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * 1. Must be authenticated and either the buyer who owns this order or platform Admin.
 * 2. Order MUST have paymentStatus === 'PAID'. If PENDING/FAILED, key release is strictly forbidden.
 * 3. Never exposed in URLs or persistent storage; decrypted in-memory only upon authorized request.
 * 4. AES-256-GCM authenticated decryption.
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

    // IDOR verification
    if (session.role !== 'ADMIN' && order.buyerId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to access keys for this order.' },
        { status: 403 }
      );
    }

    // STRICT PAYMENT STATUS CHECK: Never release key before payment is confirmed
    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'Digital keys are strictly withheld until payment has been confirmed by the payment gateway.',
          paymentStatus: order.paymentStatus,
        },
        { status: 402 }
      );
    }

    // Collect order item IDs
    const items = order.items || [];
    const itemIds = items.map((i: any) => i.id);
    const assignedKeys = await db.productKey.findByOrderItemIds(itemIds);

    const decryptedKeys = assignedKeys.map((key) => {
      let plainTextKey = 'UNABLE_TO_DECRYPT';
      try {
        plainTextKey = decryptDigitalKey(key.cipherText, key.iv, key.tag);
      } catch (err) {
        console.error('Decryption failed for key ID:', key.id);
      }

      const matchingItem = items.find((it: any) => it.id === key.orderItemId);

      return {
        keyId: key.id,
        productId: key.productId,
        productTitle: matchingItem?.productTitle || 'Digital Product',
        serialKey: plainTextKey,
        assignedAt: key.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      keysCount: decryptedKeys.length,
      keys: decryptedKeys,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve digital keys' },
      { status: 500 }
    );
  }
}
