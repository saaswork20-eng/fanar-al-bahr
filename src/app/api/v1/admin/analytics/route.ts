import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || '30d';
    const validPeriods = ['today', '7d', '30d', '90d', 'all'];
    const period = validPeriods.includes(periodParam)
      ? (periodParam as 'today' | '7d' | '30d' | '90d' | 'all')
      : '30d';

    const analytics = await db.analytics.getSalesAnalytics(period);

    return NextResponse.json({
      success: true,
      ...analytics,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
