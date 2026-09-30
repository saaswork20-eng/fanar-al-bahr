import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    if (body.stockQuantity === undefined || typeof body.stockQuantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'stockQuantity is required and must be a number.' },
        { status: 400 }
      );
    }

    const stock = Number(body.stockQuantity);
    if (isNaN(stock) || stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock quantity cannot be negative.' },
        { status: 400 }
      );
    }

    const updates: any = {
      stockQuantity: stock,
    };

    if (body.lowStockThreshold !== undefined) {
      const threshold = Number(body.lowStockThreshold);
      if (isNaN(threshold) || threshold < 0) {
        return NextResponse.json(
          { success: false, error: 'Low stock threshold cannot be negative.' },
          { status: 400 }
        );
      }
      updates.lowStockThreshold = threshold;
    }

    // Auto-update status to OUT_OF_STOCK if stock is 0 and status is PUBLISHED
    if (stock === 0 && product.status === 'PUBLISHED') {
      updates.status = 'OUT_OF_STOCK';
    } else if (stock > 0 && product.status === 'OUT_OF_STOCK') {
      updates.status = 'PUBLISHED';
    }

    const updated = await db.product.update({
      where: { id: params.id },
      data: updates,
    });

    await db.auditLog.create({
      data: {
        adminId: admin.userId,
        adminEmail: admin.email,
        action: 'PRODUCT_STOCK_UPDATED',
        targetType: 'PRODUCT',
        targetId: product.id,
        targetName: product.title,
        details: `Adjusted inventory from ${product.stockQuantity} to ${stock} units`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Stock updated to ${stock} units.`,
      product: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Stock PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
