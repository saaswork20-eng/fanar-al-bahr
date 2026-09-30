import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatPublicProduct } from '@/lib/product-helper';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { slug: params.slug },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or currently unavailable.' },
        { status: 404 }
      );
    }

    const isPublished =
      (!product.status || product.status === 'PUBLISHED') && product.isActive;

    if (!isPublished) {
      return NextResponse.json(
        { success: false, error: 'Product not found or currently unavailable.' },
        { status: 404 }
      );
    }

    // Format public product without revealing keys or internal state
    const publicProduct = formatPublicProduct(product);

    // Fetch related products in the same category
    const rawRelated = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        status: 'PUBLISHED',
        isActive: true,
      },
      take: 5,
    });

    const relatedProducts = rawRelated
      .filter((p) => p.id !== product.id && (!p.status || p.status === 'PUBLISHED') && p.isActive)
      .slice(0, 4)
      .map(formatPublicProduct);

    return NextResponse.json({
      success: true,
      product: publicProduct,
      relatedProducts,
    });
  } catch (error) {
    console.error('Storefront product slug error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
