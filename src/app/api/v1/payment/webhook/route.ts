import { NextRequest, NextResponse } from 'next/server';
import { paymentGateway } from '@/lib/payment';
import { db } from '@/lib/db';
import { notificationService } from '@/lib/notifications';

/**
 * POST /api/v1/payment/webhook
 * Production-ready payment webhook endpoint.
 *
 * Security:
 * 1. Cryptographically verifies signature before processing.
 * 2. Idempotent: duplicate webhook deliveries for the same payment reference do not double-process orders.
 * 3. Never trusts client-side payment success indications.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-signature') ||
      req.headers.get('stripe-signature') ||
      req.headers.get('x-razorpay-signature') ||
      req.headers.get('x-webhook-signature');

    // 1. Verify cryptographic signature
    const isValid = paymentGateway.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing cryptographic signature' },
        { status: 400 }
      );
    }

    // 2. Parse event payload
    const event = paymentGateway.parseWebhookPayload(rawBody);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Malformed webhook payload structure' },
        { status: 400 }
      );
    }

    // 3. Handle payment event
    if (event.eventType === 'payment.succeeded' || event.eventType === 'checkout.session.completed') {
      // Find order to verify amount / currency
      const order = await db.order.findUnique({ where: { id: event.orderId } });
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Referenced order not found' },
          { status: 404 }
        );
      }

      // Verify tampered amount if event contains amount
      const targetTotal = order.totalAmount ?? order.total ?? 0;
      if (event.amount > 0 && Math.round(event.amount) !== Math.round(targetTotal)) {
        return NextResponse.json(
          { success: false, error: 'Payment amount mismatch: suspected tampering' },
          { status: 400 }
        );
      }

      // 4. Confirm payment idempotently with atomic stock reduction & digital key assignment
      const confirmedOrder = await db.order.confirmPayment(event.orderId, event.paymentId);

      // 5. Trigger notification
      await notificationService.sendPaymentConfirmation({
        orderId: confirmedOrder.id,
        orderNumber: confirmedOrder.orderNumber,
        recipientEmail: confirmedOrder.buyer?.email || 'customer@example.com',
        recipientName: confirmedOrder.buyer?.name || 'Customer',
        total: confirmedOrder.totalAmount ?? confirmedOrder.total ?? 0,
        currency: confirmedOrder.currency || 'INR',
        items: (confirmedOrder.items || []).map((it: any) => ({
          title: it.productTitle,
          quantity: it.quantity,
          price: it.priceAtPurchase,
        })),
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order finalized',
        orderNumber: confirmedOrder.orderNumber,
        status: confirmedOrder.status,
      });
    }

    if (event.eventType === 'payment.failed') {
      const order = await db.order.findUnique({ where: { id: event.orderId } });
      if (order && order.paymentStatus === 'PENDING') {
        await db.order.updateStatus(order.id, 'CANCELLED', { paymentStatus: 'FAILED' });
      }
      return NextResponse.json({ success: true, message: 'Payment failure recorded' });
    }

    return NextResponse.json({ success: true, message: 'Event received' });
  } catch (error: any) {
    console.error('[Payment Webhook Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
