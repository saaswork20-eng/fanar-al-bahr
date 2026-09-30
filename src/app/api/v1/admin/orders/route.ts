import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

/**
 * GET /api/v1/admin/orders
 * Returns orders with server-side search and filtering for the store owner (Admin).
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as OrderStatus) || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: {
          search,
          status,
          paymentStatus,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.order.count({
        where: {
          search,
          status,
          paymentStatus,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
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
