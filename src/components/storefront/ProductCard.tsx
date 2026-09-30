'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Zap,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string;
    brand?: string | null;
    categoryName?: string;
    platformName?: string;
    region?: string;
    price: number;
    discountPrice?: number | null;
    regularPrice?: number;
    salePrice?: number | null;
    currentPrice?: number;
    discountPercent?: number;
    isOnSale?: boolean;
    stockQuantity: number;
    lowStockThreshold?: number;
    stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    inStock?: boolean;
    isFeatured?: boolean;
    sku?: string | null;
  };
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const list = JSON.parse(localStorage.getItem('fanar_wishlist') || '[]');
      return Array.isArray(list) && list.some((item: any) => item.id === product.id);
    } catch {
      return false;
    }
  });
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Pricing calculation
  const regularPrice = product.regularPrice ?? (
    product.discountPrice && product.discountPrice > product.price
      ? product.discountPrice
      : product.price
  );
  const currentPrice = product.currentPrice ?? (
    product.discountPrice && product.discountPrice < product.price
      ? product.discountPrice
      : (product.discountPrice && product.discountPrice > product.price ? product.price : product.price)
  );
  const isOnSale = product.isOnSale ?? (regularPrice > currentPrice);
  const discountPercent = product.discountPercent ?? (
    isOnSale && regularPrice > 0 ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100) : 0
  );

  const stock = product.stockQuantity || 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= (product.lowStockThreshold ?? 5);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let list = JSON.parse(localStorage.getItem('fanar_wishlist') || '[]');
      if (!Array.isArray(list)) list = [];

      const exists = list.some((item: any) => item.id === product.id);
      if (exists) {
        list = list.filter((item: any) => item.id !== product.id);
        setIsWishlisted(false);
      } else {
        list.push({
          id: product.id,
          title: product.title,
          slug: product.slug,
          coverImageUrl: product.coverImageUrl,
          price: currentPrice,
        });
        setIsWishlisted(true);
      }
      localStorage.setItem('fanar_wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    try {
      // 1. Send authoritative add to cart to server
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (!res.ok && res.status === 401) {
        // Guest user: preserve temporary state in localStorage
        let cart = JSON.parse(localStorage.getItem('fanar_cart') || '[]');
        if (!Array.isArray(cart)) cart = [];
        const existingIndex = cart.findIndex((item: any) => item.id === product.id);
        if (existingIndex > -1) {
          cart[existingIndex].quantity = Math.min(stock, (cart[existingIndex].quantity || 1) + 1);
        } else {
          cart.push({
            id: product.id,
            title: product.title,
            slug: product.slug,
            coverImageUrl: product.coverImageUrl,
            price: currentPrice,
            regularPrice,
            quantity: 1,
            sku: product.sku,
          });
        }
        localStorage.setItem('fanar_cart', JSON.stringify(cart));
      }

      window.dispatchEvent(new Event('cart-updated'));

      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);

      if (onAddToCart) onAddToCart(product.id);
    } catch (err) {
      console.error('Cart error:', err);
    }
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col overflow-hidden">
      {/* Cover Image & Badges */}
      <Link href={`/product/${product.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
        <img
          src={imageError || !product.coverImageUrl ? fallbackImage : product.coverImageUrl}
          alt={product.title}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-950 shadow-sm backdrop-blur-sm">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          {isOnSale && discountPercent > 0 && (
            <span className="inline-flex items-center rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Platform Badge */}
        {product.platformName && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="rounded-md bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-slate-200 border border-slate-700/50">
              {product.platformName}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-colors ${
            isWishlisted
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Brand */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="truncate">{product.categoryName || 'Digital'}</span>
            {product.brand && (
              <span className="text-slate-400 truncate max-w-[120px] font-medium">
                {product.brand}
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/product/${product.slug}`}
            className="block font-semibold text-sm text-slate-100 hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
          >
            {product.title}
          </Link>
        </div>

        <div className="pt-3 border-t border-slate-800/60 mt-3">
          {/* Stock Indicator */}
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5">
              {isOutOfStock ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[11px] font-medium text-rose-400">Out of Stock</span>
                </>
              ) : isLowStock ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-amber-300">Only {stock} left!</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-400">In Stock</span>
                </>
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
              <Zap className="w-3 h-3 text-amber-400" /> Direct Key
            </span>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-white font-mono">
                  {formatINR(currentPrice)}
                </span>
                {isOnSale && regularPrice > currentPrice && (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatINR(regularPrice)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
                  : addedAnimation
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> Buy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
