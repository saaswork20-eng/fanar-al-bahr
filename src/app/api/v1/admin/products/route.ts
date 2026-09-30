import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/session';
import { db } from '@/lib/db';
import { encryptDigitalKey } from '@/lib/crypto-vault';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const platformId = searchParams.get('platformId') || undefined;
    const status = searchParams.get('status') || undefined; // 'all', 'DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'OUT_OF_STOCK'
    const stockStatus = searchParams.get('stockStatus') || undefined; // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    const sortBy = searchParams.get('sort') || searchParams.get('sortBy') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));

    let orderBy: { price?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc'; stock?: 'asc' | 'desc'; title?: 'asc' | 'desc' } = { createdAt: 'desc' };
    if (sortBy === 'price-asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price-desc') orderBy = { price: 'desc' };
    else if (sortBy === 'stock-asc') orderBy = { stock: 'asc' };
    else if (sortBy === 'stock-desc') orderBy = { stock: 'desc' };
    else if (sortBy === 'title-asc') orderBy = { title: 'asc' };
    else if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else orderBy = { createdAt: 'desc' };

    // Fetch all matching for total count
    const allMatching = await db.product.findMany({
      where: {
        search,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        platformId: platformId === 'all' ? undefined : platformId,
        status: status === 'all' ? undefined : status,
        stockStatus: stockStatus === 'all' ? undefined : stockStatus,
      },
      orderBy,
    });

    const total = allMatching.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedProducts = allMatching.slice(skip, skip + limit);

    const categories = await db.category.findMany();
    const platforms = await db.platform.findMany();

    const productsWithVault = await Promise.all(
      paginatedProducts.map(async (prod) => {
        const keyStats = await db.productKey.countStats(prod.id);
        return {
          ...prod,
          status: prod.status || (prod.isActive ? 'PUBLISHED' : 'UNPUBLISHED'),
          vaultStats: {
            availableKeys: keyStats.available,
            soldKeys: keyStats.sold,
            totalKeys: keyStats.total,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: productsWithVault,
      categories,
      platforms,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin products GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      title,
      slug,
      description,
      shortDescription,
      price,
      discountPrice,
      discountStartDate,
      discountEndDate,
      stockQuantity = 0,
      lowStockThreshold = 5,
      categoryId,
      platformId,
      coverImageUrl,
      bannerImageUrl,
      images,
      region = 'GLOBAL',
      sku,
      brand,
      developer,
      publisher,
      releaseYear,
      deliveryType = 'INSTANT_KEY',
      status = 'PUBLISHED',
      isFeatured = false,
      specifications,
      weight,
      dimensions,
      keys,
    } = body;

    // 1. Validation: Title
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Product name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    // 2. Validation: Price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be a valid non-negative number.' },
        { status: 400 }
      );
    }

    // 3. Validation: Discount Price
    let numericDiscount: number | null = null;
    if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
      numericDiscount = Number(discountPrice);
      if (isNaN(numericDiscount) || numericDiscount < 0) {
        return NextResponse.json(
          { success: false, error: 'Discount price cannot be negative.' },
          { status: 400 }
        );
      }
      if (numericDiscount > numericPrice) {
        return NextResponse.json(
          { success: false, error: 'Discount price cannot be greater than regular price.' },
          { status: 400 }
        );
      }
    }

    // 4. Validation: Stock Quantity
    const numericStock = Number(stockQuantity);
    if (isNaN(numericStock) || numericStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock quantity cannot be negative.' },
        { status: 400 }
      );
    }

    // 5. Validation: Low stock threshold
    const numericThreshold = Number(lowStockThreshold);
    if (isNaN(numericThreshold) || numericThreshold < 0) {
      return NextResponse.json(
        { success: false, error: 'Low-stock threshold cannot be negative.' },
        { status: 400 }
      );
    }

    // 6. Validation: Category
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Category selection is required.' }, { status: 400 });
    }
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Selected category does not exist.' }, { status: 400 });
    }

    // 7. Slug handling & validation
    const candidateSlug = (slug?.trim() || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!candidateSlug || candidateSlug.length < 2) {
      return NextResponse.json(
        { success: false, error: 'A valid URL slug is required.' },
        { status: 400 }
      );
    }

    const existingSlug = await db.product.findUnique({ where: { slug: candidateSlug } });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `A product with slug "${candidateSlug}" already exists.` },
        { status: 409 }
      );
    }

    // 8. SKU validation
    const formattedSku = sku?.trim() || `FAB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const existingSku = await db.product.findUnique({ where: { sku: formattedSku } });
    if (existingSku) {
      return NextResponse.json(
        { success: false, error: `A product with SKU "${formattedSku}" already exists.` },
        { status: 409 }
      );
    }

    // 9. Status & Images
    const validStatuses = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'OUT_OF_STOCK'];
    const productStatus = validStatuses.includes(status) ? status : 'PUBLISHED';
    const isActive = productStatus === 'PUBLISHED';

    const productImages = Array.isArray(images) && images.length > 0
      ? images
      : coverImageUrl ? [coverImageUrl] : ['/assets/placeholders/game-placeholder.jpg'];

    const mainCover = coverImageUrl?.trim() || productImages[0];

    // Digital keys batch
    let effectiveStock = numericStock;
    const validRawKeys: string[] = [];
    if (Array.isArray(keys) && keys.length > 0) {
      for (const k of keys) {
        if (typeof k === 'string' && k.trim().length > 0) {
          validRawKeys.push(k.trim());
        }
      }
      if (validRawKeys.length > 0 && effectiveStock === 0) {
        effectiveStock = validRawKeys.length;
      }
    }

    // 10. Create Product in DB
    const newProduct = await db.product.create({
      data: {
        title: title.trim(),
        slug: candidateSlug,
        sku: formattedSku,
        description: description?.trim() || '',
        shortDescription: shortDescription?.trim() || null,
        price: numericPrice,
        discountPrice: numericDiscount,
        discountStartDate: discountStartDate ? new Date(discountStartDate).toISOString() : null,
        discountEndDate: discountEndDate ? new Date(discountEndDate).toISOString() : null,
        stockQuantity: effectiveStock,
        lowStockThreshold: numericThreshold,
        categoryId,
        platformId: platformId || null,
        coverImageUrl: mainCover,
        bannerImageUrl: bannerImageUrl?.trim() || null,
        images: productImages,
        region,
        deliveryType: deliveryType || 'INSTANT_KEY',
        status: productStatus as any,
        isActive,
        isFeatured: Boolean(isFeatured),
        brand: brand?.trim() || null,
        developer: developer?.trim() || null,
        publisher: publisher?.trim() || null,
        releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
        specifications: specifications ? (typeof specifications === 'string' ? specifications : JSON.stringify(specifications)) : null,
        weight: weight?.trim() || null,
        dimensions: dimensions?.trim() || null,
      },
    });

    // 11. Ingest digital keys if provided
    if (validRawKeys.length > 0) {
      const encryptedKeys = validRawKeys.map((rawKey) => {
        const encrypted = encryptDigitalKey(rawKey);
        return {
          productId: newProduct.id,
          cipherText: encrypted.cipherText,
          iv: encrypted.iv,
          tag: encrypted.tag,
        };
      });
      await db.productKey.createMany({ data: encryptedKeys });
    }

    // 12. Audit Log
    await db.auditLog.create({
      data: {
        adminId: admin.userId,
        adminEmail: admin.email,
        action: 'PRODUCT_CREATED',
        targetType: 'PRODUCT',
        targetId: newProduct.id,
        targetName: newProduct.title,
        details: `Created product at ₹${numericPrice}, SKU: ${formattedSku}, status: ${productStatus}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully in Fanar Al Bhar store catalog.',
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('Admin product create error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
