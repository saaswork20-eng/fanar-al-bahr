import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { z } from 'zod';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).trim(),
  phone: z.string().min(7, 'Phone number is required').max(25).trim(),
  addressLine: z.string().min(5, 'Address line is required').max(200).trim(),
  city: z.string().min(2, 'City is required').max(100).trim(),
  state: z.string().min(2, 'State is required').max(100).trim(),
  postalCode: z.string().min(3, 'Postal code is required').max(20).trim(),
  country: z.string().min(2, 'Country is required').max(100).trim(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();

    const addresses = await db.address.findMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const validated = addressSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const newAddress = await db.address.create({
      data: {
        userId: session.userId,
        fullName: validated.data.fullName,
        phone: validated.data.phone,
        addressLine: validated.data.addressLine,
        city: validated.data.city,
        state: validated.data.state,
        postalCode: validated.data.postalCode,
        country: validated.data.country,
        isDefault: validated.data.isDefault,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Address added successfully',
        address: newAddress,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
