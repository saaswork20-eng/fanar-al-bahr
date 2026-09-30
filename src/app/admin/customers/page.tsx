'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { formatINR } from '@/lib/product-helper';

interface CustomerSummary {
  id: string;
  email: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: string | null;
  createdAt: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/admin/customers?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/login?from=/admin/customers');
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setTotalCount(data.total || data.customers.length);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100 font-sans">
      <AdminSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0d1117]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-400" />
            <h1 className="font-bold text-base text-white">Registered Customer Management</h1>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Fanar Al Bhar Store • Single-Vendor Admin
          </div>
        </header>

        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
              <span className="text-xs font-medium text-slate-400 block mb-1">Total Registered Buyers</span>
              <span className="text-2xl font-black text-white">{totalCount}</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
              <span className="text-xs font-medium text-slate-400 block mb-1">Active Accounts</span>
              <span className="text-2xl font-black text-emerald-400">
                {customers.filter((c) => c.status === 'ACTIVE').length}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#12161f] border border-slate-800">
              <span className="text-xs font-medium text-slate-400 block mb-1">Total Customer Spending</span>
              <span className="text-2xl font-black text-amber-400">
                {formatINR(customers.reduce((acc, c) => acc + c.totalSpent, 0))}
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#12161f] border border-slate-800 p-4 rounded-2xl">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active Accounts</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-[#12161f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading registered buyers...
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No registered customers found</p>
                <p className="text-xs">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Contact</th>
                      <th className="py-3 px-4 font-semibold">Registered</th>
                      <th className="py-3 px-4 font-semibold">Orders</th>
                      <th className="py-3 px-4 font-semibold">Total Spent</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                              {(c.name || c.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Anonymous Buyer'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {c.phone || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {c.orderCount}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-400">
                          {formatINR(c.totalSpent)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/customers/${c.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
