import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { maskDigitalKey } from '@/lib/crypto-vault';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: { keys: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    const keyStats = await db.productKey.countStats(product.id);
    const maskedKeys = (product.keys || []).slice(0, 20).map((k) => ({
      id: k.id,
      status: k.status,
      maskedPreview: maskDigitalKey(k.cipherText),
      isRevealed: k.isRevealed,
      createdAt: k.createdAt,
    }));

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        status: product.status || (product.isActive ? 'PUBLISHED' : 'UNPUBLISHED'),
        vaultStats: {
          availableKeys: keyStats.available,
          soldKeys: keyStats.sold,
          totalKeys: keyStats.total,
        },
        maskedKeys,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin product detail error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found to update.' }, { status: 404 });
    }

    const updates: any = {};

    // 1. Title
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 2) {
        return NextResponse.json({ success: false, error: 'Product title must be at least 2 characters.' }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    // 2. Slug validation
    if (body.slug !== undefined && body.slug.trim()) {
      const candidateSlug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      if (candidateSlug !== existingProduct.slug) {
        const conflict = await db.product.findUnique({ where: { slug: candidateSlug } });
        if (conflict && conflict.id !== params.id) {
          return NextResponse.json(
            { success: false, error: `A product with slug "${candidateSlug}" already exists.` },
            { status: 409 }
          );
        }
        updates.slug = candidateSlug;
      }
    }

    // 3. SKU validation
    if (body.sku !== undefined && body.sku.trim()) {
      const candidateSku = body.sku.trim();
      if (candidateSku !== existingProduct.sku) {
        const conflict = await db.product.findUnique({ where: { sku: candidateSku } });
        if (conflict && conflict.id !== params.id) {
          return NextResponse.json(
            { success: false, error: `A product with SKU "${candidateSku}" already exists.` },
            { status: 409 }
          );
        }
        updates.sku = candidateSku;
      }
    }

    // 4. Pricing validation
    let targetPrice = existingProduct.price;
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ success: false, error: 'Price cannot be negative.' }, { status: 400 });
      }
      updates.price = p;
      targetPrice = p;
    }

    if (body.discountPrice !== undefined) {
      if (body.discountPrice === null || body.discountPrice === '') {
        updates.discountPrice = null;
      } else {
        const dp = Number(body.discountPrice);
        if (isNaN(dp) || dp < 0) {
          return NextResponse.json({ success: false, error: 'Discount price cannot be negative.' }, { status: 400 });
        }
        if (dp > targetPrice) {
          return NextResponse.json(
            { success: false, error: 'Discount price cannot be greater than regular price.' },
            { status: 400 }
          );
        }
        updates.discountPrice = dp;
      }
    }

    // 5. Stock validation
    if (body.stockQuantity !== undefined) {
      const s = Number(body.stockQuantity);
      if (isNaN(s) || s < 0) {
        return NextResponse.json({ success: false, error: 'Stock quantity cannot be negative.' }, { status: 400 });
      }
      updates.stockQuantity = s;
    }

    // 6. Low stock threshold
    if (body.lowStockThreshold !== undefined) {
      const lst = Number(body.lowStockThreshold);
      if (isNaN(lst) || lst < 0) {
        return NextResponse.json({ success: false, error: 'Low-stock threshold cannot be negative.' }, { status: 400 });
      }
      updates.lowStockThreshold = lst;
    }

    // 7. Status & Active synchronization
    if (body.status !== undefined) {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'OUT_OF_STOCK'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid product status.' }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === 'PUBLISHED') {
        updates.isActive = true;
      } else if (body.status === 'DRAFT' || body.status === 'UNPUBLISHED') {
        updates.isActive = false;
      }
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
      if (!updates.isActive && (!updates.status || updates.status === 'PUBLISHED')) {
        updates.status = 'UNPUBLISHED';
      } else if (updates.isActive && updates.status === 'UNPUBLISHED') {
        updates.status = 'PUBLISHED';
      }
    }

    // 8. Other metadata
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription?.trim() || null;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.platformId !== undefined) updates.platformId = body.platformId || null;
    if (body.coverImageUrl !== undefined) updates.coverImageUrl = body.coverImageUrl;
    if (body.bannerImageUrl !== undefined) updates.bannerImageUrl = body.bannerImageUrl || null;
    if (body.images !== undefined && Array.isArray(body.images)) updates.images = body.images;
    if (body.region !== undefined) updates.region = body.region;
    if (body.deliveryType !== undefined) updates.deliveryType = body.deliveryType;
    if (body.isFeatured !== undefined) updates.isFeatured = Boolean(body.isFeatured);
    if (body.brand !== undefined) updates.brand = body.brand?.trim() || null;
    if (body.developer !== undefined) updates.developer = body.developer?.trim() || null;
    if (body.publisher !== undefined) updates.publisher = body.publisher?.trim() || null;
    if (body.discountStartDate !== undefined) updates.discountStartDate = body.discountStartDate;
    if (body.discountEndDate !== undefined) updates.discountEndDate = body.discountEndDate;
    if (body.specifications !== undefined) {
      updates.specifications = typeof body.specifications === 'string' ? body.specifications : JSON.stringify(body.specifications);
    }
    if (body.weight !== undefined) updates.weight = body.weight?.trim() || null;
    if (body.dimensions !== undefined) updates.dimensions = body.dimensions?.trim() || null;

    const updated = await db.product.update({
      where: { id: params.id },
      data: updates,
    });

    // Audit log
    await db.auditLog.create({
      data: {
        adminId: admin.userId,
        adminEmail: admin.email,
        action: 'PRODUCT_UPDATED',
        targetType: 'PRODUCT',
        targetId: updated.id,
        targetName: updated.title,
        details: `Updated product fields: ${Object.keys(updates).join(', ')}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin product PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    // Check if product is referenced in any existing orders
    const allOrders = await db.order.findMany();
    const hasOrderHistory = allOrders.some((order) =>
      (order.items || []).some((item) => item.productId === params.id)
    );

    const { searchParams } = new URL(req.url);
    const forcePermanent = searchParams.get('permanent') === 'true';

    if (hasOrderHistory || !forcePermanent) {
      // Safe Deactivation: marks inactive & unpublished to preserve order history
      const deactivated = await db.product.update({
        where: { id: params.id },
        data: { isActive: false, status: 'UNPUBLISHED' },
      });

      await db.auditLog.create({
        data: {
          adminId: admin.userId,
          adminEmail: admin.email,
          action: 'PRODUCT_DEACTIVATED',
          targetType: 'PRODUCT',
          targetId: product.id,
          targetName: product.title,
          details: hasOrderHistory
            ? 'Product deactivated (order history preserved).'
            : 'Product archived and removed from storefront catalog.',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Product "${product.title}" safely deactivated.`,
        deactivated: true,
        product: deactivated,
      });
    } else {
      // Safe permanent delete when no order history exists and permanent=true
      const removed = await db.product.delete({
        where: { id: params.id },
      });

      await db.auditLog.create({
        data: {
          adminId: admin.userId,
          adminEmail: admin.email,
          action: 'PRODUCT_DELETED',
          targetType: 'PRODUCT',
          targetId: product.id,
          targetName: product.title,
          details: 'Product permanently purged from catalog (zero order history).',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Product "${product.title}" permanently deleted.`,
        deleted: true,
        product: removed,
      });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin product DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
