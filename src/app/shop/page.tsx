'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  ArrowUpDown,
  Search,
  PackageX,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import ProductFilters, { FilterState } from '@/components/storefront/ProductFilters';

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse query params into initial filter state
  const initialCategory = searchParams.get('category') || searchParams.get('categoryId') || 'all';
  const initialPlatform = searchParams.get('platform') || searchParams.get('platformId') || 'all';
  const initialBrand = searchParams.get('brand') || 'all';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialAvailability = searchParams.get('availability') || 'all';
  const initialOnSale = searchParams.get('onSale') === 'true';
  const initialSort = searchParams.get('sort') || 'featured';
  const initialPage = parseInt(searchParams.get('page') || '1', 10) || 1;
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    platform: initialPlatform,
    brand: initialBrand,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    availability: initialAvailability,
    onSale: initialOnSale,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Sync state when URL params change
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search') || '';
    setSearchQuery(q);
    setFilters({
      category: searchParams.get('category') || searchParams.get('categoryId') || 'all',
      platform: searchParams.get('platform') || searchParams.get('platformId') || 'all',
      brand: searchParams.get('brand') || 'all',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      availability: searchParams.get('availability') || 'all',
      onSale: searchParams.get('onSale') === 'true',
    });
    setSort(searchParams.get('sort') || 'featured');
    setPage(parseInt(searchParams.get('page') || '1', 10) || 1);
  }, [searchParams]);

  // Fetch products from real API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.platform !== 'all') params.set('platform', filters.platform);
      if (filters.brand !== 'all') params.set('brand', filters.brand);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.availability !== 'all') params.set('availability', filters.availability);
      if (filters.onSale) params.set('onSale', 'true');
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await fetch(`/api/v1/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setPlatforms(data.platforms || []);
        setBrands(data.brands || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: data.products?.length || 0, totalPages: 1 });
      }
    } catch (e) {
      console.error('Failed to load shop catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, sort, page, searchQuery]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, sort, 1, searchQuery);
  };

  const handleResetFilters = () => {
    const defaultFilters: FilterState = {
      category: 'all',
      platform: 'all',
      brand: 'all',
      minPrice: '',
      maxPrice: '',
      availability: 'all',
      onSale: false,
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    setSort('featured');
    setPage(1);
    router.push('/shop');
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
    updateUrlParams(filters, newSort, 1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams(filters, sort, newPage, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateUrlParams = (
    f: FilterState,
    s: string,
    p: number,
    q: string
  ) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (f.category !== 'all') params.set('category', f.category);
    if (f.platform !== 'all') params.set('platform', f.platform);
    if (f.brand !== 'all') params.set('brand', f.brand);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.availability !== 'all') params.set('availability', f.availability);
    if (f.onSale) params.set('onSale', 'true');
    if (s && s !== 'featured') params.set('sort', s);
    if (p > 1) params.set('page', String(p));

    const queryString = params.toString();
    router.push(`/shop${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Breadcrumbs & Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/" className="hover:text-amber-400 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-200 font-medium">Shop All</span>
              {searchQuery && (
                <>
                  <span>/</span>
                  <span className="text-amber-400">Search: &ldquo;{searchQuery}&rdquo;</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Product Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Authentic single-vendor digital game keys, licenses, and cards. Direct from Fanar Al Bhar.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" /> Sort By:
            </span>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
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

        {/* Catalog Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            categories={categories}
            platforms={platforms}
            brands={brands}
            totalResults={pagination.total}
          />

          {/* Products Grid Area */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="aspect-[16/10] bg-slate-800/60 rounded-xl" />
                    <div className="space-y-2 mt-4">
                      <div className="h-4 bg-slate-800/80 rounded w-3/4" />
                      <div className="h-3 bg-slate-800/40 rounded w-1/2" />
                    </div>
                    <div className="h-8 bg-slate-800/60 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-6">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === page;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-20 px-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
                  <PackageX className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">No products found</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
                  We couldn&apos;t find any published products matching your selected search or filter criteria.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-amber-400">
          Loading catalog...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
