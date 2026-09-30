import { NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    await requireAdmin();

    const telemetry = await db.stats.getDashboardTelemetry();

    return NextResponse.json({
      success: true,
      telemetry,
      stats: {
        // Direct telemetry fields for Section 1 requirement
        sales: telemetry.sales,
        orders: telemetry.orders,
        products: telemetry.products,
        customers: telemetry.customers,
        // Flat legacy fields for backward compatibility
        totalProducts: telemetry.products.total,
        totalCustomers: telemetry.customers.total,
        totalOrders: telemetry.orders.total,
        pendingOrders: telemetry.orders.pending,
        deliveredOrders: telemetry.orders.completed,
        totalSales: telemetry.sales.total,
        totalRevenue: telemetry.sales.total,
        lowStockProducts: telemetry.products.lowStock,
        outOfStockProducts: telemetry.products.outOfStock,
        completedOrdersCount: telemetry.orders.completed,
      },
      recentOrders: telemetry.recentOrders,
      recentActivity: telemetry.recentActivity,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
