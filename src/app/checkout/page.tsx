'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  Truck,
  Zap,
  MapPin,
  AlertCircle,
  Tag,
  CheckCircle2,
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
  quantity: number;
  subtotal: number;
}

interface CartSummary {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  requiresPhysicalShipping: boolean;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);

  // Delivery Form State
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch authenticated user
        const authRes = await fetch('/api/v1/auth/me');
        if (!authRes.ok) {
          router.push('/login?redirect=/checkout');
          return;
        }
        const authData = await authRes.json();
        if (authData.success && authData.user) {
          setUser(authData.user);
          setShippingAddress((prev) => ({
            ...prev,
            fullName: authData.user.name || '',
          }));
        }

        // 2. Fetch server-validated cart
        const cartRes = await fetch('/api/v1/cart');
        if (!cartRes.ok) {
          setErrorMessage('Unable to load cart. Please try again.');
          return;
        }
        const cartData = await cartRes.json();
        if (cartData.success && cartData.cart) {
          if (cartData.cart.items.length === 0) {
            router.push('/cart');
            return;
          }
          setCart(cartData.cart);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error initializing checkout');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    // Foundation: Coupons validated server-side during checkout
    setCouponStatus('Coupon entered will be validated on the secure payment server.');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart?.requiresPhysicalShipping) {
      const { fullName, phone, address, city, state, postalCode, country } = shippingAddress;
      if (!fullName || !phone || !address || !city || !state || !postalCode || !country) {
        setErrorMessage('Please fill in all physical delivery address fields.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/v1/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: cart?.requiresPhysicalShipping ? shippingAddress : null,
          notes: notes.trim() || null,
          couponCode: couponCode.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to initialize order');
        setSubmitting(false);
        return;
      }

      // Order created in PENDING state
      window.dispatchEvent(new Event('cart-updated'));

      // If a real hosted checkout URL is provided by a configured gateway
      if (data.payment?.isConfigured && data.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl;
      } else {
        // Redirect to order success/status page where the user sees their real order details
        router.push(`/order/success/${data.order.orderNumber}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb / Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-amber-400 transition-colors">
              Cart
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-medium">Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Lock className="w-7 h-7 text-amber-400" />
            Secure Server-Validated Checkout
          </h1>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Checkout Notice</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-300 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">Preparing secure checkout session...</p>
          </div>
        ) : !cart ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
            <p className="text-slate-400">No active checkout session found.</p>
            <Link href="/shop" className="mt-4 inline-block text-amber-400 underline">
              Return to Shop
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Customer & Delivery Info (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Account Info */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Customer Information
                  </h2>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    Authenticated Buyer
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Account Email</span>
                    <span className="font-semibold text-slate-200">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Customer Name</span>
                    <span className="font-semibold text-slate-200">{user?.name || 'Customer'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information (Required for physical goods) */}
              {cart.requiresPhysicalShipping ? (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                    <Truck className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-white">Physical Delivery Address</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.fullName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, country: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, address: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                        placeholder="Flat / House / Suite, Street name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">City *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">State *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Postal Code / PIN *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Digital-Only Order</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      No physical delivery address required. All digital license keys in this order will
                      be unlocked and revealed directly in your Fanar Al Bhar account upon payment
                      confirmation.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Order Instructions or Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="Special requests or instructions for your order..."
                />
              </div>
            </div>

            {/* Right Column: Order Summary & Payment Gateway (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-4 pb-3 border-b border-slate-800">
                  Order Summary ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
                </h2>

                {/* Items List Snapshot */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 pr-1 mb-4 space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{item.title}</p>
                        <p className="text-slate-400 text-[11px]">
                          Qty: {item.quantity} × {formatINR(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-200">
                        {formatINR(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-slate-800 mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Discount or Promo Code"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs uppercase focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponStatus && (
                    <p className="text-[11px] text-amber-400 mt-1.5">{couponStatus}</p>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-2.5 text-sm pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">{formatINR(cart.subtotal)}</span>
                  </div>

                  {cart.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span className="font-semibold">−{formatINR(cart.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300">
                    <span>Shipping</span>
                    <span className="font-semibold text-white">
                      {cart.shipping === 0 ? 'FREE' : formatINR(cart.shipping)}
                    </span>
                  </div>

                  {cart.tax > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>GST (18%)</span>
                      <span className="font-semibold text-white">{formatINR(cart.tax)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                    <div>
                      <span className="text-base font-bold text-white block">Payable Total</span>
                      <span className="text-[11px] text-slate-400">Server verified</span>
                    </div>
                    <span className="text-2xl font-black text-amber-400">
                      {formatINR(cart.total)}
                    </span>
                  </div>
                </div>

                {/* Payment Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-98"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Place Order & Pay {formatINR(cart.total)}</span>
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Payments processed through secure cryptographic gateway verification.
                </p>
              </div>
            </div>
          </form>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
