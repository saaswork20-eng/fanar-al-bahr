import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateAddressSchema = z.object({
  fullName: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(7).max(25).trim().optional(),
  addressLine: z.string().min(5).max(200).trim().optional(),
  city: z.string().min(2).max(100).trim().optional(),
  state: z.string().min(2).max(100).trim().optional(),
  postalCode: z.string().min(3).max(20).trim().optional(),
  country: z.string().min(2).max(100).trim().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const address = await db.address.findUnique({
      where: { id, userId: session.userId },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      address,
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
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    // Check ownership
    const existing = await db.address.findUnique({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Address not found or access denied' },
        { status: 404 }
      );
    }

    const validated = updateAddressSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updated = await db.address.update({
      where: { id, userId: session.userId },
      data: validated.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      address: updated,
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

    const existing = await db.address.findUnique({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Address not found or access denied' },
        { status: 404 }
      );
    }

    await db.address.delete({
      where: { id, userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.action === 'SET_DEFAULT' || !body.action) {
      const address = await db.address.setDefault({
        where: { id, userId: session.userId },
      });

      return NextResponse.json({
        success: true,
        message: 'Default address updated successfully',
        address,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
