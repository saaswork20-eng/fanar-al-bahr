'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import AccountNav from '@/components/storefront/AccountNav';
import { formatINR } from '@/lib/product-helper';

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string;
    categoryName: string;
    platformName: string;
    deliveryType: string;
    price: number;
    originalPrice: number;
    discountPercent: number;
    isAvailable: boolean;
    stock: number;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/account/wishlist');
      if (res.status === 401) {
        router.push('/login?redirect=/account/wishlist');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemove = async (productId: string) => {
    try {
      setRemovingId(productId);
      const res = await fetch(`/api/v1/account/wishlist/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((it) => it.productId !== productId));
        showToast('success', 'Product removed from wishlist');
      } else {
        showToast('error', data.error || 'Failed to remove product');
      }
    } catch {
      showToast('error', 'Network error removing product');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: WishlistItem['product']) => {
    try {
      setAddingToCartId(product.id);
      const res = await fetch('/api/v1/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `${product.title} added to your cart`);
        // Optional: Trigger cart refresh on header
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        showToast('error', data.error || 'Failed to add to cart');
      }
    } catch {
      showToast('error', 'Error adding item to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-amber-400 transition-colors">
            Account
          </Link>
          <span>/</span>
          <span className="text-amber-400 font-medium">Wishlist</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              My Saved Wishlist
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Save your favorite games, keys, and software to purchase later.
            </p>
          </div>
          <Link
            href="/shop"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            Explore More Products
          </Link>
        </div>

        {/* Feedback Alert Toast */}
        {toastMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-3 shadow-lg transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Account Navigation Sidebar */}
          <AccountNav wishlistCount={items.length} />

          {/* Wishlist Main Area */}
          <div className="flex-1 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p className="text-sm">Loading your saved items...</p>
              </div>
            ) : items.length === 0 ? (
              /* Empty State Requirement: "Your wishlist is empty." */
              <div className="rounded-3xl border border-slate-800 bg-[#12161f] p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400 mb-4">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Your wishlist is empty.</h2>
                <p className="text-xs text-slate-400 mb-6">
                  Explore our single-vendor catalog of digital games and software licenses to save items to your wishlist.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Discover Products</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map(({ id, product }) => {
                  const isRemoving = removingId === product.id;
                  const isAdding = addingToCartId === product.id;

                  return (
                    <div
                      key={id}
                      className="group relative bg-[#12161f] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                        <Image
                          src={product.coverImageUrl || '/placeholder.png'}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.discountPercent > 0 && (
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wide">
                            -{product.discountPercent}% OFF
                          </div>
                        )}
                        <button
                          onClick={() => handleRemove(product.id)}
                          disabled={isRemoving}
                          title="Remove from Wishlist"
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/70 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-sm transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium mb-1">
                            <span>{product.categoryName}</span>
                            <span>•</span>
                            <span>{product.platformName}</span>
                          </div>
                          <Link
                            href={`/product/${product.slug}`}
                            className="font-bold text-sm text-white hover:text-amber-400 transition-colors line-clamp-2"
                          >
                            {product.title}
                          </Link>
                        </div>

                        {/* Price & Action */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <div className="flex items-baseline justify-between mb-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-extrabold text-white">
                                {formatINR(product.price)}
                              </span>
                              {product.originalPrice > product.price && (
                                <span className="text-xs text-slate-500 line-through">
                                  {formatINR(product.originalPrice)}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                product.isAvailable
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/product/${product.slug}`}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-center text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Details</span>
                            </Link>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={!product.isAvailable || isAdding}
                              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
