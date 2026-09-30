import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';
import { z } from 'zod';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(3).max(1000).trim().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    // Authorization: author or admin
    const isAdmin = session.role === Role.ADMIN;
    if (existing.buyerId !== session.userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to modify this review' },
        { status: 403 }
      );
    }

    const validated = updateReviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updated = await db.review.update({
      where: { id, buyerId: isAdmin ? undefined : session.userId },
      data: validated.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
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
    const session = await requireAuth();
    const { id } = await params;

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const isAdmin = session.role === Role.ADMIN;
    if (existing.buyerId !== session.userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this review' },
        { status: 403 }
      );
    }

    await db.review.delete({
      where: { id, buyerId: isAdmin ? undefined : session.userId },
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
