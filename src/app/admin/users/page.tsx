'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Users,
  Search,
  Filter,
  Shield,
  Store,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'BUYER';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
  emailVerified: string | null;
  createdAt: string;
}

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'ALL';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">User Account Governance</h1>
            <p className="text-[11px] text-slate-400">Database user records, role assignments & access control</p>
          </div>

          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Filter Bar & Search */}
          <div className="bg-[#0f131c] border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </form>

            {/* Role & Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mr-1">Role:</span>
              {['ALL', 'BUYER', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}

              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider ml-2 mr-1">Status:</span>
              {['ALL', 'ACTIVE', 'SUSPENDED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    statusFilter === s
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0f131c] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white">Registered Customer & Admin Directory</span>
              <span className="font-mono text-slate-400">{users.length} match(es)</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin text-indigo-400" />
                <p>Loading database accounts...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-slate-400 font-semibold">No user accounts found matching your filters.</p>
                <p>Try resetting search terms or switching role filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">User Details</th>
                      <th className="py-3 px-4 font-semibold">Email & Verified</th>
                      <th className="py-3 px-4 font-semibold">System Role</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Registered</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{u.name || 'Unnamed'}</span>
                          <span className="text-[10px] font-mono text-slate-500">{u.id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300 block">{u.email}</span>
                          {u.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unverified</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Loading user management...</div>}>
      <UsersContent />
    </Suspense>
  );
}
