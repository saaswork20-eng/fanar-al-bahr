'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  CreditCard,
  ArrowLeft,
  Truck,
  Key,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { formatINR } from '@/lib/product-helper';

interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: any;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  couponCode?: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Digital keys
  const [revealingKeys, setRevealingKeys] = useState(false);
  const [keys, setKeys] = useState<any[] | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/account/orders/${orderId}`);

        if (res.status === 401) {
          router.push(`/login?redirect=/account/orders/${orderId}`);
          return;
        }

        const data = await res.json();
        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Unable to access this order (protected by IDOR security)');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching order');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, router]);

  const handleRevealKeys = async () => {
    if (!order) return;
    try {
      setRevealingKeys(true);
      const res = await fetch(`/api/v1/account/orders/${order.id}/keys`);
      const data = await res.json();
      if (res.ok && data.success) {
        setKeys(data.keys);
      } else {
        alert(data.error || 'Failed to reveal keys');
      }
    } catch (err: any) {
      alert(err.message || 'Error revealing keys');
    } finally {
      setRevealingKeys(false);
    }
  };

  const copyKey = (keyId: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account/orders" className="hover:text-amber-400 transition-colors">
            My Orders
          </Link>
          <span>/</span>
          <span className="text-amber-400 font-medium">Order Details</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">Retrieving order details...</p>
          </div>
        ) : error || !order ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-300">
            <AlertCircle className="w-12 h-12 mx-auto text-rose-400 mb-3" />
            <h2 className="text-lg font-bold mb-2">Access Forbidden or Order Not Found</h2>
            <p className="text-xs text-rose-300/80 mb-6">{error}</p>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                  <Package className="w-7 h-7 text-amber-400" />
                  Order #{order.orderNumber}
                </h1>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Placed on{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  Payment: {order.paymentStatus}
                </span>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Digital Keys Section (only when PAID) */}
            {order.paymentStatus === 'PAID' && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">Digital Product Licenses</h2>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    AES-256-GCM Vault
                  </span>
                </div>

                {!keys ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-300 mb-3">
                      Digital serial keys for this order are securely stored in the encrypted vault.
                    </p>
                    <button
                      onClick={handleRevealKeys}
                      disabled={revealingKeys}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all"
                    >
                      {revealingKeys ? 'Decrypting Keys...' : 'Reveal Digital Keys'}
                    </button>
                  </div>
                ) : keys.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-1">
                    No instant digital keys for these products.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {keys.map((k) => (
                      <div
                        key={k.keyId}
                        className="p-3.5 rounded-xl border border-emerald-500/30 bg-slate-950/80 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs text-slate-300">{k.productTitle}</p>
                          <p className="font-mono text-sm font-bold text-amber-400 select-all tracking-wider">
                            {k.serialKey}
                          </p>
                        </div>
                        <button
                          onClick={() => copyKey(k.keyId, k.serialKey)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 hover:text-white flex items-center gap-1"
                        >
                          {copiedKeyId === k.keyId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Purchased Items List */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Purchased Items Snapshot
              </h2>
              <div className="divide-y divide-slate-800/60">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-white block">{item.productTitle}</span>
                      <span className="text-xs text-slate-400">
                        SKU: {item.sku} &bull; Qty: {item.quantity} &times; {formatINR(item.priceAtPurchase)}
                      </span>
                    </div>
                    <span className="font-bold text-white">{formatINR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Snapshot */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-200">{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Discount</span>
                    <span>−{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Shipping</span>
                  <span className="text-slate-200">
                    {order.shipping === 0 ? 'FREE' : formatINR(order.shipping)}
                  </span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tax (GST 18%)</span>
                    <span className="text-slate-200">{formatINR(order.tax)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-base text-white">
                  <span>Final Total</span>
                  <span className="text-amber-400 text-lg">
                    {formatINR((order as any).totalAmount ?? order.total ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information (if physical) */}
            {order.shippingAddress && (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">Delivery Address</h2>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-slate-100">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="text-slate-400 mt-2">Phone: {order.shippingAddress.phone}</p>
                  {order.trackingNumber && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 block text-[11px] font-semibold">Shipment Tracking Number:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm block">{order.trackingNumber}</span>
                      {order.shippingMethod && (
                        <span className="text-[11px] text-slate-500 block">Courier Method: {order.shippingMethod}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
              </Link>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
