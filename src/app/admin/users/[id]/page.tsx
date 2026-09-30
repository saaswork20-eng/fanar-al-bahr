'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Users,
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Store,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'BUYER';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  orders?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const [userRes, meRes] = await Promise.all([
        fetch(`/api/v1/admin/users/${userId}`),
        fetch('/api/v1/auth/me'),
      ]);

      if (userRes.status === 401 || userRes.status === 403) {
        router.push('/admin/login');
        return;
      }

      const userData = await userRes.json();
      const meData = await meRes.json();

      if (userData.success) {
        setUser(userData.user);
      }
      if (meData.success && meData.user) {
        setCurrentAdminId(meData.user.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setShowStatusModal(false);
        await fetchUser();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update status' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network connection error' });
    } finally {
      setActionLoading(false);
    }
  };

  const isSelf = currentAdminId === user?.id;
  const isOtherAdmin = user?.role === 'ADMIN' && !isSelf;

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">
                Account Inspection: {user?.name || user?.email || 'Loading...'}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">UID: {userId}</p>
            </div>
          </div>

          <button
            onClick={fetchUser}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </header>

        <main className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Self Protection Notice */}
          {isSelf && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Active Admin Identity:</strong> You are currently authenticated as this administrator.
                Self-suspension and privilege modification guards are enforced.
              </span>
            </div>
          )}

          {loading || !user ? (
            <div className="py-16 text-center text-xs text-slate-500">Loading user file...</div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xl text-indigo-300">
                      {user.name ? user.name[0] : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{user.name || 'Unnamed User'}</h2>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            user.role === 'ADMIN'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2">
                    {user.status === 'ACTIVE' ? (
                      <button
                        onClick={() => setShowStatusModal(true)}
                        disabled={isSelf || isOtherAdmin}
                        className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isSelf || isOtherAdmin
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-200'
                        }`}
                        title={
                          isSelf
                            ? 'Cannot suspend yourself'
                            : isOtherAdmin
                            ? 'Cannot suspend peer admins'
                            : 'Suspend User Account'
                        }
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Suspend Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus('ACTIVE')}
                        disabled={actionLoading}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reactivate Account</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">User ID</span>
                    <span className="font-mono text-slate-300 break-all">{user.id}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Email Verified</span>
                    <span className="text-slate-200 font-medium">
                      {user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : 'Unverified'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Created Date</span>
                    <span className="text-slate-200 font-medium">{new Date(user.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Last Activity</span>
                    <span className="text-slate-200 font-medium">{new Date(user.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Order History (If Customer) */}
              {user.orders && user.orders.length > 0 && (
                <div className="bg-[#0f131c] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    <span>Purchase History ({user.orders.length} orders)</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Order #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Total Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {user.orders.map((o) => (
                          <tr key={o.id}>
                            <td className="py-2.5 px-3 font-mono font-semibold text-white">{o.orderNumber}</td>
                            <td className="py-2.5 px-3 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{formatINR(o.totalAmount)}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Account Suspension</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to suspend account <strong className="text-white">{user?.email}</strong>?
              The user will immediately be blocked from logging in and accessing storefront operations.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus('SUSPENDED')}
                disabled={actionLoading}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
