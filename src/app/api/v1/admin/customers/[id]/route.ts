import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { AccountStatus } from '@prisma/client';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const customer = await db.user.findUniqueWithStats(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Prevent changing role through this endpoint
    if (body.role !== undefined) {
      return NextResponse.json(
        { success: false, error: 'Role changes are not permitted through this operation' },
        { status: 403 }
      );
    }

    const validated = updateStatusSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Invalid status' },
        { status: 400 }
      );
    }

    const updated = await db.user.updateStatus(id, validated.data.status);

    await db.auditLog.create({
      data: {
        adminId: adminSession.userId,
        adminEmail: adminSession.email,
        action: 'CUSTOMER_STATUS_UPDATED',
        targetType: 'USER',
        targetId: id,
        targetName: updated.name || updated.email,
        details: `Customer status set to ${validated.data.status}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Customer account ${validated.data.status.toLowerCase()} successfully`,
      customer: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
