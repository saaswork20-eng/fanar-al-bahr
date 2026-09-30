import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import {
  Gamepad2,
  Cpu,
  CreditCard,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories — FANAR AL BHAR Official Digital Store',
  description:
    'Explore our curated digital catalog: PC & console video games, operating systems, software licenses, and digital gift cards.',
};

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await db.category.findMany();
  const allProducts = await db.product.findMany({
    where: {
      status: 'PUBLISHED',
      isActive: true,
    },
  });

  // Calculate product counts per category
  const categoriesWithStats = categories.map((cat) => {
    const productsInCat = allProducts.filter((p) => p.categoryId === cat.id);
    return {
      ...cat,
      count: productsInCat.length,
      sampleProducts: productsInCat.slice(0, 3),
    };
  });

  const getCategoryIcon = (slug: string) => {
    if (slug.includes('game')) return Gamepad2;
    if (slug.includes('software')) return Cpu;
    return CreditCard;
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Banner */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" /> Department Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Browse Product Categories
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Explore authentic digital software, game keys, and gift cards with instant automated vault dispatch.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categoriesWithStats.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            return (
              <div
                key={category.id}
                className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-amber-500/40 transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

                <div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      {category.name}
                    </h2>
                    <span className="text-xs bg-slate-800/90 text-slate-300 px-2.5 py-1 rounded-full font-mono border border-slate-700/50">
                      {category.count} {category.count === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {category.description || 'Authentic single-vendor digital products available for immediate activation.'}
                  </p>

                  {/* Sample previews */}
                  {category.sampleProducts.length > 0 && (
                    <div className="space-y-2 mb-6 border-t border-slate-800/60 pt-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Featured in this Category
                      </span>
                      <div className="space-y-1.5">
                        {category.sampleProducts.map((sp) => (
                          <div
                            key={sp.id}
                            className="flex items-center gap-2 text-xs text-slate-300 truncate"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="truncate">{sp.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={`/category/${category.slug}`}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-amber-500/10"
                >
                  Explore {category.name} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Store Quality Assurance */}
        <div className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/60 via-slate-900/30 to-slate-900/60 p-8 text-center max-w-4xl mx-auto">
          <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            Single-Vendor Authenticity Guarantee
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Unlike peer-to-peer marketplaces where key origins are unverifiable, every single digital key in Fanar Al Bhar&apos;s catalog is acquired directly through official publisher distribution channels.
          </p>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
