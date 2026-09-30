'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Truck,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
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
  buyerId: string;
  buyer?: {
    id: string;
    name: string | null;
    email: string;
  };
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  paymentId: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);
      params.set('page', page.toString());
      params.set('limit', '15');

      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login?redirect=/admin/orders');
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Admin</span>
                <span>/</span>
                <span className="text-amber-400 font-medium">Orders</span>
              </div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <ShoppingBag className="w-7 h-7 text-amber-400" />
                Customer Orders & Fulfillment
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage Fanar Al Bhar real customer purchases, verify payment status, and process deliveries.
              </p>
            </div>

            <button
              onClick={() => fetchOrders()}
              className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-amber-400 placeholder-slate-500"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">All Order Statuses</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">All Payment Statuses</option>
                <option value="PENDING">Payment: PENDING</option>
                <option value="PAID">Payment: PAID</option>
                <option value="FAILED">Payment: FAILED</option>
                <option value="REFUNDED">Payment: REFUNDED</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Orders Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
                <p className="text-xs">Loading orders from database...</p>
              </div>
            ) : orders.length === 0 ? (
              /* Mandatory: No mock orders. Real empty state */
              <div className="py-20 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No orders yet.</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When customers place orders through checkout, they will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Order Number</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Payment Status</th>
                      <th className="py-3.5 px-4">Order Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {orders.map((order) => {
                      const isPaid = order.paymentStatus === 'PAID';
                      return (
                        <tr key={order.id} className="hover:bg-slate-900/90 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-amber-400">
                            {order.orderNumber}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-white block">
                              {order.buyer?.name || 'Customer'}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {order.buyer?.email || order.buyerId}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-4 px-4 font-bold text-white">
                            {formatINR((order as any).totalAmount ?? order.total ?? 0)}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : order.paymentStatus === 'FAILED'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing page {page} of {totalPages} ({totalCount} total orders)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
