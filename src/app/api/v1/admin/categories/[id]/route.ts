import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const category = await db.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category,
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

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { name, slug, description, imageUrl, isActive } = body;

    const updated = await db.category.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name) : undefined,
        slug: slug !== undefined ? String(slug) : undefined,
        description: description !== undefined ? String(description) : undefined,
        imageUrl: imageUrl !== undefined ? String(imageUrl) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      adminUser: {
        id: session.userId,
        email: session.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('already taken') ? 409 : error.message?.includes('not found') ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: statusCode }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    await db.category.delete({
      where: { id },
      adminUser: {
        id: session.userId,
        email: session.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const statusCode = error.message?.includes('Cannot delete category') ? 400 : error.message?.includes('not found') ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: statusCode }
    );
  }
}
