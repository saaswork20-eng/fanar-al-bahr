import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const validStatus = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].includes(statusParam || '')
      ? (statusParam as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK')
      : undefined;

    const result = await db.inventory.getInventory({
      search,
      status: validStatus,
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      items: result.items,
      stats: result.stats,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit) || 1,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => ({}));

    // Handle bulk update
    if (Array.isArray(body.updates)) {
      if (body.updates.length === 0) {
        return NextResponse.json({ success: false, error: 'Empty updates array' }, { status: 400 });
      }

      for (const item of body.updates) {
        if (!item.id || typeof item.stockQuantity !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Each update requires product id and numeric stockQuantity' },
            { status: 400 }
          );
        }
        if (item.stockQuantity < 0) {
          return NextResponse.json(
            { success: false, error: 'Stock quantity cannot be negative' },
            { status: 400 }
          );
        }
      }

      const res = await db.inventory.bulkUpdateStock(body.updates, {
        id: session.userId,
        email: session.email,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${res.updatedCount} products`,
        updatedCount: res.updatedCount,
      });
    }

    // Handle single update
    const { productId, stockQuantity, lowStockThreshold } = body;
    if (!productId || typeof stockQuantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'productId and numeric stockQuantity are required' },
        { status: 400 }
      );
    }

    if (stockQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock quantity cannot be negative' },
        { status: 400 }
      );
    }

    const updated = await db.inventory.updateStock(
      productId,
      stockQuantity,
      typeof lowStockThreshold === 'number' ? lowStockThreshold : undefined,
      {
        id: session.userId,
        email: session.email,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      product: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('negative') ? 400 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update inventory' },
      { status: statusCode }
    );
  }
}
