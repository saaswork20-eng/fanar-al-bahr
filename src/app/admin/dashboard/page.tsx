'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
  PackageX,
  Boxes,
  Layers,
  ArrowUpRight,
  BarChart3,
  Calendar,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface DashboardTelemetry {
  sales: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  products: {
    total: number;
    published: number;
    draft: number;
    outOfStock: number;
    lowStock: number;
  };
  customers: {
    total: number;
    newBuyers: number;
    returningBuyers: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    buyerName?: string;
    buyerEmail?: string;
    totalAmount: number;
    total?: number;
    status: string;
    paymentStatus?: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetName: string | null;
    details: string | null;
    adminEmail: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardTelemetry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/stats');
      const json = await res.json();
      if (json.success) {
        setData(json.telemetry || {
          sales: {
            today: 0,
            week: 0,
            month: 0,
            total: json.stats?.totalSales || 0,
          },
          orders: {
            total: json.stats?.totalOrders || 0,
            pending: json.stats?.pendingOrders || 0,
            processing: 0,
            completed: json.stats?.deliveredOrders || 0,
            cancelled: 0,
          },
          products: {
            total: json.stats?.totalProducts || 0,
            published: json.stats?.totalProducts || 0,
            draft: 0,
            outOfStock: json.stats?.outOfStockProducts || 0,
            lowStock: json.stats?.lowStockProducts || 0,
          },
          customers: {
            total: json.stats?.totalCustomers || 0,
            newBuyers: 0,
            returningBuyers: 0,
          },
          recentOrders: json.recentOrders || [],
          recentActivity: json.recentActivity || [],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 px-6 md:px-8 border-b border-[#232a3b] bg-[#0c1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="pl-12 md:pl-0">
            <h1 className="font-black text-base text-white flex items-center gap-2">
              <span>Fanar Al Bhar Store Control Center</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                Single-Vendor
              </span>
            </h1>
            <p className="text-xs text-slate-400">Live single-vendor telemetry, sales, orders, catalog & inventory</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-xl bg-[#12161f] border border-[#232a3b] text-slate-400 hover:text-white transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/admin/products/new"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl">
          {/* Inventory Health Alert */}
          {data && data.products.lowStock > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-amber-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Inventory Alert:</strong> {data.products.lowStock} product(s) are running low on stock.
                </span>
              </div>
              <Link
                href="/admin/inventory"
                className="text-amber-400 hover:text-amber-200 font-bold underline flex items-center gap-1"
              >
                <span>Manage Inventory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* 1. SALES METRICS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Sales Revenue (Real Database Results)</span>
              </h2>
              <Link href="/admin/analytics" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <span>View Analytics</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
                <span className="text-xs text-slate-400 block">Today's Sales</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {data ? formatINR(data.sales.today) : '—'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Since 00:00:00 today</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
                <span className="text-xs text-slate-400 block">This Week's Sales</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {data ? formatINR(data.sales.week) : '—'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Past 7 days paid orders</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
                <span className="text-xs text-slate-400 block">This Month's Sales</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {data ? formatINR(data.sales.month) : '—'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Past 30 days paid orders</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#12161f] border border-amber-500/20 bg-gradient-to-br from-[#12161f] to-amber-950/10">
                <span className="text-xs text-amber-400 font-semibold block">Total Store Sales</span>
                <div className="text-2xl font-black text-white mt-1">
                  {data ? formatINR(data.sales.total) : '—'}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Cumulative all-time revenue</span>
              </div>
            </div>
          </div>

          {/* 2. ORDERS METRICS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>Orders Pipeline</span>
              </h2>
              <Link href="/admin/orders" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <span>All Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-slate-400 block">Total Orders</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{data?.orders.total ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-amber-400 block">Pending Orders</span>
                <span className="text-xl font-bold text-amber-400 mt-0.5 block">{data?.orders.pending ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-cyan-400 block">Processing</span>
                <span className="text-xl font-bold text-cyan-400 mt-0.5 block">{data?.orders.processing ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-emerald-400 block">Completed</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{data?.orders.completed ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-rose-400 block">Cancelled</span>
                <span className="text-xl font-bold text-rose-400 mt-0.5 block">{data?.orders.cancelled ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* 3. PRODUCTS & INVENTORY METRICS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                <span>Catalog & Inventory Status</span>
              </h2>
              <Link href="/admin/inventory" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <span>Manage Stock</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-slate-400 block">Total Products</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{data?.products.total ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-emerald-400 block">Published</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{data?.products.published ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-slate-400 block">Draft</span>
                <span className="text-xl font-bold text-slate-300 mt-0.5 block">{data?.products.draft ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-amber-400 block">Low Stock</span>
                <span className="text-xl font-bold text-amber-400 mt-0.5 block">{data?.products.lowStock ?? '—'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-rose-400 block">Out of Stock</span>
                <span className="text-xl font-bold text-rose-400 mt-0.5 block">{data?.products.outOfStock ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* 4. CUSTOMERS METRICS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Customer Base (Buyers Only)</span>
              </h2>
              <Link href="/admin/customers" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <span>Customer Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-slate-400 block">Total Registered Buyers</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{data?.customers.total ?? '—'}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Verified customer accounts</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-indigo-400 block">New Buyers (Last 30 Days)</span>
                <span className="text-xl font-bold text-indigo-400 mt-0.5 block">{data?.customers.newBuyers ?? '—'}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Recently onboarded</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0f131c] border border-[#232a3b]">
                <span className="text-[11px] text-emerald-400 block">Returning Buyers</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{data?.customers.returningBuyers ?? '—'}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Placed more than 1 order</span>
              </div>
            </div>
          </div>

          {/* Two Columns: Recent Orders & Audit Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
              <div className="flex items-center justify-between border-b border-[#232a3b] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Orders</h3>
                  <p className="text-[11px] text-slate-400">Latest single-vendor purchases</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data?.recentOrders && data.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {data.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-[#141a24] border border-[#232a3b] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-white block">{order.orderNumber}</span>
                        <span className="text-slate-400 text-[11px]">
                          {order.buyerName || order.buyerEmail || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="font-black text-emerald-400 block">
                          {formatINR(order.totalAmount ?? order.total ?? 0)}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : order.status === 'PROCESSING' || order.status === 'CONFIRMED'
                              ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No orders have been placed in the store yet.
                </div>
              )}
            </div>

            {/* Audit Log Activity */}
            <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
              <div className="flex items-center justify-between border-b border-[#232a3b] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Store Audit Log</h3>
                  <p className="text-[11px] text-slate-400">Security & store administration events</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Immutable</span>
              </div>

              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {data.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#141a24] border border-[#232a3b] flex items-start gap-3 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 truncate">{log.details || log.targetName}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{log.adminEmail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No administrative actions logged yet.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
