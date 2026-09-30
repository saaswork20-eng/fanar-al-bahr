import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const settings = await db.settings.getSettings();

    return NextResponse.json({
      success: true,
      settings,
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => ({}));

    // Clean inputs and enforce types
    const updates: Record<string, any> = {};

    if (body.storeName !== undefined) updates.storeName = String(body.storeName).trim();
    if (body.storeDescription !== undefined) updates.storeDescription = String(body.storeDescription).trim();
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
    if (body.contactEmail !== undefined) updates.contactEmail = String(body.contactEmail).trim();
    if (body.contactPhone !== undefined) updates.contactPhone = String(body.contactPhone).trim();
    if (body.address !== undefined) updates.address = String(body.address).trim();
    if (body.currency !== undefined) updates.currency = String(body.currency).trim().toUpperCase();
    if (body.taxRatePercent !== undefined) updates.taxRatePercent = Math.max(0, Number(body.taxRatePercent) || 0);
    if (body.shippingRate !== undefined) updates.shippingRate = Math.max(0, Number(body.shippingRate) || 0);
    if (body.freeShippingThreshold !== undefined) updates.freeShippingThreshold = Math.max(0, Number(body.freeShippingThreshold) || 0);
    if (body.enableGuestCheckout !== undefined) updates.enableGuestCheckout = Boolean(body.enableGuestCheckout);
    if (body.autoApproveReviews !== undefined) updates.autoApproveReviews = Boolean(body.autoApproveReviews);
    if (body.lowStockThreshold !== undefined) updates.lowStockThreshold = Math.max(1, Number(body.lowStockThreshold) || 5);

    const updated = await db.settings.updateSettings(updates, {
      id: session.userId,
      email: session.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Store settings updated successfully',
      settings: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
