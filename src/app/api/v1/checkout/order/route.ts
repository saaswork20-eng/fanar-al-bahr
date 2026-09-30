import { NextRequest, NextResponse } from 'next/server';
import { requireBuyer, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { paymentGateway } from '@/lib/payment';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/v1/checkout/order
 * Server-authoritative checkout route.
 *
 * Security & Integrity:
 * 1. Requires authenticated BUYER role.
 * 2. Strictly recalculates all prices, stock, discounts, tax, and shipping server-side.
 * 3. Client-provided prices or totals are completely ignored.
 * 4. Double stock verification before order registration.
 * 5. Creates pending order and initializes payment gateway session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireBuyer();

    // Sensitive checkout rate limiting: 10 orders per 10 minutes per buyer
    const rateResult = checkRateLimit({
      key: `checkout:${session.userId}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many checkout attempts. Please wait a few minutes before placing another order.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { shippingAddress, notes, couponCode, items: directItems } = body;

    let orderItemsToProcess: Array<{ productId: string; quantity: number }> = [];

    // If directItems is provided (e.g. "Buy Now" flow), validate it
    if (Array.isArray(directItems) && directItems.length > 0) {
      for (const item of directItems) {
        if (!item.productId || typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid items payload provided for direct checkout' },
            { status: 400 }
          );
        }
        orderItemsToProcess.push({
          productId: item.productId,
          quantity: Number(item.quantity),
        });
      }
    } else {
      // Default: Checkout the authenticated buyer's real persistent cart
      const cart = await db.cart.getWithDetails(session.userId);
      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Your cart is empty. Please add products before checking out.' },
          { status: 400 }
        );
      }
      orderItemsToProcess = cart.items.map((ci) => ({
        productId: ci.productId,
        quantity: ci.quantity,
      }));
    }

    // Determine if any item requires physical shipping
    let requiresPhysicalShipping = false;
    for (const oi of orderItemsToProcess) {
      const prod = await db.product.findUnique({ where: { id: oi.productId } });
      if (!prod) {
        return NextResponse.json(
          { success: false, error: `Product with ID ${oi.productId} was not found` },
          { status: 404 }
        );
      }
      if (!prod.isActive || (prod.status && prod.status !== 'PUBLISHED')) {
        return NextResponse.json(
          { success: false, error: `Product "${prod.title}" is currently unavailable` },
          { status: 400 }
        );
      }
      const availableStock = prod.stockQuantity ?? prod.stock ?? 0;
      if (availableStock < oi.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `This product "${prod.title}" is no longer available in the requested quantity (Requested: ${oi.quantity}, Available: ${availableStock}).`,
          },
          { status: 400 }
        );
      }
      if (prod.deliveryType === 'PHYSICAL_SHIPPING') {
        requiresPhysicalShipping = true;
      }
    }

    // Validate physical shipping address if physical goods are included
    if (requiresPhysicalShipping) {
      if (!shippingAddress || typeof shippingAddress !== 'object') {
        return NextResponse.json(
          { success: false, error: 'Delivery address is required for physical goods' },
          { status: 400 }
        );
      }
      const { fullName, phone, address, city, state, postalCode, country } = shippingAddress;
      if (!fullName || !phone || !address || !city || !state || !postalCode || !country) {
        return NextResponse.json(
          {
            success: false,
            error: 'All delivery address fields (Full Name, Phone, Address, City, State, Postal Code, Country) are required for physical shipping.',
          },
          { status: 400 }
        );
      }
    }

    // Atomic pending order creation with server-side price calculation
    const order = await db.order.createPendingOrder({
      buyerId: session.userId,
      buyerEmail: session.email,
      buyerName: session.name || null,
      items: orderItemsToProcess,
      shippingAddress: shippingAddress || null,
      notes: notes || null,
      couponCode: couponCode || null,
    });

    // Initialize payment intent via payment gateway
    const paymentIntent = await paymentGateway.createPaymentIntent(order);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        currency: order.currency,
        itemsCount: order.items?.length || 0,
        createdAt: order.createdAt,
      },
      payment: paymentIntent,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 400 }
    );
  }
}
