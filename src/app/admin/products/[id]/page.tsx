'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  Edit3,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Calendar,
  Layers,
  Star,
  Check,
  Globe,
  Tag,
  Share2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  discountPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId: string;
  categoryName?: string;
  platformId?: string | null;
  platformName?: string;
  region: string;
  deliveryType: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'OUT_OF_STOCK';
  isActive: boolean;
  isFeatured?: boolean;
  coverImageUrl: string;
  images?: string[];
  sku?: string | null;
  brand?: string | null;
  developer?: string | null;
  publisher?: string | null;
  releaseYear?: number;
  specifications?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  createdAt: string;
  updatedAt: string;
  vaultStats?: {
    availableKeys: number;
    soldKeys: number;
    totalKeys: number;
  };
  maskedKeys?: Array<{
    id: string;
    status: string;
    maskedPreview: string;
    isRevealed: boolean;
    createdAt: string;
  }>;
}

export default function AdminProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/products/${id}`);
      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
        setActiveImage(data.product.coverImageUrl || data.product.images?.[0] || '');
      } else {
        setFeedback({ type: 'error', message: data.error || 'Product not found.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error connecting to API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleTogglePublish = async () => {
    if (!product) return;
    const newStatus = product.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Status updated to ${newStatus}.` });
        fetchProduct();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update status.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error.' });
    }
  };

  let parsedSpecs: Record<string, string> = {};
  if (product?.specifications) {
    try {
      parsedSpecs = JSON.parse(product.specifications);
    } catch {
      parsedSpecs = {};
    }
  }

  const isLowStock = product && product.stockQuantity <= (product.lowStockThreshold ?? 5) && product.stockQuantity > 0;
  const isOutOfStock = product && product.stockQuantity <= 0;

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide truncate max-w-md">
                {product?.title || 'Product Details'}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">SKU: {product?.sku || 'None'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProduct}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href={`/admin/products/${id}/edit`}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </Link>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 flex-1 max-w-6xl">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-400" />
              <p>Loading product details...</p>
            </div>
          ) : !product ? (
            <div className="py-20 text-center text-xs text-slate-500">Product not found.</div>
          ) : (
            <div className="space-y-6">
              {/* Top Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Images Column */}
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-64 flex items-center justify-center relative">
                    <img
                      src={activeImage || product.coverImageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {product.isFeatured && (
                      <span className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Star className="w-3 h-3 fill-black" />
                        FEATURED
                      </span>
                    )}
                  </div>

                  {/* Thumbnail gallery */}
                  {product.images && product.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(img)}
                          className={`h-14 w-14 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                            activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800'
                          }`}
                        >
                          <img src={img} alt="thumbnail" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2 bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {product.categoryName || 'General'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {product.platformName || 'PC'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            product.status === 'PUBLISHED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : product.status === 'DRAFT'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {product.status}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white mt-1.5">{product.title}</h2>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">/{product.slug}</p>
                    </div>

                    <button
                      onClick={handleTogglePublish}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        product.status === 'PUBLISHED'
                          ? 'bg-amber-950/40 hover:bg-amber-900 border-amber-800 text-amber-200'
                          : 'bg-emerald-950/40 hover:bg-emerald-900 border-emerald-800 text-emerald-200'
                      }`}
                    >
                      {product.status === 'PUBLISHED' ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>Unpublish Product</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Publish to Store</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pricing & Inventory Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Regular Price</span>
                      <span className="text-base font-bold text-white font-mono block">
                        {formatINR(product.price)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Sale Price</span>
                      <span className="text-base font-bold text-emerald-400 font-mono block">
                        {product.discountPrice ? formatINR(product.discountPrice) : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Inventory Stock</span>
                      <span
                        className={`text-base font-bold font-mono block ${
                          isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {product.stockQuantity} units
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Encrypted Keys</span>
                      <span className="text-base font-bold text-indigo-400 font-mono block">
                        {product.vaultStats?.availableKeys || 0} in vault
                      </span>
                    </div>
                  </div>

                  {/* Short Summary & Description */}
                  {product.shortDescription && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
                      <strong>Highlight:</strong> {product.shortDescription}
                    </div>
                  )}

                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    {product.description || 'No description provided.'}
                  </div>
                </div>
              </div>

              {/* Specifications & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specifications Card */}
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Technical Specifications &amp; Attributes</span>
                  </h3>

                  {Object.keys(parsedSpecs).length > 0 ? (
                    <div className="divide-y divide-slate-800/60 text-xs">
                      {Object.entries(parsedSpecs).map(([k, v]) => (
                        <div key={k} className="py-2 flex items-center justify-between">
                          <span className="text-slate-400 font-medium">{k}</span>
                          <span className="text-white font-semibold font-mono">{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-3">No specific attributes specified.</p>
                  )}

                  {(product.weight || product.dimensions) && (
                    <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                      {product.weight && (
                        <div className="p-2.5 bg-slate-950 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Weight</span>
                          <span className="font-semibold text-white">{product.weight}</span>
                        </div>
                      )}
                      {product.dimensions && (
                        <div className="p-2.5 bg-slate-950 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Dimensions</span>
                          <span className="font-semibold text-white">{product.dimensions}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit & Logistics Card */}
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Catalog Record Timestamps</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Created In Database</span>
                      <span className="font-mono text-white">
                        {new Date(product.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Last Modified</span>
                      <span className="font-mono text-white">
                        {new Date(product.updatedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Low-Stock Alert Trigger</span>
                      <span className="font-mono text-amber-300">
                        &le; {product.lowStockThreshold ?? 5} units
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-400">Delivery Method</span>
                      <span className="font-mono text-cyan-300">{product.deliveryType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
