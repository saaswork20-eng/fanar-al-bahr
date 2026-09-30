'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Truck,
  RotateCcw,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { formatINR } from '@/lib/product-helper';

interface CartItem {
  id: string;
  productId: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  sku: string;
  deliveryType: string;
  unitPrice: number;
  regularPrice: number;
  discountPrice: number | null;
  quantity: number;
  subtotal: number;
  stock: number;
  isAvailable: boolean;
}

interface CartData {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  requiresPhysicalShipping: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/v1/cart');

      if (res.status === 401) {
        // Not authenticated as buyer
        setCart(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
      } else {
        setErrorMessage(data.error || 'Failed to load shopping cart');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const handleCartSync = () => fetchCart();
    window.addEventListener('cart-updated', handleCartSync);
    return () => window.removeEventListener('cart-updated', handleCartSync);
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      setUpdatingId(itemId);
      setErrorMessage(null);
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart(data.cart);
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        setErrorMessage(data.error || 'Failed to update quantity');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingId(itemId);
      setErrorMessage(null);
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart(data.cart);
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        setErrorMessage(data.error || 'Failed to remove item');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error removing item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/v1/cart', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCart(data.cart);
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb / Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link href="/" className="hover:text-amber-400 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-amber-400 font-medium">Shopping Cart</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-amber-400" />
              Your Shopping Cart
            </h1>
          </div>

          {cart && cart.items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-300 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">Calculating real-time cart data...</p>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          /* Empty Cart State */
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-6">
              <ShoppingBag className="w-10 h-10 text-amber-400/80" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty.</h2>
            <p className="text-sm text-slate-400 mb-8">
              Looks like you haven&apos;t added any items to your cart yet. Discover authentic digital games,
              software licenses, and hardware gear from Fanar Al Bhar.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-98"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        ) : (
          /* Real Cart View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden divide-y divide-slate-800/60">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-900/90"
                  >
                    {/* Product Media & Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                        <img
                          src={
                            item.coverImageUrl ||
                            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.deliveryType === 'INSTANT_KEY' && (
                          <div className="absolute top-1 left-1 bg-amber-500/90 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                            DIGITAL
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-bold text-white text-base hover:text-amber-400 transition-colors line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">
                          SKU: <span className="font-mono text-slate-300">{item.sku}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-400">
                            {formatINR(item.unitPrice)}
                          </span>
                          {item.regularPrice > item.unitPrice && (
                            <span className="text-xs text-slate-500 line-through">
                              {formatINR(item.regularPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Item Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-700 rounded-xl bg-slate-950 p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-white">
                          {updatingId === item.id ? '...' : item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock || updatingId === item.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[90px]">
                        <span className="block text-xs text-slate-400">Subtotal</span>
                        <span className="text-base font-extrabold text-white">
                          {formatINR(item.subtotal)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingId === item.id}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary Column (4 cols) */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur-xl sticky top-24 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-4 pb-3 border-b border-slate-800">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Cart Subtotal</span>
                    <span className="font-semibold text-white">{formatINR(cart.subtotal)}</span>
                  </div>

                  {cart.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span className="font-semibold">−{formatINR(cart.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-400" />
                      Estimated Shipping
                    </span>
                    <span className="font-semibold text-white">
                      {cart.shipping === 0 ? 'FREE' : formatINR(cart.shipping)}
                    </span>
                  </div>

                  {cart.tax > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Tax (GST 18%)</span>
                      <span className="font-semibold text-white">{formatINR(cart.tax)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                    <div>
                      <span className="text-base font-bold text-white block">Final Total</span>
                      <span className="text-[11px] text-slate-400">Server verified amount</span>
                    </div>
                    <span className="text-2xl font-black text-amber-400">
                      {formatINR(cart.total)}
                    </span>
                  </div>
                </div>

                {/* Proceed to Checkout CTA */}
                <button
                  onClick={() => router.push('/checkout')}
                  className="mt-6 w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Official Single-Vendor Store</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Instant Digital Key Release After Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
