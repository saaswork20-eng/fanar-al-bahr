import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { formatPublicProduct } from '@/lib/product-helper';
import {
  Layers,
  ArrowLeft,
  PackageX,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    sort?: string;
    q?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await db.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    return {
      title: 'Category Not Found — FANAR AL BHAR',
      description: 'The requested product category does not exist.',
    };
  }

  return {
    title: `${category.name} — FANAR AL BHAR Official Digital Store`,
    description:
      category.description ||
      `Browse authentic ${category.name} available for instant delivery from Fanar Al Bhar.`,
    openGraph: {
      title: `${category.name} — FANAR AL BHAR`,
      description: category.description || undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await db.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    notFound();
  }

  const sort = searchParams?.sort || 'featured';
  const query = searchParams?.q || '';

  let orderBy: any = { featured: true };
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  else if (sort === 'price-desc') orderBy = { price: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };
  else if (sort === 'name-asc') orderBy = { title: 'asc' };
  else if (sort === 'discount') orderBy = { discount: 'desc' };

  const rawProducts = await db.product.findMany({
    where: {
      categoryId: category.id,
      search: query || undefined,
      status: 'PUBLISHED',
      isActive: true,
    },
    orderBy,
  });

  const products = rawProducts
    .filter((p) => (!p.status || p.status === 'PUBLISHED') && p.isActive !== false)
    .map(formatPublicProduct);

  const allCategories = await db.category.findMany();

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-amber-400 transition-colors">
            Categories
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">{category.name}</span>
        </div>

        {/* Category Header Hero */}
        <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-slate-950 p-6 sm:p-10 mb-8 overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" /> Official Category Catalog
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              {category.description || 'Authentic single-vendor digital stock with direct delivery and publisher authorization.'}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                {products.length} {products.length === 1 ? 'Product Available' : 'Products Available'}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> 100% Genuine Guaranteed
              </span>
            </div>
          </div>
        </div>

        {/* Category Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          {/* Quick Category Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {allCategories.map((c) => {
              const isCurrent = c.id === category.id;
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>

          {/* Catalog Link */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href={`/shop?category=${category.slug}`}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced Filters
            </Link>
          </div>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-slate-950/40 border border-slate-800 rounded-3xl max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <PackageX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">No products in this category yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Fanar Al Bhar is currently preparing new stock for {category.name}. Check back shortly or explore our full store catalog.
            </p>
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
