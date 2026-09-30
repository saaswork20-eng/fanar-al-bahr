'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Key,
  ShieldCheck,
  Package,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import { formatINR } from '@/lib/product-helper';

interface OrderData {
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
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productTitle: string;
    sku: string;
    priceAtPurchase: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface RevealedKey {
  keyId: string;
  productId: string;
  productTitle: string;
  serialKey: string;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Digital key reveal state
  const [revealingKeys, setRevealingKeys] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<RevealedKey[] | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/orders/${orderNumber}`);
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Unable to locate order');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading order');
      } finally {
        setLoading(false);
      }
    }
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const handleRevealKeys = async () => {
    if (!order) return;
    try {
      setRevealingKeys(true);
      const res = await fetch(`/api/v1/account/orders/${order.id}/keys`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.keys)) {
        setRevealedKeys(data.keys);
      } else {
        alert(data.error || 'Failed to reveal digital keys. Payment confirmation may still be pending.');
      }
    } catch (err: any) {
      alert(err.message || 'Error revealing keys');
    } finally {
      setRevealingKeys(false);
    }
  };

  const copyToClipboard = (keyId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <StorefrontHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-sm">Retrieving order confirmation...</p>
          </div>
        ) : error || !order ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-300">
            <AlertTriangle className="w-12 h-12 mx-auto text-rose-400 mb-3" />
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-sm text-rose-300/80 mb-6">{error || 'Invalid order reference.'}</p>
            <Link
              href="/"
              className="inline-flex px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Success / Pending Banner */}
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
                {order.paymentStatus === 'PAID' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <Clock className="w-8 h-8 text-amber-400" />
                )}
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-slate-800 text-slate-300 mb-3">
                {order.paymentStatus === 'PAID' ? 'Order Confirmed' : 'Order Registered & Pending Payment'}
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Thank you for your order!
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your order number is <span className="font-mono text-amber-400 font-bold">{order.orderNumber}</span>.
                {order.paymentStatus === 'PAID'
                  ? ' Your payment has been confirmed and products are ready.'
                  : ' Your order has been securely registered in the system awaiting payment confirmation.'}
              </p>
            </div>

            {/* Digital Key Delivery Card (if payment is confirmed) */}
            {order.paymentStatus === 'PAID' ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 mb-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Digital Product Vault Delivery</h2>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    AES-256-GCM Secured
                  </span>
                </div>

                {!revealedKeys ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-300 mb-4">
                      Your purchased digital keys are stored in the encrypted vault. Click below to securely reveal your genuine keys.
                    </p>
                    <button
                      onClick={handleRevealKeys}
                      disabled={revealingKeys}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg transition-all"
                    >
                      {revealingKeys ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Decrypting Keys...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Reveal My Digital Keys</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : revealedKeys.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No instant digital keys associated with these items (e.g. physical shipping goods).
                  </p>
                ) : (
                  <div className="space-y-3">
                    {revealedKeys.map((k) => (
                      <div
                        key={k.keyId}
                        className="p-4 rounded-xl border border-emerald-500/30 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{k.productTitle}</p>
                          <p className="font-mono text-sm sm:text-base font-bold text-amber-400 select-all tracking-wider mt-1">
                            {k.serialKey}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(k.keyId, k.serialKey)}
                          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          {copiedKeyId === k.keyId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Key</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Payment Status: PENDING</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Digital license keys and physical fulfillment are unlocked once payment is confirmed
                      by the secure payment provider webhook.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items & Financial Breakdown */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Purchased Products</h2>
              </div>

              <div className="divide-y divide-slate-800/60">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-white block">{item.productTitle}</span>
                      <span className="text-xs text-slate-400">
                        Qty: {item.quantity} × {formatINR(item.priceAtPurchase)} (SKU: {item.sku})
                      </span>
                    </div>
                    <span className="font-bold text-white">{formatINR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Subtotal</span>
                  <span className="text-slate-200">{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-xs">
                    <span>Discount</span>
                    <span>−{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Shipping</span>
                  <span className="text-slate-200">
                    {order.shipping === 0 ? 'FREE' : formatINR(order.shipping)}
                  </span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Tax (GST 18%)</span>
                    <span className="text-slate-200">{formatINR(order.tax)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-base text-white">
                  <span>Total Paid / Payable</span>
                  <span className="text-amber-400 text-lg">{formatINR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <Link
                href="/account/orders"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold text-center transition-colors"
              >
                View in Order History
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
