import { NextRequest, NextResponse } from 'next/server';
import { requireBuyer, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

/**
 * GET /api/v1/account/notifications
 * BUYER ONLY: Fetch in-app notifications for the authenticated customer.
 */
export async function GET() {
  try {
    const session = await requireBuyer();
    const notifications = await db.notification.findManyForUser(session.userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch notifications.' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/account/notifications
 * Mark all notifications as read for current buyer.
 */
export async function PATCH() {
  try {
    const session = await requireBuyer();
    await db.notification.markAllAsRead(session.userId);
    return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to update notifications.' }, { status: 500 });
  }
}
