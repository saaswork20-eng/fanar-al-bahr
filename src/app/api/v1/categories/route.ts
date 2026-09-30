import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await db.category.findMany();
    const products = await db.product.findMany({
      where: {
        status: 'PUBLISHED',
        isActive: true,
      },
    });

    const categoryStats = categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      return {
        ...cat,
        productCount: catProducts.length,
      };
    });

    return NextResponse.json({
      success: true,
      categories: categoryStats,
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
