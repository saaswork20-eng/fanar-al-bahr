import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const categories = await db.category.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
        search,
      },
    });

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { name, slug, description, imageUrl, isActive } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name,
        slug: slug ? String(slug) : undefined,
        description: description ? String(description) : undefined,
        imageUrl: imageUrl ? String(imageUrl) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      adminUser: {
        id: session.userId,
        email: session.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('already exists') ? 409 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: statusCode }
    );
  }
}
