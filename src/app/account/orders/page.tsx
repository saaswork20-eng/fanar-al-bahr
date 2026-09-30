'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
  Filter,
} from 'lucide-react';
import StorefrontHeader from '@/components/storefront/Header';
import StorefrontFooter from '@/components/storefront/Footer';
import AccountNav from '@/components/storefront/AccountNav';
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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount?: number;
  total: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/account/orders');
        if (res.status === 401) {
          router.push('/login?redirect=/account/orders');
          return;
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setError(data.error || 'Failed to load order history');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [router]);

  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PAID' && order.paymentStatus !== 'PAID') return false;
      if (statusFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false;
      if (statusFilter === 'PROCESSING' && order.status !== 'PROCESSING') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.orderNumber.toLowerCase().includes(q);
      const matchProduct = order.items?.some((item) =>
        item.productTitle?.toLowerCase().includes(q)
      );
      if (!matchOrderNum && !matchProduct) return false;
    }

    return true;
  });

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
          <span className="text-amber-400 font-medium">My Orders</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-amber-400" />
              My Orders & Purchases
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Authoritative transaction history and digital key license access.
            </p>
          </div>
          <Link
            href="/shop"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            Continue Shopping
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Account Navigation Sidebar */}
          <AccountNav orderCount={orders.length} />

          {/* Orders Area */}
          <div className="flex-1 w-full space-y-5">
            {/* Filter & Search Bar */}
            <div className="bg-[#12161f] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order # or product..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Orders</option>
                  <option value="PAID">Confirmed / Paid</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p className="text-sm">Loading your orders...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                {error}
              </div>
            ) : filteredOrders.length === 0 ? (
              /* Empty state requirement: "You haven't placed any orders yet." */
              <div className="rounded-3xl border border-slate-800 bg-[#12161f] p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-slate-400 mb-4">
                  <Package className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {orders.length === 0 ? "You haven't placed any orders yet." : "No orders match your filter."}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                  {orders.length === 0
                    ? 'When you purchase games, licenses, or products from Fanar Al Bhar, they will be listed here.'
                    : 'Try clearing your search term or selecting All Orders.'}
                </p>
                {orders.length === 0 ? (
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
                  >
                    Browse Store
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isPaid = order.paymentStatus === 'PAID';
                  const finalTotal = order.totalAmount ?? order.total ?? 0;
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-slate-800 bg-[#12161f] p-5 sm:p-6 transition-all hover:border-amber-500/40 hover:bg-[#151a24] shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {order.paymentStatus || 'PENDING'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-4 space-y-2">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="font-medium text-slate-200">{item.productTitle}</span>
                              <span className="text-slate-500">× {item.quantity}</span>
                            </div>
                            <span className="font-semibold text-slate-300">
                              {formatINR(item.priceAtPurchase * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Info & Action */}
                      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-400 mr-2">Total Amount:</span>
                          <span className="text-base font-extrabold text-white">
                            {formatINR(finalTotal)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/10"
                          >
                            <span>View Details & Key Access</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
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
