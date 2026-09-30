'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Lock,
  Heart,
  ShoppingBag,
  Check,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Layers,
  Award,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import ProductCard from './ProductCard';
import ProductReviews from './ProductReviews';

interface PublicProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  coverImageUrl: string;
  bannerImageUrl?: string | null;
  images?: string[];
  categoryId: string;
  categoryName?: string;
  platformId?: string | null;
  platformName?: string;
  region: string;
  price: number;
  discountPrice?: number | null;
  regularPrice: number;
  salePrice: number | null;
  currentPrice: number;
  discountPercent: number;
  isOnSale: boolean;
  isSaleActive: boolean;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  inStock: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  stockLabel: string;
  sku?: string | null;
  deliveryType: string;
  brand?: string | null;
  developer?: string | null;
  publisher?: string | null;
  releaseYear?: number | null;
  specifications?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductDetailsClientProps {
  product: PublicProduct;
  relatedProducts: any[];
}

export default function ProductDetailsClient({
  product,
  relatedProducts,
}: ProductDetailsClientProps) {
  // Gallery state
  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.coverImageUrl];
  const [selectedImage, setSelectedImage] = useState(allImages[0]);
  const [imgError, setImgError] = useState(false);

  // Quantity selector
  const [quantity, setQuantity] = useState(1);
  const maxStock = Math.max(0, product.stockQuantity);
  const isOutOfStock = maxStock <= 0;
  const isLowStock = !isOutOfStock && maxStock <= (product.lowStockThreshold ?? 5);

  // Cart & Wishlist state
  const [addedToCart, setAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    async function checkWishlist() {
      try {
        const res = await fetch(`/api/v1/account/wishlist/${product.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.inWishlist !== undefined) {
            setIsWishlisted(data.inWishlist);
          }
        }
      } catch {}
    }
    checkWishlist();
  }, [product.id]);

  const [copiedShare, setCopiedShare] = useState(false);

  const fallbackImage =
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const target = prev + delta;
      if (target < 1) return 1;
      if (target > maxStock) return maxStock;
      return target;
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      // 1. Authoritative server cart addition
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!res.ok && res.status === 401) {
        // Fallback for guest
        let cart = JSON.parse(localStorage.getItem('fanar_cart') || '[]');
        if (!Array.isArray(cart)) cart = [];

        const existingIndex = cart.findIndex((item: any) => item.id === product.id);
        if (existingIndex > -1) {
          cart[existingIndex].quantity = Math.min(
            maxStock,
            (cart[existingIndex].quantity || 0) + quantity
          );
        } else {
          cart.push({
            id: product.id,
            title: product.title,
            slug: product.slug,
            coverImageUrl: product.coverImageUrl,
            price: product.currentPrice,
            regularPrice: product.regularPrice,
            quantity,
            sku: product.sku,
          });
        }
        localStorage.setItem('fanar_cart', JSON.stringify(cart));
      }

      window.dispatchEvent(new Event('cart-updated'));

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (e) {
      console.error('Cart add error:', e);
    }
  };

  const toggleWishlist = async () => {
    try {
      const willBeWishlisted = !isWishlisted;
      setIsWishlisted(willBeWishlisted);

      if (willBeWishlisted) {
        const res = await fetch('/api/v1/account/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });
        if (res.status === 401) {
          // If not logged in, redirect to login
          window.location.href = `/login?redirect=/product/${product.slug}`;
          return;
        }
      } else {
        await fetch(`/api/v1/account/wishlist/${product.id}`, {
          method: 'DELETE',
        });
      }
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Parse specifications if JSON string
  let parsedSpecs: Record<string, string> = {};
  if (product.specifications) {
    try {
      parsedSpecs = JSON.parse(product.specifications);
    } catch {
      // If not JSON, leave empty and display raw string
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-amber-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-amber-400 transition-colors">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/category/${product.categoryId}`}
          className="hover:text-amber-400 transition-colors"
        >
          {product.categoryName || 'Category'}
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-[16/11] w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            <img
              src={imgError || !selectedImage ? fallbackImage : selectedImage}
              alt={product.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-center transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none" />

            {/* Badges on Gallery */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" /> Featured
                </span>
              )}
              {product.isOnSale && product.discountPercent > 0 && (
                <span className="inline-flex items-center rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black text-white shadow-md">
                  SAVE {product.discountPercent}%
                </span>
              )}
            </div>

            {/* Region / Platform Indicator */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              {product.platformName && (
                <span className="rounded-lg bg-slate-900/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-slate-200 border border-slate-700/60 shadow">
                  {product.platformName}
                </span>
              )}
              <span className="rounded-lg bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
                {product.region}
              </span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {allImages.map((imgUrl, index) => {
                const isSelected = selectedImage === imgUrl;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(imgUrl);
                      setImgError(false);
                    }}
                    className={`relative w-20 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Direct Delivery Guarantee Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Instant Vault Key Dispatch
                </h4>
                <p className="text-[11px] text-slate-400">
                  Automated release of hardware-encrypted AES-256 digital activation code upon checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authorized Stock Only
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> AES-256 Cryptography
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Pricing & Purchase (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            {/* Publisher Brand & SKU */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-amber-400 uppercase tracking-wider">
                {product.brand || product.categoryName || 'Fanar Al Bhar'}
              </span>
              {product.sku && (
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-3">
              {product.title}
            </h1>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {product.shortDescription}
              </p>
            )}

            {/* Price Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                  {formatINR(product.currentPrice)}
                </span>
                {product.isOnSale && product.regularPrice > product.currentPrice && (
                  <span className="text-base text-slate-400 line-through font-mono">
                    {formatINR(product.regularPrice)}
                  </span>
                )}
                {product.isOnSale && product.discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black">
                    -{product.discountPercent}% OFF
                  </span>
                )}
              </div>

              {product.discountEndDate && (
                <p className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium mt-1">
                  <Clock className="w-3.5 h-3.5" /> Discount offer valid until{' '}
                  {new Date(product.discountEndDate).toLocaleDateString()}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Only {maxStock} keys remaining in vault!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      In Stock ({maxStock} Available)
                    </span>
                  )}
                </div>

                <span className="text-slate-400 text-[11px]">
                  Taxes included • Single-Vendor Direct
                </span>
              </div>
            </div>

            {/* Purchase Control Area */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-300">Quantity:</span>
                <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-1">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xs font-bold font-mono text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxStock || isOutOfStock}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Wishlist */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isOutOfStock
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : addedToCart
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-98'
                  }`}
                >
                  {isOutOfStock ? (
                    'Currently Out of Stock'
                  ) : addedToCart ? (
                    <>
                      <Check className="w-5 h-5" /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" /> Add to Cart (
                      {formatINR(product.currentPrice * quantity)})
                    </>
                  )}
                </button>

                <button
                  onClick={toggleWishlist}
                  className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                      : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  <span className="text-xs font-semibold sm:hidden">
                    {isWishlisted ? 'Saved' : 'Wishlist'}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  title="Share Product"
                >
                  <Share2 className="w-5 h-5" />
                  {copiedShare && (
                    <span className="text-[10px] text-amber-400 font-bold">Copied!</span>
                  )}
                </button>
              </div>

              {addedToCart && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
                  <span>Product successfully placed in your cart.</span>
                  <Link href="/cart" className="underline font-bold hover:text-emerald-300">
                    View Cart
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Key Attributes Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Delivery
              </span>
              <span className="font-semibold text-slate-200">Instant Key</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Region
              </span>
              <span className="font-semibold text-slate-200">{product.region}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Platform
              </span>
              <span className="font-semibold text-slate-200">
                {product.platformName || 'PC'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Publisher
              </span>
              <span className="font-semibold text-slate-200 truncate block">
                {product.publisher || product.brand || 'Official'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Detailed Information Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-10 mb-16 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-3">
          Product Overview & Specifications
        </h2>

        {/* Description */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed mb-8">
          <p>{product.description}</p>
        </div>

        {/* Specifications Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Technical Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Release Year</span>
              <span className="font-semibold text-slate-200">
                {product.releaseYear || 'Current'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Developer</span>
              <span className="font-semibold text-slate-200">
                {product.developer || product.brand || 'Authorized Studio'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Platform Ecosystem</span>
              <span className="font-semibold text-slate-200">
                {product.platformName || 'Digital'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">SKU Code</span>
              <span className="font-mono text-amber-400 font-semibold">
                {product.sku || 'FAB-DEFAULT'}
              </span>
            </div>

            {/* Custom parsed specs */}
            {Object.entries(parsedSpecs).map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-200">{val}</span>
              </div>
            ))}
          </div>

          {product.specifications && Object.keys(parsedSpecs).length === 0 && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200 mb-1">Specifications Notes:</p>
              <p>{product.specifications}</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <ProductReviews productId={product.id} slug={product.slug} />

      {/* Related Products from Database */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Recommended from this Category
              </h2>
              <p className="text-xs text-slate-400">
                Other authentic products in {product.categoryName || 'our store'}
              </p>
            </div>
            <Link
              href={`/category/${product.categoryId}`}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              View More <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
