import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateReviewAdminSchema = z.object({
  isApproved: z.boolean().optional(),
  comment: z.string().min(1).max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const validated = updateReviewAdminSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updated = await db.review.update({
      where: { id },
      data: validated.data,
    });

    await db.auditLog.create({
      data: {
        adminId: adminSession.userId,
        adminEmail: adminSession.email,
        action: 'REVIEW_MODERATED',
        targetType: 'PRODUCT',
        targetId: existing.productId,
        targetName: `Review ${id}`,
        details: `Review approved status set to ${updated.isApproved}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Review ${updated.isApproved ? 'approved' : 'hidden'} successfully`,
      review: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    await db.review.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        adminId: adminSession.userId,
        adminEmail: adminSession.email,
        action: 'REVIEW_DELETED',
        targetType: 'PRODUCT',
        targetId: existing.productId,
        targetName: `Review ${id}`,
        details: `Deleted review submitted by buyer ${existing.buyerId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
