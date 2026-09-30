import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await requireAuth();

    // Strict tenant isolation: Query ONLY orders matching the authenticated user's ID
    const orders = await db.order.findMany({
      where: { buyerId: session.userId },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
