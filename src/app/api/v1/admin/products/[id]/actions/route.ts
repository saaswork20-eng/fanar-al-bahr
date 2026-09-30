import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const adminUser = {
      id: session.userId,
      email: session.email,
    };

    if (action === 'duplicate') {
      const cloned = await db.product.duplicate(id, adminUser);
      return NextResponse.json({
        success: true,
        message: 'Product duplicated successfully',
        product: cloned,
      });
    }

    if (action === 'toggle-publish') {
      const publish = Boolean(body.publish);
      const updated = await db.product.togglePublish(id, publish, adminUser);
      return NextResponse.json({
        success: true,
        message: `Product ${publish ? 'published' : 'unpublished'} successfully`,
        product: updated,
      });
    }

    if (action === 'update-price') {
      const price = Number(body.price);
      const discountPrice = body.discountPrice !== undefined && body.discountPrice !== null ? Number(body.discountPrice) : undefined;
      const updated = await db.product.updatePrice(id, price, discountPrice, adminUser);
      return NextResponse.json({
        success: true,
        message: 'Product pricing updated successfully',
        product: updated,
      });
    }

    if (action === 'update-stock') {
      const stockQuantity = Number(body.stockQuantity);
      const updated = await db.product.updateStock(id, stockQuantity, adminUser);
      return NextResponse.json({
        success: true,
        message: 'Product stock updated successfully',
        product: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: statusCode }
    );
  }
}
