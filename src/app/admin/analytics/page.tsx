'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface TimeSeriesPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  unitsSold: number;
}

interface TopProduct {
  id: string;
  title: string;
  sku: string | null;
  coverImageUrl: string;
  unitsSold: number;
  revenue: number;
}

interface AnalyticsData {
  period: string;
  summary: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    productsSold: number;
    customers: number;
  };
  timeSeries: TimeSeriesPoint[];
  topProducts: TopProduct[];
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'orders' | 'units'>('revenue');

  const fetchAnalytics = async (p = period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/analytics?period=${p}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const maxRevenue = data?.timeSeries ? Math.max(...data.timeSeries.map((t) => t.revenue), 1) : 1;
  const maxOrders = data?.timeSeries ? Math.max(...data.timeSeries.map((t) => t.orders), 1) : 1;
  const maxUnits = data?.timeSeries ? Math.max(...data.timeSeries.map((t) => t.unitsSold), 1) : 1;

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 px-6 md:px-8 border-b border-[#232a3b] bg-[#0c1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="pl-12 md:pl-0">
            <h1 className="font-black text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Sales Analytics & Performance</span>
            </h1>
            <p className="text-xs text-slate-400">Audited revenue, orders, AOV, and top products</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-[#12161f] border border-[#232a3b] text-xs">
              {(['today', '7d', '30d', '90d', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    period === p
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchAnalytics(period)}
              disabled={loading}
              className="p-2 rounded-xl bg-[#12161f] border border-[#232a3b] text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Revenue */}
            <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
              <span className="text-xs text-slate-400 block">Total Revenue</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {data ? formatINR(data.summary.revenue) : '—'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Confirmed paid sales</span>
            </div>

            {/* Orders */}
            <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
              <span className="text-xs text-slate-400 block">Total Orders</span>
              <div className="text-2xl font-black text-white mt-1">
                {data ? data.summary.orders : '—'}
              </div>
              <span className="text-[11px] text-cyan-400/90 mt-1 block">Completed & confirmed</span>
            </div>

            {/* AOV */}
            <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
              <span className="text-xs text-slate-400 block">Average Order Value</span>
              <div className="text-2xl font-black text-amber-300 mt-1">
                {data ? formatINR(data.summary.averageOrderValue) : '—'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Revenue per valid order</span>
            </div>

            {/* Products Sold */}
            <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
              <span className="text-xs text-slate-400 block">Products Sold</span>
              <div className="text-2xl font-black text-white mt-1">
                {data ? data.summary.productsSold : '—'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Units purchased</span>
            </div>

            {/* Unique Customers */}
            <div className="p-5 rounded-2xl bg-[#12161f] border border-[#232a3b]">
              <span className="text-xs text-slate-400 block">Active Customers</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {data ? data.summary.customers : '—'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Purchased buyers</span>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#232a3b] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Visual Sales Performance</h3>
                <p className="text-xs text-slate-400">Timeline trends based on real database records</p>
              </div>

              {/* Chart Mode Selector */}
              <div className="flex items-center p-1 rounded-xl bg-[#141a24] border border-[#232a3b] text-xs">
                <button
                  onClick={() => setActiveChartTab('revenue')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'revenue'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setActiveChartTab('orders')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'orders'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveChartTab('units')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeChartTab === 'units'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Units Sold
                </button>
              </div>
            </div>

            {/* SVG Interactive Chart Bar Area */}
            {data && data.timeSeries.length > 0 ? (
              <div className="space-y-4">
                <div className="h-64 flex items-end gap-2 md:gap-3 pt-6 pb-2 px-2 border-b border-[#232a3b]">
                  {data.timeSeries.map((point, index) => {
                    let heightPercent = 4;
                    let displayVal = '';
                    let barColor = 'bg-emerald-500 hover:bg-emerald-400';

                    if (activeChartTab === 'revenue') {
                      heightPercent = maxRevenue > 0 ? Math.max(4, Math.round((point.revenue / maxRevenue) * 100)) : 4;
                      displayVal = `₹${point.revenue}`;
                      barColor = 'bg-emerald-500 hover:bg-emerald-400';
                    } else if (activeChartTab === 'orders') {
                      heightPercent = maxOrders > 0 ? Math.max(4, Math.round((point.orders / maxOrders) * 100)) : 4;
                      displayVal = `${point.orders} orders`;
                      barColor = 'bg-cyan-500 hover:bg-cyan-400';
                    } else {
                      heightPercent = maxUnits > 0 ? Math.max(4, Math.round((point.unitsSold / maxUnits) * 100)) : 4;
                      displayVal = `${point.unitsSold} units`;
                      barColor = 'bg-amber-500 hover:bg-amber-400';
                    }

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#1a2233] text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg border border-[#2b3850] whitespace-nowrap z-20">
                          {point.label}: {displayVal}
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${barColor}`}
                        />
                        {/* Label */}
                        <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center">
                          {point.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                No sales data available for this time range.
              </div>
            )}
          </div>

          {/* Top Selling Products */}
          <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#232a3b] space-y-4">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Top Selling Products</h3>
                <p className="text-xs text-slate-400">Ranked by revenue from confirmed customer purchases</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {data ? `${data.topProducts.length} items` : ''}
              </span>
            </div>

            {data && data.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-[#232a3b]">
                    <tr>
                      <th className="pb-3">Rank</th>
                      <th className="pb-3">Product</th>
                      <th className="pb-3">SKU</th>
                      <th className="pb-3 text-right">Units Sold</th>
                      <th className="pb-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232a3b]">
                    {data.topProducts.map((prod, idx) => (
                      <tr key={prod.id} className="hover:bg-[#141a24] transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.coverImageUrl}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover border border-[#232a3b]"
                            />
                            <span className="font-semibold text-white">{prod.title}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-slate-400">{prod.sku || 'N/A'}</td>
                        <td className="py-3 text-right font-bold text-white">{prod.unitsSold}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">
                          {formatINR(prod.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No products have been sold in this time period yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
