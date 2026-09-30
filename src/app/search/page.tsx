'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  PackageX,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'featured';

  const [inputVal, setInputVal] = useState(query);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInputVal(query);
  }, [query]);

  useEffect(() => {
    async function executeSearch() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (sort) params.set('sort', sort);

        const res = await fetch(`/api/v1/products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [query, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(inputVal.trim())}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (newSort) params.set('sort', newSort);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Catalog Search
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Search by title, publisher brand, SKU, platform, or product features.
            </p>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search games, software, licenses, or gift cards..."
                className="w-full bg-slate-950 text-sm text-slate-100 placeholder-slate-400 pl-12 pr-28 py-3.5 rounded-2xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-xl"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {query ? (
                <>
                  Results for &ldquo;<span className="text-amber-400">{query}</span>&rdquo;
                </>
              ) : (
                'All Published Products'
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Found {products.length} matching {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Full Filters
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Releases</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : products.length > 0 ? (
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
            <h3 className="text-lg font-bold text-slate-100">No products found for your search</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
              We couldn&apos;t find any matching products for &ldquo;{query}&rdquo;. Check your spelling or browse our catalog categories.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/shop"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
              >
                Browse All Products
              </Link>
              <Link
                href="/categories"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-amber-400">
          Loading search...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
