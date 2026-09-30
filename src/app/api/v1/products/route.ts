import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatPublicProduct } from '@/lib/product-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Search query
    const search = searchParams.get('q') || searchParams.get('search') || undefined;

    // Category filter: support categoryId or category slug
    const categoryParam = searchParams.get('category') || searchParams.get('categoryId') || undefined;
    let categoryId: string | undefined = undefined;
    let categorySlug: string | undefined = undefined;
    if (categoryParam && categoryParam !== 'all') {
      if (categoryParam.startsWith('cat_')) {
        categoryId = categoryParam;
      } else {
        categorySlug = categoryParam;
      }
    }

    // Platform filter: support platformId or platform slug
    const platformParam = searchParams.get('platform') || searchParams.get('platformId') || undefined;
    let platformId: string | undefined = undefined;
    let platformSlug: string | undefined = undefined;
    if (platformParam && platformParam !== 'all') {
      if (platformParam.startsWith('plat_')) {
        platformId = platformParam;
      } else {
        platformSlug = platformParam;
      }
    }

    // Brand filter
    const brandParam = searchParams.get('brand');
    const brand = brandParam && brandParam !== 'all' ? brandParam : undefined;

    // Price range filters
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

    // Availability filter
    const availability = searchParams.get('availability') || searchParams.get('stockStatus');
    let stockStatus: string | undefined = undefined;
    let inStockOnly: boolean | undefined = undefined;
    if (availability === 'in_stock') {
      inStockOnly = true;
    } else if (availability === 'out_of_stock') {
      stockStatus = 'out_of_stock';
    }

    // On sale filter
    const onSale = searchParams.get('onSale') === 'true';

    // Featured filter
    const isFeatured = searchParams.get('featured') === 'true' ? true : undefined;

    // Sorting
    const sortBy = searchParams.get('sort') || 'featured';
    let orderBy: {
      price?: 'asc' | 'desc';
      createdAt?: 'asc' | 'desc';
      title?: 'asc' | 'desc';
      discount?: 'asc' | 'desc';
      featured?: boolean;
    } = { featured: true };

    if (sortBy === 'price-asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price-desc') orderBy = { price: 'desc' };
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };
    else if (sortBy === 'name-asc') orderBy = { title: 'asc' };
    else if (sortBy === 'discount') orderBy = { discount: 'desc' };
    else if (sortBy === 'featured') orderBy = { featured: true };

    // Fetch all matching products from database
    const rawProducts = await db.product.findMany({
      where: {
        search,
        categoryId,
        categorySlug,
        platformId,
        platformSlug,
        brand,
        minPrice,
        maxPrice,
        stockStatus,
        inStock: inStockOnly,
        onSale: onSale || undefined,
        isFeatured,
        status: 'PUBLISHED',
        isActive: true, // Only active products
      },
      orderBy,
    });

    // Public catalog strictly requires PUBLISHED status & active
    const publishedProducts = rawProducts.filter(
      (p) => (!p.status || p.status === 'PUBLISHED') && p.isActive !== false
    );

    const total = publishedProducts.length;

    // Pagination
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 12;

    const startIndex = (page - 1) * limit;
    const paginatedItems = limitParam === '0' || limitParam === 'all'
      ? publishedProducts
      : publishedProducts.slice(startIndex, startIndex + limit);

    // Format and sanitize for public consumption
    const formattedProducts = paginatedItems.map(formatPublicProduct);

    // Fetch taxonomy for filter components
    const categories = await db.category.findMany();
    const platforms = await db.platform.findMany();
    const brands = await db.product.getBrands();

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      categories,
      platforms,
      brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: startIndex + limit < total,
        hasPrevPage: page > 1,
      },
      total,
    });
  } catch (error) {
    console.error('Storefront products error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
