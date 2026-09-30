'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  PlusCircle,
  Search,
  RefreshCw,
  Edit3,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Eye,
  KeyRound,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Star,
  Check,
  X,
  Layers,
  Sparkles,
  Copy,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  platformName?: string;
  region: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  sku?: string | null;
  deliveryType: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'OUT_OF_STOCK';
  isActive: boolean;
  isFeatured?: boolean;
  coverImageUrl: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  vaultStats?: {
    availableKeys: number;
    soldKeys: number;
    totalKeys: number;
  };
}

interface CategoryOption {
  id: string;
  name: string;
}

function AdminProductsContent() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Modals & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stockModalProduct, setStockModalProduct] = useState<ProductItem | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  const [deleteModalProduct, setDeleteModalProduct] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortBy,
      });

      if (search.trim()) params.set('q', search.trim());
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (stockFilter !== 'all') params.set('stockStatus', stockFilter);

      const res = await fetch(`/api/v1/admin/products?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.categories) setCategories(data.categories);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        }
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to load products.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Network error connecting to API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, statusFilter, stockFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setStockFilter('all');
    setSortBy('newest');
    setPage(1);
  };

  // Quick Toggle Publish / Unpublish
  const handleTogglePublish = async (prod: ProductItem) => {
    const newStatus = prod.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/v1/admin/products/${prod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Product "${prod.title}" is now ${newStatus}.`,
        });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === prod.id ? { ...p, status: newStatus, isActive: newStatus === 'PUBLISHED' } : p
          )
        );
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update publication status.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error.' });
    }
  };

  // Quick Duplicate Product
  const handleDuplicateProduct = async (prod: ProductItem) => {
    try {
      const res = await fetch(`/api/v1/admin/products/${prod.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Product duplicated successfully as "${data.product.title}".` });
        fetchProducts();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to duplicate product.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error.' });
    }
  };

  // Quick Stock Adjustment
  const handleSaveStock = async () => {
    if (!stockModalProduct) return;
    setSavingStock(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${stockModalProduct.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStockValue }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === stockModalProduct.id
              ? {
                  ...p,
                  stockQuantity: newStockValue,
                  status: newStockValue === 0 && p.status === 'PUBLISHED' ? 'OUT_OF_STOCK' : p.status,
                }
              : p
          )
        );
        setStockModalProduct(null);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update stock.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error.' });
    } finally {
      setSavingStock(false);
    }
  };

  // Safe Deactivate / Archive
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${deleteModalProduct.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        if (data.deleted) {
          setProducts((prev) => prev.filter((p) => p.id !== deleteModalProduct.id));
        } else {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === deleteModalProduct.id
                ? { ...p, isActive: false, status: 'UNPUBLISHED' }
                : p
            )
          );
        }
        setDeleteModalProduct(null);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to deactivate product.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <span>Catalog Inventory & Product Management</span>
            </h1>
            <p className="text-[11px] text-slate-400">Fanar Al Bhar official single-vendor store catalog</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/products/new"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 space-y-6 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-[#0f131c] border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, SKU, brand, slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </form>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs w-full md:w-auto">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="UNPUBLISHED">Unpublished</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                {/* Stock Filter */}
                <select
                  value={stockFilter}
                  onChange={(e) => {
                    setStockFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in_stock">In Stock (&gt; Low)</option>
                  <option value="low_stock">Low Stock (≤ Threshold)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-asc">Stock: Low to High</option>
                  <option value="stock-desc">Stock: High to Low</option>
                  <option value="title-asc">Name: A to Z</option>
                </select>

                {(search || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all') && (
                  <button
                    onClick={resetFilters}
                    className="px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Products Table Card */}
          <div className="bg-[#0f131c] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span>Products Directory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {totalCount} total item(s)
                </span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Page {page} of {totalPages}
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-400" />
                <p>Querying real database catalog...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500 space-y-3">
                <Package className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-slate-300 font-semibold text-sm">No products found.</p>
                <p className="max-w-md mx-auto text-slate-400">
                  There are no products matching your current search and filter criteria. You can reset filters or add a new product.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                  <Link
                    href="/admin/products/new"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Add First Product
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Product</th>
                      <th className="py-3 px-4 font-semibold">SKU / Slug</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Price &amp; Sale</th>
                      <th className="py-3 px-4 font-semibold">Stock &amp; Vault</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Dates</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map((p) => {
                      const isLowStock = p.stockQuantity <= (p.lowStockThreshold ?? 5) && p.stockQuantity > 0;
                      const isOutOfStock = p.stockQuantity <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 relative">
                                <img
                                  src={p.coverImageUrl || '/assets/placeholders/game-placeholder.jpg'}
                                  alt={p.title}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as any).src =
                                      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=100&q=60';
                                  }}
                                />
                                {p.isFeatured && (
                                  <div className="absolute top-0.5 right-0.5 bg-amber-500 rounded p-0.5 text-black">
                                    <Star className="w-2.5 h-2.5 fill-black" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <Link
                                  href={`/admin/products/${p.id}`}
                                  className="font-bold text-white hover:text-indigo-400 truncate block text-xs"
                                  title={p.title}
                                >
                                  {p.title}
                                </Link>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {p.platformName || 'PC / Digital'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* SKU & Slug */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-indigo-300 block font-semibold">
                              {p.sku || 'NO-SKU'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 truncate block max-w-[130px]">
                              /{p.slug}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 inline-block">
                              {p.categoryName || 'General'}
                            </span>
                          </td>

                          {/* Pricing */}
                          <td className="py-3 px-4">
                            <div className="font-mono">
                              <span className="font-bold text-white text-xs block">
                                {formatINR(p.price)}
                              </span>
                              {p.discountPrice ? (
                                <span className="text-[10px] text-emerald-400 font-semibold block">
                                  Sale: {formatINR(p.discountPrice)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-600 block">No discount</span>
                              )}
                            </div>
                          </td>

                          {/* Stock & Keys */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <button
                                onClick={() => {
                                  setStockModalProduct(p);
                                  setNewStockValue(p.stockQuantity);
                                }}
                                className="group inline-flex items-center gap-1.5"
                                title="Click to adjust stock"
                              >
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                    isOutOfStock
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                      : isLowStock
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  }`}
                                >
                                  {p.stockQuantity} in stock
                                </span>
                                <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" />
                              </button>

                              {p.vaultStats && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                  <KeyRound className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>{p.vaultStats.availableKeys} keys</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  p.status === 'PUBLISHED'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : p.status === 'DRAFT'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : p.status === 'OUT_OF_STOCK'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {p.status || (p.isActive ? 'PUBLISHED' : 'UNPUBLISHED')}
                              </span>
                            </div>
                          </td>

                          {/* Dates */}
                          <td className="py-3 px-4 text-[10px] text-slate-400 space-y-0.5">
                            <div>
                              <span className="text-slate-500">Created:</span>{' '}
                              {new Date(p.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-slate-500">Updated:</span>{' '}
                              {new Date(p.updatedAt).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* View */}
                              <Link
                                href={`/admin/products/${p.id}`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                                title="View Product Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>

                              {/* Edit */}
                              <Link
                                href={`/admin/products/${p.id}/edit`}
                                className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 transition-colors"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Link>

                              {/* Duplicate */}
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 transition-colors"
                                title="Duplicate Product"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Publish */}
                              <button
                                onClick={() => handleTogglePublish(p)}
                                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                  p.status === 'PUBLISHED'
                                    ? 'bg-amber-950/40 hover:bg-amber-900 border-amber-800 text-amber-300'
                                    : 'bg-emerald-950/40 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                                }`}
                                title={p.status === 'PUBLISHED' ? 'Unpublish from store' : 'Publish to store'}
                              >
                                {p.status === 'PUBLISHED' ? (
                                  <PowerOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Deactivate/Delete */}
                              <button
                                onClick={() => setDeleteModalProduct(p)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors"
                                title="Safe Archive / Deactivate"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-950/40">
                <span className="text-slate-400 font-mono text-[11px]">
                  Showing page {page} of {totalPages} ({totalCount} products)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                        page === i + 1
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Stock Adjustment Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <span>Adjust Stock Quantity</span>
            </h3>
            <p className="text-xs text-slate-400">
              Update direct store inventory for <strong className="text-white">{stockModalProduct.title}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Inventory Units Available</label>
              <input
                type="number"
                min="0"
                value={newStockValue}
                onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Values &le; {stockModalProduct.lowStockThreshold ?? 5} will trigger low-stock alerts.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStockModalProduct(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                disabled={savingStock}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {savingStock ? 'Saving...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate / Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Deactivate / Archive Product</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-white">{deleteModalProduct.title}</strong>?
              <br />
              <span className="text-slate-400 text-[11px] block mt-1">
                The product will immediately be hidden from the customer storefront. Historical customer orders and fulfillment logs referencing this product remain intact.
              </span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalProduct(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {deleting ? 'Processing...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading catalog management...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
