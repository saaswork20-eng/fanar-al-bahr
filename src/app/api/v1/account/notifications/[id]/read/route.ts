import { NextRequest, NextResponse } from 'next/server';
import { requireBuyer, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/account/notifications/[id]/read
 * Mark single notification as read.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await requireBuyer();
    const { id } = await context.params;
    const updated = await db.notification.markAsRead(id, session.userId);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Notification not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to update notification.' }, { status: 500 });
  }
}
